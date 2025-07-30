
'use server';

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function getUserData() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error('Error fetching user or no user logged in:', authError);
        return null;
    }
    
    // 1. Get user profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        return { user, profile: null, clinic: null, teamMembers: [] };
    }

    // 2. Get clinic data
    const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', profile.clinic_id)
        .single();

    if (clinicError) {
        console.error('Error fetching clinic:', clinicError);
    }
    
    // 3. Get team members
    const { data: teamMembersData, error: teamMembersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, user_email:users(email)')
        .eq('clinic_id', profile.clinic_id);

    if (teamMembersError) {
        console.error('Error fetching team members:', teamMembersError);
    }

    // Workaround to get user email into the team member object
    const teamMembers = teamMembersData?.map((member: any) => ({
        ...member,
        user_email: member.users.email
    })) || [];


    return {
      user,
      profile: { ...profile, user }, // Attach user object to profile for convenience
      clinic,
      teamMembers,
    };
}
