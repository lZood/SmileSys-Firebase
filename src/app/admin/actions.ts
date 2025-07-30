
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
    .insert({ name: clinicName, subscription_status: 'trial' })
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

  return { data: clinic, error: null };
}


export type ClinicWithAdmin = {
    id: string;
    name: string;
    subscription_status: string;
    created_at: string;
    adminEmail?: string;
};

export async function getClinicsWithAdmin(): Promise<{ data: ClinicWithAdmin[] | null, error: string | null }> {
    const supabase = createClient();

    const { data: clinics, error: clinicsError } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

    if (clinicsError) {
        console.error("Error fetching clinics:", clinicsError);
        return { data: null, error: "Could not fetch clinics." };
    }

    const clinicIds = clinics.map(c => c.id);

    const { data: admins, error: adminsError } = await supabase
        .from('profiles')
        .select('id, clinic_id')
        .in('clinic_id', clinicIds)
        .eq('role', 'admin');

    if (adminsError) {
        console.error("Error fetching admin profiles:", adminsError);
        return { data: null, error: "Could not fetch clinic administrators." };
    }
    
    const { data: { users } } = await supabase.auth.admin.listUsers();
    
    const adminUserMap = users.reduce((acc, user) => {
        acc[user.id] = user.email;
        return acc;
    }, {} as Record<string, string | undefined>);
    
    const adminProfileMap = admins.reduce((acc, profile) => {
        acc[profile.clinic_id] = profile.id;
        return acc;
    }, {} as Record<string, string>);


    const clinicsWithAdmins: ClinicWithAdmin[] = clinics.map(clinic => {
        const adminId = adminProfileMap[clinic.id];
        const adminEmail = adminId ? adminUserMap[adminId] : undefined;
        return {
            ...clinic,
            adminEmail,
        };
    });

    return { data: clinicsWithAdmins, error: null };
}

export async function deleteClinicFlow(clinicId: string): Promise<{ error: string | null }> {
    const supabase = createClient();

    // Step 1: Get all user profiles associated with the clinic
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clinic_id', clinicId);

    if (profilesError) {
        console.error('Error fetching profiles for deletion:', profilesError);
        return { error: 'Could not fetch users to delete.' };
    }

    // Step 2: Delete each user from Supabase Auth
    if (profiles && profiles.length > 0) {
        for (const profile of profiles) {
            const { error: deleteUserError } = await supabase.auth.admin.deleteUser(profile.id);
            if (deleteUserError) {
                // If a user can't be deleted, we stop and report the error.
                // Note: The profiles table has an ON DELETE CASCADE for auth.users,
                // so we don't strictly need to delete profiles manually if auth deletion succeeds.
                console.error(`Error deleting user ${profile.id} from Auth:`, deleteUserError);
                return { error: `Failed to delete user ${profile.id}: ${deleteUserError.message}` };
            }
        }
    }

    // Step 3: Delete the clinic itself. Associated profiles should be deleted by cascade if not already handled.
    // Other related data (patients, appointments) would need to be handled here too if not using db-level cascades.
    const { error: deleteClinicError } = await supabase
        .from('clinics')
        .delete()
        .eq('clinic_id', clinicId);

    if (deleteClinicError) {
        console.error('Error deleting clinic:', deleteClinicError);
        return { error: 'Failed to delete the clinic.' };
    }

    return { error: null };
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
