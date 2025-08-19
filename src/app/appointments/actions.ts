'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isBefore, subHours, format, startOfDay, endOfDay } from 'date-fns';
import { createAppointmentNotification } from "../notifications/actions";
import { google } from 'googleapis';

export async function autoCompleteAppointments(clinicId: string) {
    const supabase = await createClient();
    const oneHourAgo = format(subHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss");

    // This is a simplified approach. A proper way would be to create a timestamp column.
    // For now, we will manually filter.
     const { data: allPotentials, error: fetchAllError } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time')
        .eq('clinic_id', clinicId)
        .in('status', ['Scheduled', 'In-progress'])
        .lte('appointment_date', oneHourAgo.split('T')[0]); // Get all appointments up to today

     if (fetchAllError) {
        console.error("Error fetching appointments for auto-complete:", fetchAllError);
        return;
    }

    const now = new Date();
    const idsToUpdate = allPotentials
        .filter(app => {
            const [hours, minutes] = app.appointment_time.split(':');
            const appDateTime = new Date(`${app.appointment_date}T${hours}:${minutes}:00`);
            return isBefore(appDateTime, subHours(now, 1));
        })
        .map(app => app.id);


    if (idsToUpdate.length === 0) {
        return; // Nothing to update
    }

    // 2. Update their status to 'Completed'
    const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'Completed' })
        .in('id', idsToUpdate);

    if (updateError) {
        console.error('Error auto-completing appointments:', updateError);
    } else {
        console.log(`Auto-completed ${idsToUpdate.length} appointments.`);
    }
}


const appointmentSchema = z.object({
  patient_id: z.string().uuid("Seleccione un paciente."),
  doctor_id: z.string().uuid("Seleccione un doctor."),
  service_description: z.string().min(1, "La descripción del servicio es requerida."),
  appointment_date: z.string().refine((date) => /^\d{4}-\d{2}-\d{2}$/.test(date), "Formato de fecha inválido. Debe ser YYYY-MM-DD."),
  appointment_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido."),
  status: z.enum(['Scheduled', 'Completed', 'Canceled', 'In-progress']),
});

export async function createAppointment(data: z.infer<typeof appointmentSchema>) {
    const supabase = await createClient();
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { error: "No autorizado. El usuario no está autenticado." };
        }

        const { data: profile, error: profileError } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
        if (profileError || !profile) {
            return { error: "Perfil de usuario no encontrado." };
        }

        const parsedData = appointmentSchema.safeParse(data);
        if (!parsedData.success) {
            return { error: `Datos inválidos: ${parsedData.error.errors.map(e => e.message).join(', ')}` };
        }
        
        const { patient_id, doctor_id, appointment_date, appointment_time } = parsedData.data;

        // --- Conflict Detection ---
        const { data: existingAppointments, error: conflictError } = await supabase
            .from('appointments')
            .select('id, patient_id, doctor_id')
            .eq('clinic_id', profile.clinic_id)
            .eq('appointment_date', appointment_date)
            .eq('appointment_time', appointment_time)
            .in('status', ['Scheduled', 'In-progress'])
            .or(`patient_id.eq.${patient_id},doctor_id.eq.${doctor_id}`);


        if (conflictError) {
            console.error("Error checking for conflicts:", conflictError);
            return { error: "No se pudo verificar si hay conflictos de citas." };
        }

        if (existingAppointments && existingAppointments.length > 0) {
            const patientConflict = existingAppointments.find(a => a.patient_id === patient_id);
            if (patientConflict) {
                 return { error: `Este paciente ya tiene una cita programada a esta hora.` };
            }

            const doctorConflict = existingAppointments.find(a => a.doctor_id === doctor_id);
            if (doctorConflict) {
                 return { error: `Este doctor ya tiene una cita programada a esta hora.` };
            }
        }
        // --- End Conflict Detection ---
        
        const dataToInsert = {
            ...parsedData.data,
            clinic_id: profile.clinic_id
        };
        
        const { error: insertError } = await supabase.from('appointments').insert(dataToInsert);

        if (insertError) {
            console.error("Supabase insert failed:", insertError);
            return { error: `No se pudo crear la cita en la base de datos. Código: ${insertError.code}. Detalles: ${insertError.message}` };
        }
        
        // --- Create Notifications ---
        const { data: patient } = await supabase.from('patients').select('first_name, last_name').eq('id', patient_id).single();
        if (patient) {
            // Get doctor info
            const { data: doctor } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', doctor_id)
                .single();

            // Create appointment notification with the helper function
            await createAppointmentNotification(
                'appointment_created',
                {
                    patientId: patient_id,
                    patientName: `${patient.first_name} ${patient.last_name}`,
                    doctorId: doctor_id,
                    doctorName: doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Doctor no asignado',
                    date: appointment_date,
                    time: appointment_time,
                    service: parsedData.data.service_description,
                },
                profile.clinic_id,
                user.id
            );
        }
        // --- End Notifications ---
        
        // Llamar creación de evento Google Calendar (no bloquear flujo)
        createGoogleCalendarEvent(parsedData.data.doctor_id, {
          ...parsedData.data,
          clinic_id: profile.clinic_id,
        });
        
        revalidatePath('/appointments');
        revalidatePath('/dashboard');
        return { error: null };

    } catch (e: any) {
        console.error("An unexpected error occurred in createAppointment:", e);
        return { error: `Un error inesperado ocurrió: ${e.message}` };
    }
}

