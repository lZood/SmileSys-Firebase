

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
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'No autorizado: Usuario no autenticado.' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id, roles')
        .eq('id', user.id)
        .single();
    
    if (!profile || profile.clinic_id !== data.clinicId || !profile.roles.includes('admin')) {
        return { error: 'No autorizado: No tienes permiso para actualizar esta clínica.' };
    }

    const parsedData = clinicInfoSchema.safeParse(data);
    if (!parsedData.success) {
        return { error: `Datos inválidos: ${parsedData.error.errors.map(e => e.message).join(', ')}` };
    }

    const { clinicId, ...updateData } = parsedData.data;

    const { error } = await supabase
        .from('clinics')
        .update(updateData)
        .eq('id', clinicId);

    if (error) {
        console.error("Error updating clinic info:", error);
        return { error: `Error al actualizar la información: ${error.message}` };
    }
    
    revalidatePath('/settings');
    revalidatePath('/patients/[id]', 'layout'); 
    return { error: null };
}


export async function uploadClinicLogo(file: File, clinicId: string) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autorizado: Usuario no autenticado.' };

    const { data: profile } = await supabase.from('profiles').select('clinic_id, roles').eq('id', user.id).single();
    if (!profile || profile.clinic_id !== clinicId || !profile.roles.includes('admin')) {
        return { error: 'No autorizado: No tienes permiso para realizar esta acción.' };
    }

    const filePath = `${clinicId}/logo-${Date.now()}.${file.name.split('.').pop()}`;

    const { error: uploadError } = await supabase.storage
        .from('clinic-logos')
        .upload(filePath, file, {
            upsert: true,
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


const inviteMemberSchema = z.object({
  clinicId: z.string().uuid(),
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres."),
  jobTitle: z.string().min(2, "El puesto es requerido."),
  email: z.string().email("Email inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  roles: z.array(z.string()).min(1, "Debes seleccionar al menos un rol."),
});

export async function inviteMember(data: z.infer<typeof inviteMemberSchema>) {
    const supabase = createClient();
    
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) {
        return { error: 'No autorizado.' };
    }

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('clinic_id, roles')
        .eq('id', adminUser.id)
        .single();
    
    if (!adminProfile || adminProfile.clinic_id !== data.clinicId || !adminProfile.roles.includes('admin')) {
        return { error: 'No tienes permiso para invitar miembros a esta clínica.' };
    }

    const parsedData = inviteMemberSchema.safeParse(data);
    if (!parsedData.success) {
        return { error: `Datos inválidos: ${parsedData.error.errors.map(e => e.message).join(', ')}` };
    }
    const { clinicId, firstName, lastName, jobTitle, email, password, roles } = parsedData.data;

    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: `${firstName} ${lastName}`,
            roles: roles,
        }
    });

    if (authError) {
        console.error("Error creating user in Auth:", authError);
        return { error: `No se pudo crear el usuario: ${authError.message}` };
    }
     if (!newUser.user) {
        return { error: "No se pudo obtener el objeto de usuario después de la creación." };
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: newUser.user.id,
            clinic_id: clinicId,
            first_name: firstName,
            last_name: lastName,
            roles: roles,
            job_title: jobTitle,
        });

    if (profileError) {
        console.error("Error creating user profile:", profileError);
        await supabase.auth.admin.deleteUser(newUser.user.id);
        return { error: `No se pudo crear el perfil del usuario: ${profileError.message}` };
    }

    revalidatePath('/settings');
    return { error: null };
}

const updateUserPasswordSchema = z.object({
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});


export async function updateUserPassword(data: z.infer<typeof updateUserPasswordSchema>) {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Usuario no autenticado.' };
    }

    const parsedData = updateUserPasswordSchema.safeParse(data);
    if (!parsedData.success) {
        return { error: parsedData.error.errors.map(e => e.message).join(', ') };
    }

    const { error } = await supabase.auth.updateUser({
      password: parsedData.data.newPassword
    });

    if (error) {
        console.error("Error updating user password:", error);
        return { error: `No se pudo actualizar la contraseña: ${error.message}` };
    }

    return { error: null };
}

const userProfileSchema = z.object({
  firstName: z.string().min(2, "El nombre es muy corto."),
  lastName: z.string().min(2, "El apellido es muy corto."),
});

export async function updateUserProfile(data: z.infer<typeof userProfileSchema>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Usuario no autenticado.' };
    }

    const parsedData = userProfileSchema.safeParse(data);
    if (!parsedData.success) {
        return { error: parsedData.error.errors.map(e => e.message).join(', ') };
    }

    const { error } = await supabase
        .from('profiles')
        .update({ first_name: data.firstName, last_name: data.lastName })
        .eq('id', user.id);
    
    if (error) {
        console.error("Error updating user profile:", error);
        return { error: `No se pudo actualizar el perfil: ${error.message}` };
    }

    revalidatePath('/settings');
    return { error: null };
}


const updateMemberRolesSchema = z.object({
    memberId: z.string().uuid(),
    roles: z.array(z.string()).min(1, "El miembro debe tener al menos un rol."),
});

export async function updateMemberRoles(data: z.infer<typeof updateMemberRolesSchema>) {
    const supabase = createClient();
    
    const parsedData = updateMemberRolesSchema.safeParse(data);
    if (!parsedData.success) {
        return { error: parsedData.error.errors.map(e => e.message).join(', ') };
    }
    const { memberId, roles } = parsedData.data;

    // 1. Update roles in profiles table
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ roles })
        .eq('id', memberId);
    
    if (profileError) {
        return { error: `Error al actualizar roles en perfil: ${profileError.message}` };
    }

    // 2. Update roles in auth.users user_metadata
    const { error: authError } = await supabase.auth.admin.updateUserById(
        memberId,
        { user_metadata: { roles: roles } }
    );
    if (authError) {
        return { error: `Error al actualizar metadata de usuario: ${authError.message}` };
    }
    
    revalidatePath('/settings');
    return { error: null };
}

export async function deleteMember(memberId: string) {
    const supabase = createClient();

    // 1. Delete from profiles table (will be handled by CASCADE, but good to be explicit or have policies)
    const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId);

    if (profileError) {
        return { error: `Error al eliminar el perfil: ${profileError.message}` };
    }

    // 2. Delete from auth.users
    const { error: authError } = await supabase.auth.admin.deleteUser(memberId);
    if (authError) {
        // This is problematic as the profile might be gone but auth user remains.
        // A transaction would be ideal here if possible.
        return { error: `Error al eliminar el usuario de autenticación: ${authError.message}` };
    }

    revalidatePath('/settings');
    return { error: null };
}
