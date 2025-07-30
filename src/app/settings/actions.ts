'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTheme(clinicId: string, theme: any) {
    const supabase = createClient();

    const { error } = await supabase
        .from('clinics')
        .update({ theme: theme })
        .eq('id', clinicId);
    
    if (error) {
        console.error('Error updating theme:', error);
        return { error: `Error al actualizar el tema: ${error.message}` };
    }
    
    revalidatePath('/', 'layout');
    return { error: null };
}
