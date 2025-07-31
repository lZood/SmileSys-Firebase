
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { format } from 'date-fns';

const appointmentSchema = z.object({
  patient_id: z.string().uuid("Seleccione un paciente."),
  doctor_id: z.string().uuid("Seleccione un doctor."),
  service_description: z.string().min(1, "La descripción del servicio es requerida."),
  appointment_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Fecha inválida."),
  appointment_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido."),
  status: z.enum(['Scheduled', 'Completed', 'Canceled', 'In-progress']),
});

export async function createAppointment(data: z.infer<typeof appointmentSchema>) {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado." };

    const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
    if (!profile) return { error: "Perfil no encontrado." };

    const parsedData = appointmentSchema.safeParse(data);
    if (!parsedData.success) {
        return { error: `Datos inválidos: ${parsedData.error.errors.map(e => e.message).join(', ')}` };
    }

    // Validar que la fecha no sea en el pasado, comparando solo las fechas en string YYYY-MM-DD
    const appointmentDateString = parsedData.data.appointment_date;
    const todayString = format(new Date(), 'yyyy-MM-dd');

    if (appointmentDateString < todayString) {
        return { error: "No se pueden crear citas en fechas pasadas." };
    }

    const { error } = await supabase.from('appointments').insert({
        ...parsedData.data,
        clinic_id: profile.clinic_id
    });

    if (error) {
        console.error("Error creating appointment:", error);
        return { error: "No se pudo crear la cita." };
    }
    
    revalidatePath('/appointments');
    return { error: null };
}

const updateAppointmentSchema = appointmentSchema.extend({
    id: z.string().uuid(),
});

export async function updateAppointment(data: z.infer<typeof updateAppointmentSchema>) {
    const supabase = createClient();
    
    const parsedData = updateAppointmentSchema.safeParse(data);
    if (!parsedData.success) {
        return { error: `Datos inválidos: ${parsedData.error.errors.map(e => e.message).join(', ')}` };
    }

    const { id, ...updateData } = parsedData.data;
    
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
    
    return data.map(app => ({
        id: app.id,
        patientName: app.patients ? `${app.patients.first_name} ${app.patients.last_name}` : 'Paciente Eliminado',
        doctor: app.doctors ? `Dr. ${app.doctors.first_name} ${app.doctors.last_name}` : 'Doctor no asignado',
        service: app.service_description,
        time: app.appointment_time,
        date: app.appointment_date,
        status: app.status,
        patientId: app.patient_id,
        doctorId: app.doctor_id,
    }));
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
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });

    if (error) {
        console.error('Error fetching appointments for patient:', error);
        return [];
    }

    return data;
}
