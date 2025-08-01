
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
    const supabase = createClient();
    const parsedData = createNotificationSchema.safeParse(input);

    if (!parsedData.success) {
        console.error("Invalid notification data:", parsedData.error);
        return { error: `Invalid notification data: ${parsedData.error.message}` };
    }

    // Since we're using a service_role key, Supabase might not know which user is performing the action,
    // which can conflict with RLS policies.
    // We can call a function to set the `auth.uid()` for the current transaction.
    if (parsedData.data.triggered_by) {
        await supabase.rpc('set_auth_uid', { uid: parsedData.data.triggered_by });
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
