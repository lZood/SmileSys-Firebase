
'use server';

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createNotificationSchema = z.object({
    clinic_id: z.string().uuid(),
    user_id: z.string().uuid(), // The user who should receive the notification
    title: z.string(),
    message: z.string(),
    link_to: z.string().optional(),
    triggered_by: z.string().uuid().optional(), // The user who caused the notification
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

    