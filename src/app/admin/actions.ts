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

  // NOTE: We no longer create the Auth user at initial signup.
  // Instead we create the clinic and send an invite email so the admin
  // can set their password from the invite link. This prevents duplicate
  // user creation attempts when the invite is later accepted.
  const userId = null

   // Step 2: Create the clinic (use service-role client to bypass RLS for admin flow)
   const { data: clinic, error: clinicError } = await supabaseAdmin
     .from('clinics')
     .insert({ name: clinicName, subscription_status: 'pending_payment' })
     .select()
     .single();

  if (clinicError) {
    console.error('Error creating clinic:', clinicError);
    // Rollback user creation if clinic creation fails
    if (userId) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    }
    return { error: 'Failed to create the clinic in the database.' };
  }

  // We don't create the profile here because the Auth user does not exist yet.
  // The profile will be created when the invite is accepted and the user record is available.

  // Step 4: Trigger a password-setup / recover email so the user can set their password
  // Instead of relying only on Supabase recover, call our invites/create endpoint
  // which will create an invite row and send the branded invite email via nodemailer.
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteRes = await fetch(`${appUrl.replace(/\/$/, '')}/api/invites/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // inviterId is null because there is no user yet; backend will accept and record inviter_id as null
      body: JSON.stringify({ email: adminEmail, clinicId: clinic.id, inviterId: null, role: 'admin', firstName, lastName }),
    });

    const inviteJson = await inviteRes.json().catch(() => null);
    if (!inviteRes.ok) {
      console.warn('Invites endpoint returned non-ok:', inviteRes.status, inviteJson);
    } else {
      console.log('Invites endpoint response:', inviteJson);
    }
  } catch (err) {
    console.warn('Failed to call invites endpoint:', err);
  }
 
  // Return clinic; user will be created when invite is accepted
  return { data: { clinic }, error: null };
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