const updateAppointmentSchema = appointmentSchema.extend({
    id: z.string().uuid(),
}).partial(); // Make all fields optional for partial updates

export async function updateAppointment(data: z.infer<typeof updateAppointmentSchema>) {
    const supabase = await createClient();
    
    const parsedData = updateAppointmentSchema.safeParse(data);
    if (!parsedData.success) {
        return { error: `Datos inválidos: ${parsedData.error.errors.map(e => e.message).join(', ')}` };
    }

    const { id, ...updateData } = parsedData.data;

    if (!id) {
        return { error: "ID de la cita es requerido." };
    }
    
    const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id);

    if (error) {
        console.error("Error updating appointment:", error);
        return { error: "No se pudo actualizar la cita." };
    }

    // Get appointment details for notification
    const { data: appointment } = await supabase
        .from('appointments')
        .select(`
            *,
            patients (first_name, last_name),
            profiles!doctor_id(first_name, last_name)
        `)
        .eq('id', id)
        .single();

    if (appointment) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
            .from('profiles')
            .select('clinic_id')
            .eq('id', user?.id)
            .single();

        if (profile && user) {
            await createAppointmentNotification(
                updateData.status === 'Canceled' ? 'appointment_cancelled' : 'appointment_updated',
                {
                    patientId: appointment.patient_id,
                    patientName: `${appointment.patients.first_name} ${appointment.patients.last_name}`,
                    doctorId: appointment.doctor_id,
                    doctorName: `Dr. ${appointment.profiles.first_name} ${appointment.profiles.last_name}`,
                    date: appointment.appointment_date,
                    time: appointment.appointment_time,
                    service: appointment.service_description,
                },
                profile.clinic_id,
                user.id
            );
        }
    }

    revalidatePath('/appointments');
    return { error: null };
}


export async function getAppointments(filters: { 
    startDate: string, 
    endDate: string,
    patientId?: string | null,
    doctorId?: string | null,
    status?: string | null,
}) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
    if (!profile) return [];
    
    // Auto-complete appointments before fetching
    await autoCompleteAppointments(profile.clinic_id);

    let query = supabase
        .from('appointments')
        .select(`
            *,
            patients (*),
            profiles!doctor_id(*)
        `)
        .eq('clinic_id', profile.clinic_id)
        .gte('appointment_date', filters.startDate)
        .lte('appointment_date', filters.endDate)
        .order('appointment_date', { ascending: false });

    // Apply filters
    if (filters.patientId) {
        query = query.eq('patient_id', filters.patientId);
    }
    if (filters.doctorId) {
        query = query.eq('doctor_id', filters.doctorId);
    }
    if (filters.status) {
        query = query.eq('status', filters.status);
    }

    const { data, error } = await query;


    if (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }
    
    // Auto-complete logic
    const now = new Date();
    return data.map(app => {
        const doctorProfile = app.profiles;
        const [hours, minutes] = app.appointment_time.split(':');
        const appointmentDateTime = new Date(`${app.appointment_date}T${hours}:${minutes}:00`);

        let finalStatus = app.status;
        // This is now redundant as autoCompleteAppointments handles it, but it's a good fallback for immediate UI feedback.
        if ((app.status === 'Scheduled' || app.status === 'In-progress') && isBefore(appointmentDateTime, subHours(now, 1))) {
            finalStatus = 'Completed';
        }

        return {
            id: app.id,
            patientName: app.patients ? `${app.patients.first_name} ${app.patients.last_name}` : 'Paciente Eliminado',
            doctor: doctorProfile ? `Dr. ${doctorProfile.first_name} ${doctorProfile.last_name}` : 'Doctor no asignado',
            service: app.service_description,
            time: app.appointment_time,
            date: app.appointment_date,
            status: finalStatus,
            patientId: app.patient_id,
            doctorId: app.doctor_id,
        }
    });
}


