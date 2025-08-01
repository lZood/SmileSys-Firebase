
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isBefore, subHours } from 'date-fns';

const appointmentSchema = z.object({
  patient_id: z.string().uuid("Seleccione un paciente."),
  doctor_id: z.string().uuid("Seleccione un doctor."),
  service_description: z.string().min(1, "La descripción del servicio es requerida."),
  appointment_date: z.string().refine((date) => /^\d{4}-\d{2}-\d{2}$/.test(date), "Formato de fecha inválido. Debe ser YYYY-MM-DD."),
  appointment_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido."),
  status: z.enum(['Scheduled', 'Completed', 'Canceled', 'In-progress']),
});

export async function createAppointment(data: z.infer<typeof appointmentSchema>) {
    console.log("1. [SERVER ACTION] Received data for createAppointment:", data);

    const supabase = createClient();
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error("2. [ERROR] Authentication failed. No user object found.");
            return { error: "No autorizado. El usuario no está autenticado." };
        }
        console.log("2. [AUTH] User authenticated with ID:", user.id);

        const { data: profile, error: profileError } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
        if (profileError || !profile) {
            console.error("3. [ERROR] Failed to fetch user profile or profile is null. Error:", profileError);
            return { error: "Perfil de usuario no encontrado." };
        }
        console.log("3. [PROFILE] User profile found. Clinic ID:", profile.clinic_id);

        const parsedData = appointmentSchema.safeParse(data);
        if (!parsedData.success) {
            console.error("4. [ERROR] Zod validation failed:", parsedData.error.flatten());
            return { error: `Datos inválidos: ${parsedData.error.errors.map(e => e.message).join(', ')}` };
        }
        console.log("4. [VALIDATION] Data passed Zod validation.");

        // NOTE: Past date validation is now handled on the client-side to avoid timezone issues on the server.
        // The UI prevents creating appointments for past dates.

        const dataToInsert = {
            ...parsedData.data,
            clinic_id: profile.clinic_id
        };
        
        console.log("6. [INSERTION] Attempting to insert the following data into 'appointments' table:", dataToInsert);
        const { error: insertError } = await supabase.from('appointments').insert(dataToInsert);

        if (insertError) {
            console.error("7. [DB ERROR] Supabase insert failed:", insertError);
            return { error: `No se pudo crear la cita en la base de datos. Código: ${insertError.code}. Detalles: ${insertError.message}` };
        }
        
        console.log("7. [SUCCESS] Appointment created successfully.");
        revalidatePath('/appointments');
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


export async function getAppointments(startDate: string, endDate: string) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
    if (!profile) return [];

    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            patients (id, first_name, last_name),
            doctors:profiles (id, first_name, last_name)
        `)
        .eq('clinic_id', profile.clinic_id)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date', { ascending: false });

    if (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }
    
    // Auto-complete logic
    const now = new Date();
    return data.map(app => {
        const [hours, minutes] = app.appointment_time.split(':');
        const appointmentDateTime = new Date(`${app.appointment_date}T${hours}:${minutes}:00`);

        let finalStatus = app.status;
        // If appointment is more than 1 hour ago and is still scheduled/in-progress, mark as completed for display
        if ((app.status === 'Scheduled' || app.status === 'In-progress') && isBefore(appointmentDateTime, subHours(now, 1))) {
            finalStatus = 'Completed';
        }

        return {
            id: app.id,
            patientName: app.patients ? `${app.patients.first_name} ${app.patients.last_name}` : 'Paciente Eliminado',
            doctor: app.doctors ? `Dr. ${app.doctors.first_name} ${app.doctors.last_name}` : 'Doctor no asignado',
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
