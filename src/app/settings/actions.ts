
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const clinicInfoSchema = z.object({
    clinicId: z.string().uuid(),
    name: z.string().min(1, "El nombre de la clínica no puede estar vacío."),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    logo_url: z.string().url().optional().nullable(),
    terms_and_conditions: z.string().optional().nullable(),
});

export async function updateClinicInfo(data: z.infer<typeof clinicInfoSchema>) {
    const supabase = createClient();
    
    // 1. Validate user permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'No autorizado: Usuario no autenticado.' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id, role')
        .eq('id', user.id)
        .single();
    
    if (!profile || profile.clinic_id !== data.clinicId || profile.role !== 'admin') {
        return { error: 'No autorizado: No tienes permiso para actualizar esta clínica.' };
    }

    // 2. Validate input data
    const parsedData = clinicInfoSchema.safeParse(data);
    if (!parsedData.success) {
        return { error: `Datos inválidos: ${parsedData.error.errors.map(e => e.message).join(', ')}` };
    }

    const { clinicId, ...updateData } = parsedData.data;

    // 3. Perform the update
    const { error } = await supabase
        .from('clinics')
        .update(updateData)
        .eq('id', clinicId);

    if (error) {
        console.error("Error updating clinic info:", error);
        return { error: `Error al actualizar la información: ${error.message}` };
    }
    
    revalidatePath('/settings');
    revalidatePath('/patients/[id]', 'layout'); // To refresh clinic data for consent forms and layout
    return { error: null };
}


export async function uploadClinicLogo(file: File, clinicId: string) {
    const supabase = createClient();

    // Validate user permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autorizado: Usuario no autenticado.' };

    const { data: profile } = await supabase.from('profiles').select('clinic_id, role').eq('id', user.id).single();
    if (!profile || profile.clinic_id !== clinicId || profile.role !== 'admin') {
        return { error: 'No autorizado: No tienes permiso para realizar esta acción.' };
    }

    const filePath = `${clinicId}/logo-${Date.now()}.${file.name.split('.').pop()}`;

    const { error: uploadError } = await supabase.storage
        .from('clinic-logos')
        .upload(filePath, file, {
            upsert: true, // Overwrite if file with same name exists
        });

    if (uploadError) {
        console.error('Error uploading logo:', uploadError);
        return { error: `Error al subir el logo: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
        .from('clinic-logos')
        .getPublicUrl(filePath);

    return { publicUrl, error: null };
}


export async function updateTheme(clinicId: string, theme: any) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'No autorizado' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id, role')
        .eq('id', user.id)
        .single();
    
    if (!profile || profile.clinic_id !== clinicId || profile.role !== 'admin') {
        return { error: 'No tienes permisos para actualizar el tema.' };
    }

    const { error } = await supabase
        .from('clinics')
        .update({ theme: theme })
        .eq('id', clinicId);

    if (error) {
        console.error('Error updating theme:', error);
        return { error: 'No se pudo actualizar el tema.' };
    }

    revalidatePath('/settings', 'layout');
    
    return { error: null };
}
