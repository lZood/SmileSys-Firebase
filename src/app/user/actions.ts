
'use server';

import { createClient } from "@/lib/supabase/server";
import { cache } from 'react';

export const getUserData = cache(async () => {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error('Error fetching user or no user logged in:', authError?.message);
        return null;
    }
    
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (profileError || !profile) {
        console.error('Error fetching profile:', profileError?.message);
        return { user, profile: null, clinic: null, teamMembers: [] };
    }

    const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', profile.clinic_id)
        .single();

    if (clinicError) {
        console.error('Error fetching clinic:', clinicError?.message);
    }
    
    // This query now correctly joins profiles with the auth.users table to get the email.
    const { data: teamMembersData, error: teamMembersError } = await supabase
        .from('profiles')
        .select(`
            id,
            first_name,
            last_name,
            role,
            users (
                email
            )
        `)
        .eq('clinic_id', profile.clinic_id);

    if (teamMembersError) {
        console.error('Error fetching team members:', teamMembersError.message);
    }
    
    // Flatten the structure to make it easier to use in the client components.
    const teamMembers = teamMembersData?.map((member: any) => ({
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        role: member.role,
        user_email: member.users?.email || 'No email found',
    })) || [];

    return {
      user,
      profile,
      clinic,
      teamMembers,
    };
});