export async function deleteAppointment(id: string) {
    const supabase = await createClient();
    
    const { error } = await supabase.from('appointments').delete().eq('id', id);

    if (error) {
        console.error("Error deleting appointment:", error);
        return { error: "No se pudo eliminar la cita." };
    }

    revalidatePath('/appointments');
    return { error: null };
}


export async function getAppointmentsForPatient(patientId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_appointments_for_patient', { p_patient_id: patientId });

    if (error) {
        console.error('Error fetching appointments for patient:', error);
        return [];
    }

    return data;
}

export async function getDoctorAvailability(doctorId?: string, date?: string, patientId?: string) {
    if (!date || (!doctorId && !patientId)) {
        return { error: "Fecha y (doctor o paciente) son requeridos.", data: [] };
    }

    const supabase = await createClient();

    // 1. Get current user's clinic_id (we need clinic schedule)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado.", data: [] };
    const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
    if (!profile?.clinic_id) return { error: "Perfil o clínica no encontrada.", data: [] };

    // 2. Fetch clinic schedule
    const { data: clinic, error: clinicErr } = await supabase.from('clinics').select('schedule').eq('id', profile.clinic_id).single();
    if (clinicErr) {
        console.error('Error fetching clinic schedule:', clinicErr);
        return { error: 'No se pudo obtener el horario de la clínica.', data: [] };
    }

    const schedule = clinic?.schedule || {};

    // helper: convert 'HH:mm' -> minutes since midnight
    const timeToMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
    };
    const minutesToTime = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

    const slotDuration = 30; // minutes

    // Map JS date -> schedule key (clinic schedule uses english keys like monday...)
    const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const dayIndex = new Date(date + 'T00:00:00').getDay();
    const dayKey = weekdays[dayIndex];

    // Read intervals for the day and sanitize them. This handles malformed or ambiguous times
    // saved previously (e.g. '03:00' that actually meant 15:00). We attempt to repair common cases
    // without changing DB: parse times, reject invalid intervals, sort and apply heuristics.
    const rawIntervals: any[] = Array.isArray(schedule?.[dayKey]) ? schedule[dayKey] : [];

    const normalizeTimeString = (input: any) => {
        if (!input) return '';
        const s = String(input).trim();
        // If already in HH:mm, keep it
        const mm = s.match(/^(\d{1,2}):(\d{2})$/);
        if (mm) {
            const hh = String(Number(mm[1])).padStart(2, '0');
            return `${hh}:${mm[2]}`;
        }
        // Handle forms like '08:00 a.m.' '3:00 pm' etc
        const cleaned = s.replace(/\./g, '').toLowerCase();
        const isAm = cleaned.includes('a');
        const isPm = cleaned.includes('p');
        const digits = cleaned.replace(/[^0-9:]/g, '').trim();
        const parts = digits.split(':');
        let hr = Number(parts[0] || 0);
        const mn = parts[1] || '00';
        if (isPm && hr < 12) hr += 12;
        if (isAm && hr === 12) hr = 0;
        // Fallback: if we only have a single number like '9' treat as 09:00
        return `${String(hr).padStart(2,'0')}:${String(mn).padStart(2,'0')}`;
    };

    // Parse and normalize
    const parsedIntervals = rawIntervals.map(iv => {
        return {
            start: normalizeTimeString(iv?.start),
            end: normalizeTimeString(iv?.end),
        };
    }).filter(iv => iv.start && iv.end);

    // Convert to minutes and filter invalids
    let intervalsMinutes = parsedIntervals.map(iv => {
        const s = timeToMinutes(iv.start);
        const e = timeToMinutes(iv.end);
        return { startMin: s, endMin: e, orig: iv };
    }).filter(iv => iv.endMin > iv.startMin);

    // Heuristic fix: if an interval spans an excessively long period (likely due to AM/PM mis-parse)
    // and there exists another (short) interval in the morning, then assume this long interval's
    // start was intended as PM and add 12h to start (e.g. '03:00-19:00' -> '15:00-19:00').
    const hasMorningShortInterval = intervalsMinutes.some(iv => {
        const dur = iv.endMin - iv.startMin;
        return iv.startMin >= 8 * 60 && iv.startMin <= 12 * 60 && dur <= 6 * 60;
    });

    intervalsMinutes = intervalsMinutes.map(iv => {
        const dur = iv.endMin - iv.startMin;
        if (dur > 10 * 60 && iv.startMin < 7 * 60 && hasMorningShortInterval) {
            // bump start by 12 hours
            return { ...iv, startMin: iv.startMin + 12 * 60 };
        }
        return iv;
    }).filter(iv => iv.endMin > iv.startMin);

    // Sort by start
    intervalsMinutes.sort((a, b) => a.startMin - b.startMin);

    // Build all possible slots from sanitized intervals
    const allSlots: string[] = [];
    for (const intv of intervalsMinutes) {
        for (let t = intv.startMin; t + slotDuration <= intv.endMin; t += slotDuration) {
            allSlots.push(minutesToTime(t));
        }
    }

    // Remove duplicates and ensure chronological order (handles overlapping/duplicate intervals)
    const uniqueAllSlots = Array.from(new Set(allSlots)).sort();

    // If clinic has no intervals for that day, return empty (closed)
    if (uniqueAllSlots.length === 0) {
        return { error: null, data: [] };
    }

    // 2. Fetch existing appointments for the doctor and/or the patient on that day and remove booked slots
    let appointmentQuery: any = supabase
        .from('appointments')
        .select('appointment_time, doctor_id, patient_id')
        .eq('appointment_date', date)
        .in('status', ['Scheduled', 'In-progress']);

    if (doctorId && patientId) {
        // Find appointments where doctor OR patient matches
        appointmentQuery = appointmentQuery.or(`doctor_id.eq.${doctorId},patient_id.eq.${patientId}`);
    } else if (doctorId) {
        appointmentQuery = appointmentQuery.eq('doctor_id', doctorId);
    } else if (patientId) {
        appointmentQuery = appointmentQuery.eq('patient_id', patientId);
    }

    const { data: existingAppointments, error } = await appointmentQuery;

    if (error) {
        console.error("Error fetching doctor's appointments:", error);
        return { error: "No se pudo obtener la disponibilidad del doctor.", data: [] };
    }

    const bookedSlots = Array.from(new Set((existingAppointments || []).map((app: any) => (app.appointment_time || '').substring(0,5))));
    const availableSlots = uniqueAllSlots.filter(slot => !bookedSlots.includes(slot));

    return { error: null, data: availableSlots };
}

