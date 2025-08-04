
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isBefore, subHours, format, startOfDay, endOfDay } from 'date-fns';
import { createNotification } from "../notifications/actions";

export async function autoCompleteAppointments(clinicId: string) {
    const supabase = createClient();
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
    const supabase = createClient();
    
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
        
        // --- Create Notification ---
        const { data: patient } = await supabase.from('patients').select('first_name, last_name').eq('id', patient_id).single();
        if (patient) {
            await createNotification({
                clinic_id: profile.clinic_id,
                user_id: doctor_id, // Notify the doctor
                title: 'Nueva Cita Agendada',
                message: `Se te asignó una nueva cita con ${patient.first_name} ${patient.last_name} para el ${appointment_date} a las ${appointment_time}.`,
                link_to: `/patients/${patient_id}`,
                triggered_by: user.id
            });
        }
        // --- End Notification ---
        
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
    const supabase = createClient();
    
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
    const supabase = createClient();

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
    const supabase = createClient();
    
    const { error } = await supabase.from('appointments').delete().eq('id', id);

    if (error) {
        console.error("Error deleting appointment:", error);
        return { error: "No se pudo eliminar la cita." };
    }

    revalidatePath('/appointments');
    return { error: null };
}


export async function getAppointmentsForPatient(patientId: string) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_appointments_for_patient', { p_patient_id: patientId });

    if (error) {
        console.error('Error fetching appointments for patient:', error);
        return [];
    }

    return data;
}

export async function getDoctorAvailability(doctorId: string, date: string) {
    if (!doctorId || !date) {
        return { error: "Doctor y fecha son requeridos.", data: [] };
    }

    const supabase = createClient();
    
    // 1. Define working hours and time slots
    const workDayStart = 8; // 8 AM
    const workDayEnd = 17; // 5 PM (17:00)
    const slotDuration = 30; // in minutes
    const allSlots: string[] = [];

    for (let hour = workDayStart; hour <= workDayEnd; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
             if (hour === workDayEnd && minute > 30) continue; // Don't add slots past 17:30
            allSlots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
        }
    }
    
    // 2. Fetch existing appointments for the doctor on that day
    const { data: existingAppointments, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', date)
        .in('status', ['Scheduled', 'In-progress']);

    if (error) {
        console.error("Error fetching doctor's appointments:", error);
        return { error: "No se pudo obtener la disponibilidad del doctor.", data: [] };
    }

    // 3. Filter out booked slots
    const bookedSlots = existingAppointments.map(app => app.appointment_time.substring(0, 5));
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
    
    return { error: null, data: availableSlots };
}

    