
'use server';

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const inviteSchema = z.object({
  clinicName: z.string().min(2, "Clinic name must have at least 2 characters"),
  adminEmail: z.string().email("Invalid email address"),
});

export async function inviteClinicFlow(input: { clinicName: string; adminEmail: string }) {
  const parsedInput = inviteSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: parsedInput.error.errors.map((e) => e.message).join(', ') };
  }

  const { clinicName, adminEmail } = parsedInput.data;
  const supabase = createClient();

  // Step 1: Create the clinic
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .insert({ name: clinicName })
    .select()
    .single();

  if (clinicError) {
    console.error('Error creating clinic:', clinicError);
    return { error: 'Failed to create the clinic in the database.' };
  }

  // Step 2: Invite the user
  const { data: invitation, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(adminEmail, {
      data: {
          role: 'admin'
      }
  });

  if (inviteError) {
    console.error('Error inviting user:', inviteError);
    // Rollback clinic creation if user invitation fails
    await supabase.from('clinics').delete().eq('id', clinic.id);
    return { error: `Failed to invite user: ${inviteError.message}` };
  }

  if (!invitation.user) {
     return { error: 'Invitation sent, but no user object was returned.' };
  }

  // Step 3: Create the user's profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: invitation.user.id,
      clinic_id: clinic.id,
      role: 'admin',
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
    // This is more complex to rollback. For now, we log the error.
    // In a production app, you might want to handle this more gracefully.
    return { error: 'User invited, but failed to create their profile.' };
  }

  return { error: null };
}
