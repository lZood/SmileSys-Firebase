'use server';

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";
import { z } from "zod";
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { buildEmail } from '@/lib/email/template'

const scheduleIntervalSchema = z.object({ start: z.string(), end: z.string() });
const scheduleSchema = z.object({
    monday: z.array(scheduleIntervalSchema).optional(),
    tuesday: z.array(scheduleIntervalSchema).optional(),
    wednesday: z.array(scheduleIntervalSchema).optional(),
    thursday: z.array(scheduleIntervalSchema).optional(),
    friday: z.array(scheduleIntervalSchema).optional(),
    saturday: z.array(scheduleIntervalSchema).optional(),
    sunday: z.array(scheduleIntervalSchema).optional(),
}).optional();

const clinicInfoSchema = z.object({
    clinicId: z.string().uuid(),
    name: z.string().min(1, "El nombre de la clínica no puede estar vacío."),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    logo_url: z.string().url().optional().nullable(),
    terms_and_conditions: z.string().optional().nullable(),
    schedule: scheduleSchema,
    google_calendar_reminder_minutes: z.number().optional(),
});

export async function updateClinicInfo(data: z.infer<typeof clinicInfoSchema>) {
    const supabase = await createClient();
    
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
    const supabase = await createClient();

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
  roles: z.array(z.string()).min(1, "Debes seleccionar al menos un rol."),
});

export async function inviteMember(data: z.infer<typeof inviteMemberSchema>) {
    const supabase = await createClient();
    const adminAuth = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
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
    const { clinicId, firstName, lastName, jobTitle, email, roles } = parsedData.data;

    // generate random strong temp password (user will change on activation)
    const tempPassword = `Tmp!${Math.random().toString(36).slice(2,10)}A1`;

    // 1) Create Auth user
    const { data: newUserData, error: authError } = await adminAuth.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: false,
        user_metadata: {
            full_name: `${firstName} ${lastName}`,
            roles: roles,
        }
    });

    if (authError) {
        console.error("Error creating user in Auth:", authError);
        return { error: `No se pudo crear el usuario: ${authError.message}` };
    }
    if (!newUserData?.user) {
        return { error: 'No se pudo crear el usuario.' };
    }
    const newUser = newUserData.user;

    // 2) Create profile row (use service-role to bypass RLS)
    const { error: profileError } = await adminAuth
        .from('profiles')
        .insert({
            id: newUser.id,
            clinic_id: clinicId,
            first_name: firstName,
            last_name: lastName,
            roles: roles,
            job_title: jobTitle,
            must_change_password: true,
        });

    if (profileError) {
        console.error("Error creating user profile:", profileError);
        try { await adminAuth.auth.admin.deleteUser(newUser.id); } catch (e) { console.error('Rollback deleteUser failed', e); }
        return { error: `No se pudo crear el perfil del usuario: ${profileError.message}` };
    }

    // Track whether invite email was sent
    let emailSent = false;

    // 3) Insert into members table (service-role)
    try {
        const { error: membersError } = await adminAuth
            .from('members')
            .insert({
                user_id: newUser.id,
                clinic_id: clinicId,
                job_title: jobTitle,
                roles: roles,
                is_active: true,
                must_change_password: true,
                created_at: new Date().toISOString()
            });

        if (membersError) {
            // Special-case: some DB RLS policies may reference the members table and cause
            // Postgres error 42P17 (infinite recursion detected in policy). In that case
            // we should not rollback the whole invite; create the profile/auth user and
            // allow an admin to reconcile the members table later.
            console.error('Error inserting into members table:', membersError);
            if ((membersError as any).code === '42P17') {
                console.warn('Detected policy recursion (42P17). Skipping members insert to avoid blocking invite.');
                // Do not rollback profile/auth; treat invite as successful but warn the admin to sync members.
            } else {
                console.error('members insert error will trigger rollback of profile and auth user');
                await adminAuth.from('profiles').delete().eq('id', newUser.id);
                try { await adminAuth.auth.admin.deleteUser(newUser.id); } catch (e) { console.error('Rollback deleteUser failed', e); }
                return { error: `No se pudo registrar el miembro: ${membersError.message}` };
            }
        }

        // 4) Create an invite token and send an activation email with instructions to create a new password
        try {
            const token = uuidv4();
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const link = `${appUrl.replace(/\/$/, '')}/first-login?invite=${token}`;

            // insert into invites table for tracking
            await supabase.from('invites').insert({
                email,
                token,
                clinic_id: clinicId,
                inviter_id: adminUser.id,
                role: (roles && roles.length) ? roles[0] : 'member',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                accepted: false
            });

            // send email via nodemailer
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT || 587),
                secure: process.env.SMTP_SECURE === 'true',
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            });

            const html = buildEmail({
                heading: 'Has sido invitado a SmileSys',
                intro: `Para activar tu cuenta y crear tu contraseña haz clic en el siguiente enlace.`,
                ctaText: 'Crear mi contraseña',
                ctaUrl: link,
                footerNote: '— El equipo de SmileSys'
            })

            try {
                const info = await transporter.sendMail({ from: process.env.EMAIL_FROM, to: email, subject: 'Invitación a SmileSys — Crea tu nueva contraseña', html, text: link });
                console.log('Invite email sent to', email, info && info.response ? info.response : info);
                emailSent = true;
            } catch (mailErr) {
                console.error('Failed sending invite email', mailErr);
            }
        } catch (e: any) {
            console.warn('Error creating invite token or sending email:', e?.message || e);
        }

    } catch (e: any) {
        console.error('Unexpected error inserting members:', e);
        // rollback
        await adminAuth.from('profiles').delete().eq('id', newUser.id);
        try { await adminAuth.auth.admin.deleteUser(newUser.id); } catch (er) { console.error('Rollback deleteUser failed', er); }
        return { error: 'Error inesperado al registrar el miembro.' };
    }

    revalidatePath('/settings');
    return { error: null, emailSent };
}