async function createGoogleCalendarEvent(doctorId: string, appointmentData: any) {
    const supabase = await createClient();

    try {
        // 1. Get doctor's Google integration (refresh token and optional calendar id)
        const { data: integration, error: integrationError } = await supabase
            .from('google_integrations')
            .select('refresh_token, calendar_id')
            .eq('user_id', doctorId)
            .single();

        if (integrationError) {
            console.error('[createGoogleCalendarEvent] Error fetching google_integrations:', integrationError);
            return;
        }

        if (!integration?.refresh_token) {
            // Doctor hasn't connected Google Calendar
            return;
        }

        // 2. Get patient info (name + email) to add as attendee and to build the summary
        const { data: patient } = await supabase
            .from('patients')
            .select('first_name, last_name, email')
            .eq('id', appointmentData.patient_id)
            .single();

        const patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'Paciente';
        const patientEmail = patient?.email;

        // 3. Compute start and end datetimes
        const startDateTime = `${appointmentData.appointment_date}T${appointmentData.appointment_time}:00`;
        const start = new Date(startDateTime);
        const end = new Date(start.getTime() + 30 * 60 * 1000); // +30 minutes
        const startStr = format(start, "yyyy-MM-dd'T'HH:mm:ss");
        const endStr = format(end, "yyyy-MM-dd'T'HH:mm:ss");

        // 4. Build event object according to Google Calendar schema
        const event: any = {
            summary: `Cita con ${patientName}`,
            description: appointmentData.service_description || appointmentData.service || '',
            start: {
                dateTime: startStr,
                timeZone: 'America/New_York',
            },
            end: {
                dateTime: endStr,
                timeZone: 'America/New_York',
            },
            attendees: [
                ...(patientEmail ? [{ email: patientEmail }] : []),
            ],
        };

        // 5. Create an OAuth2 client and set credentials using the stored refresh token
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: integration.refresh_token });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // 6. Insert the event. Use `requestBody` (not `resource`) to match googleapis types.
        await calendar.events.insert({
            calendarId: integration.calendar_id || 'primary',
            requestBody: event,
            sendUpdates: 'all',
        } as any);

        console.log('[createGoogleCalendarEvent] Event created for doctor:', doctorId, event);
    } catch (e) {
        console.error('[createGoogleCalendarEvent] Error creating event:', e);
    }
}