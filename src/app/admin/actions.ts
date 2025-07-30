
'use server';

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const signUpSchema = z.object({
  clinicName: z.string().min(2, "Clinic name must have at least 2 characters"),
  adminEmail: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
});

export async function signUpNewClinic(input: z.infer<typeof signUpSchema>) {
  const parsedInput = signUpSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: parsedInput.error.errors.map((e) => e.message).join(', ') };
  }

  const { clinicName, adminEmail, password, firstName, lastName } = parsedInput.data;
  const supabase = createClient();

  // Step 1: Sign up the new user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: adminEmail,
    password: password,
    options: {
      data: {
        role: 'admin',
        full_name: `${firstName} ${lastName}`
      },
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

  // Step 2: Create the clinic
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .insert({ name: clinicName, subscription_status: 'pending_payment' })
    .select()
    .single();

  if (clinicError) {
    console.error('Error creating clinic:', clinicError);
    // Rollback user creation if clinic creation fails
    await supabase.auth.admin.deleteUser(userId);
    return { error: 'Failed to create the clinic in the database.' };
  }

  // Step 3: Create the user's profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      clinic_id: clinic.id,
      role: 'admin',
      first_name: firstName,
      last_name: lastName
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
    // Rollback: delete user and clinic
    await supabase.auth.admin.deleteUser(userId);
    await supabase.from('clinics').delete().eq('id', clinic.id);
    return { error: 'User registered, but failed to create their profile.' };
  }

  return { data: { clinic, user: authData.user }, error: null };
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
    const supabase = createClient();

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