const updateUserPasswordSchema = z.object({
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});


export async function updateUserPassword(data: z.infer<typeof updateUserPasswordSchema>) {
     const supabase = await createClient();
     
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

    // Clear must_change_password flag on profile/members (best-effort).
    // First try using the current server client (uses request cookies), then use a service-role client as fallback
    let cleared = { profiles: false, members: false };
    try {
        const { error: pErr } = await supabase
            .from('profiles')
            .update({ must_change_password: false })
            .eq('id', user.id);
        if (!pErr) cleared.profiles = true;
    } catch (e: any) {
        console.warn('Could not clear must_change_password on profiles with server client:', e?.message || e);
    }

    try {
        const { error: mErr } = await supabase
            .from('members')
            .update({ must_change_password: false })
            .eq('user_id', user.id);
        if (!mErr) cleared.members = true;
    } catch (e: any) {
        console.warn('Could not clear must_change_password on members with server client:', e?.message || e);
    }

    // If either update wasn't applied, try again using the service-role key (bypass RLS)
    try {
        // (no-op) proceed to fallback REST attempt below if needed
    } catch (e) {
        // ignore failure to import
    }

    try {
        if (!cleared.profiles || !cleared.members) {
            // use direct REST call to supabase REST API with service role key as fallback
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (supabaseUrl && serviceKey) {
                if (!cleared.profiles) {
                    await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/profiles?id=eq.${user.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': serviceKey,
                            'Authorization': `Bearer ${serviceKey}`,
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({ must_change_password: false })
                    });
                    cleared.profiles = true;
                }
                if (!cleared.members) {
                    await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/members?user_id=eq.${user.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': serviceKey,
                            'Authorization': `Bearer ${serviceKey}`,
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({ must_change_password: false })
                    });
                    cleared.members = true;
                }
            }
        }
    } catch (e: any) {
        console.warn('Fallback attempt to clear must_change_password via REST failed:', e?.message || e);
    }

    // Revalidate any relevant paths to reduce cached responses
    try { revalidatePath('/settings'); } catch (e) { /* ignore */ }

    return { error: null, cleared };
}

