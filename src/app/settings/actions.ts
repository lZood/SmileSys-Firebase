'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTheme(clinicId: string, theme: any) {
    const supabase = createClient();
    
    const { data, error } = await supabase
        .from('clinics')
        .update({ theme: theme })
        .eq('id', clinicId)
        .select()
        .single();
        
    if(error) {
        console.error("Error updating theme:", error);
        return { error: 'Failed to update theme.' };
    }

    revalidatePath('/settings', 'layout'); // Revalidate to apply new theme instantly

    return { data };
}
