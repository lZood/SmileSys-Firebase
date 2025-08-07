
'use server';

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export type NotificationType = 'appointment_created' | 'appointment_updated' | 'appointment_cancelled' | 'appointment_reminder';

const createNotificationSchema = z.object({
    clinic_id: z.string().uuid(),
    user_id: z.string().uuid(), // The user who should receive the notification
    title: z.string(),
    message: z.string(),
    type: z.enum(['appointment_created', 'appointment_updated', 'appointment_cancelled', 'appointment_reminder']),
    link_to: z.string().optional(),
    reference_id: z.string().uuid().optional(), // ID of the appointment
    triggered_by: z.string().uuid().optional(), // The user who caused the notification
    read: z.boolean().default(false),
});

export async function createNotification(input: z.infer<typeof createNotificationSchema>) {
    const supabase = await createClient();
    const parsedData = createNotificationSchema.safeParse(input);

    if (!parsedData.success) {
        console.error("Invalid notification data:", parsedData.error);
        return { error: `Invalid notification data: ${parsedData.error.message}` };
    }
    
    const { error } = await supabase
        .from('notifications')
        .insert(parsedData.data);
    
    if (error) {
        console.error("Error creating notification:", error);
        return { error: `Could not create notification: ${error.message}` };
    }

    return { error: null };
}

export async function createAppointmentNotification(
    type: NotificationType,
    appointmentData: {
        patientId: string,
        patientName: string,
        doctorId: string,
        doctorName: string,
        date: string,
        time: string,
        service: string,
    },
    clinicId: string,
    triggeredBy?: string
) {
    const supabase = await createClient();

    // Get patient and doctor profiles to send them notifications
    const { data: userIds } = await supabase
        .from('profiles')
        .select('id')
        .in('id', [appointmentData.patientId, appointmentData.doctorId]);

    if (!userIds) return;

    const notifications = userIds.map(user => {
        const isPatient = user.id === appointmentData.patientId;
        const formattedDate = new Date(appointmentData.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let title = '';
        let message = '';

        switch (type) {
            case 'appointment_created':
                title = isPatient 
                    ? 'Nueva Cita Programada'
                    : 'Nueva Cita Asignada';
                message = isPatient
                    ? `Tu cita para ${appointmentData.service} con ${appointmentData.doctorName} ha sido programada para el ${formattedDate} a las ${appointmentData.time}.`
                    : `Nueva cita con ${appointmentData.patientName} programada para el ${formattedDate} a las ${appointmentData.time}.`;
                break;

            case 'appointment_updated':
                title = 'Cita Modificada';
                message = isPatient
                    ? `Tu cita con ${appointmentData.doctorName} ha sido modificada para el ${formattedDate} a las ${appointmentData.time}.`
                    : `La cita con ${appointmentData.patientName} ha sido modificada para el ${formattedDate} a las ${appointmentData.time}.`;
                break;

            case 'appointment_cancelled':
                title = 'Cita Cancelada';
                message = isPatient
                    ? `Tu cita con ${appointmentData.doctorName} para el ${formattedDate} ha sido cancelada.`
                    : `La cita con ${appointmentData.patientName} para el ${formattedDate} ha sido cancelada.`;
                break;

            case 'appointment_reminder':
                title = 'Recordatorio de Cita';
                message = isPatient
                    ? `Recordatorio: Tienes una cita con ${appointmentData.doctorName} mañana a las ${appointmentData.time}.`
                    : `Recordatorio: Tienes una cita con ${appointmentData.patientName} mañana a las ${appointmentData.time}.`;
                break;
        }

        return {
            clinic_id: clinicId,
            user_id: user.id,
            title,
            message,
            type,
            link_to: `/appointments?date=${appointmentData.date}`,
            reference_id: appointmentData.patientId,
            triggered_by: triggeredBy,
            read: false,
        };
    });

    const { error } = await supabase
        .from('notifications')
        .insert(notifications);

    if (error) {
        console.error("Error creating appointment notifications:", error);
        return { error: "No se pudieron crear las notificaciones" };
    }

    return { error: null };
}

// Función para obtener las notificaciones de un usuario
export async function getUserNotifications() {
    const supabase = await createClient();
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching notifications:", error);
            return [];
        }

        return data;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
}

// Función para marcar notificaciones como leídas
export async function markNotificationsAsRead(notificationIds: string[]) {
    const supabase = await createClient();
    
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds);

    if (error) {
        console.error("Error marking notifications as read:", error);
        return { error: "No se pudieron actualizar las notificaciones" };
    }

    return { error: null };
}

    