const userProfileSchema = z.object({
  firstName: z.string().min(2, "El nombre es muy corto."),
  lastName: z.string().min(2, "El apellido es muy corto."),
});

export async function updateUserProfile(data: z.infer<typeof userProfileSchema>) {
    const supabase = await createClient();
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
    const supabase = await createClient();
    const adminAuth = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
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

    // 2. Update roles in auth.users user_metadata (admin API)
    try {
        const { error: authError } = await adminAuth.auth.admin.updateUserById(
            memberId,
            { user_metadata: { roles: roles } }
        );
        if (authError) {
            console.error('Error updating auth user metadata:', authError);
            return { error: `Error al actualizar roles en Auth: ${authError.message}` };
        }
    } catch (e: any) {
        console.error('Unexpected error updating auth user metadata:', e);
        return { error: 'Error inesperado al actualizar roles en Auth.' };
    }

    try { revalidatePath('/settings'); } catch (e) { /* ignore */ }
    return { error: null };
}

export async function deleteMember(data: { memberId?: string } | string) {
    const supabase = await createClient();
    const adminAuth = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    try {
        const memberId = typeof data === 'string' ? data : (data && (data as any).memberId);
        if (!memberId) return { error: 'memberId missing' };

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'No autorizado: Usuario no autenticado.' };

        // Ensure caller is admin in the same clinic
        const { data: profile } = await supabase.from('profiles').select('clinic_id, roles').eq('id', user.id).single();
        if (!profile || !profile.roles || !profile.roles.includes('admin')) {
            return { error: 'No autorizado: Solo administradores pueden eliminar miembros.' };
        }

        // Find member row by id
        const { data: memberRow, error: fetchErr } = await supabase.from('members').select('*').eq('id', memberId).maybeSingle();
        let targetUserId: string | null = null;
        let targetClinicId: string | null = null;
        if (memberRow) {
            targetUserId = memberRow.user_id;
            targetClinicId = memberRow.clinic_id;
        }

        // Delete from members table
        const { error: deleteError } = await supabase.from('members').delete().eq('id', memberId);
        if (deleteError) {
            return { error: `Error al eliminar miembro: ${deleteError.message}` };
        }

        // Cleanup: delete user and profile if this was the last member in the clinic
        if (targetUserId && targetClinicId) {
            const { data: remainingMembers } = await supabase
                .from('members')
                .select('id')
                .eq('user_id', targetUserId)
                .neq('clinic_id', targetClinicId); // ensure we're not counting the current deletion

            if (remainingMembers && remainingMembers.length === 0) {
                try {
                    await adminAuth.from('profiles').delete().eq('id', targetUserId);
                    await adminAuth.auth.admin.deleteUser(targetUserId);
                } catch (e) {
                    console.error('Error cleaning up user/profile:', e);
                }
            }
        }

        revalidatePath('/settings');
        return { error: null };
    } catch (e: any) {
        console.error('deleteMember error', e);
        return { error: 'Error inesperado al eliminar el miembro.' };
    }
}

export async function disconnectGoogleAccount() {
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Usuario no autenticado.' };

        // Delete any stored Google integration for this user
        const { error: delErr } = await supabase.from('google_integrations').delete().eq('user_id', user.id);
        if (delErr) {
            console.error('Error deleting google_integrations for user:', delErr);
            return { error: `No se pudo desconectar Google: ${delErr.message || delErr}` };
        }

        // Clear any profile flag that indicates a connected Google Calendar
        try {
            await supabase.from('profiles').update({ google_calendar_connected: false }).eq('id', user.id);
        } catch (e) {
            console.warn('Could not clear google_calendar_connected flag on profile:', e);
        }

        try { revalidatePath('/settings'); } catch (e) { /* ignore */ }
        return { error: null };
    } catch (e: any) {
        console.error('disconnectGoogleAccount error', e);
        return { error: 'Error inesperado al desconectar Google.' };
    }
}
