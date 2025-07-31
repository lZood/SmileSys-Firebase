

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
    
    const { data: teamMembers, error: teamMembersError } = await supabase.rpc('get_team_members_with_email', { p_clinic_id: profile.clinic_id });


    if (teamMembersError) {
        console.error('Error fetching team members:', teamMembersError.message);
    }
    

    return {
      user,
      profile,
      clinic,
      teamMembers: teamMembers || [],
    };
});
