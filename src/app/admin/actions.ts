'use server';

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { z } from "zod";

const signUpSchema = z.object({
  clinicName: z.string().min(2, "Clinic name must have at least 2 characters"),
  adminEmail: z.string().email("Invalid email address"),
  // Password is optional for initial clinic signup — we generate a temporary one
  // and send a password-setup email. This keeps the frontend from having to
  // collect a password on initial registration.
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
});

export async function signUpNewClinic(input: z.infer<typeof signUpSchema>) {
  const parsedInput = signUpSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: parsedInput.error.errors.map((e) => e.message).join(', ') };
  }

  const { clinicName, adminEmail, password, firstName, lastName } = parsedInput.data;
  const supabase = await createClient();
  const supabaseAdmin = createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Step 1: Sign up the new user (usando admin API)
  // Create the user as UNCONFIRMED and with a temporary password so we can
  // trigger the password-setup/recover email from the server.
  const tempPassword = (password && password.length >= 8) ? password : (Math.random().toString(36).slice(-12) + 'A1!');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: tempPassword,
    email_confirm: false,
    user_metadata: {
      roles: ['admin'],
      full_name: `${firstName} ${lastName}`
    },
  });

  if (authError) {
    console.error('Error signing up user:', authError);
    return { error: authError.message };
  }
  
  if (!authData.user) {
      return { error: "User registration failed: No user object returned." };
  }

  const userId = authData.user.id;

  // Step 2: Create the clinic (use service-role client to bypass RLS for admin flow)
  const { data: clinic, error: clinicError } = await supabaseAdmin
    .from('clinics')
    .insert({ name: clinicName, subscription_status: 'pending_payment' })
    .select()
    .single();

  if (clinicError) {
    console.error('Error creating clinic:', clinicError);
    // Rollback user creation if clinic creation fails
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { error: 'Failed to create the clinic in the database.' };
  }

  // Step 3: Create the profile for the admin user (mark must_change_password)
  // Use service-role client for profile creation as well to avoid RLS blocking
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      clinic_id: clinic.id,
      first_name: firstName,
      last_name: lastName,
      roles: ['admin'],
      must_change_password: true,
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
    // Rollback: delete user and clinic
    await supabaseAdmin.auth.admin.deleteUser(userId);
    await supabase.from('clinics').delete().eq('id', clinic.id);
    return { error: 'User registered, but failed to create their profile.' };
  }

  // Step 4: Trigger a password-setup / recover email so the user can set their password
  // We call the Auth recover endpoint using the SERVICE ROLE KEY (server-side only).
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Use the admin generate_link endpoint with type 'signup' to trigger the
      // "Confirm Signup" template in Supabase. The /recover endpoint always
      // triggers the Reset Password template, which is why you were seeing that.
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const genRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        body: JSON.stringify({ type: 'signup', email: adminEmail, redirect_to: `${appUrl.replace(/\/$/, '')}/first-login` }),
      });

      if (!genRes.ok) {
        const bodyText = await genRes.text().catch(() => '');
        try {
          const parsed = JSON.parse(bodyText || '{}');
          if (genRes.status === 429 || parsed?.code === 429 || parsed?.error_code === 'over_email_send_rate_limit') {
            var recoverWarning = parsed?.msg || parsed?.error || 'Límite de envíos de correo alcanzado. Intenta más tarde.'
          } else {
            console.warn('Generate link returned non-ok:', bodyText);
          }
        } catch (e) {
          console.warn('Generate link returned non-ok (non-json):', bodyText);
        }
      }
    } else {
      console.warn('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL not set — cannot trigger confirmation email.');
    }
  } catch (err) {
    console.warn('Failed to call recover endpoint:', err);
  }

  // If recoverWarning was set above, return it so the frontend can inform the user
  // without treating the whole operation as a fatal error.
  // @ts-ignore
  return { data: { clinic, user: authData.user }, error: null, warning: typeof recoverWarning === 'string' ? recoverWarning : null };
}


const activateUserSchema = z.object({
  firstName: z.string().min(2, "First name is too short"),
  lastName: z.string().min(2, "Last name is too short"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function activateInvitedUser(input: z.infer<typeof activateUserSchema>) {
    const parsedInput = activateUserSchema.safeParse(input);
    if (!parsedInput.success) {
        return { error: parsedInput.error.errors.map(e => e.message).join(', ') };
    }

    const { firstName, lastName, password } = parsedInput.data;
    const supabase = await createClient();

    // Get current user, who should be authenticated via the invite link
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return { error: "User not found. The invitation might be invalid or expired." };
    }

    // Update the user's password
    const { error: updateUserError } = await supabase.auth.updateUser({ password });
    if (updateUserError) {
        return { error: `Failed to update password: ${updateUserError.message}` };
    }
    
    // Update the user's profile with their name
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ first_name: firstName, last_name: lastName })
        .eq('id', user.id);
        
    if (profileError) {
        // This is not ideal, the user has a password but no name.
        // For now, we just log it. A more robust solution might be needed.
        console.error("Failed to update user's profile with name:", profileError);
    }
    
    return { data: true, error: null };
}
