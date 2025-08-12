'use server';

import { createClient } from "@/lib/supabase/server";
import { cache } from 'react';

export const getUserData = cache(async () => {
    const supabase = await createClient();

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
    
    // Helper para estado Google
    const getGoogleConnected = async () => {
        const { data } = await supabase
            .from('google_integrations')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);
        return !!(data && data.length > 0);
    };

    if (profileError || !profile) {
        console.error('Error fetching profile:', profileError?.message);
        const isGoogleCalendarConnected = await getGoogleConnected();
        return { user, profile: null, clinic: null, teamMembers: [], isGoogleCalendarConnected } as any;
    }

    const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select(`
            *,
            doctors:profiles(
                id,
                first_name,
                last_name,
                roles
            )
        `)
        .eq('id', profile.clinic_id)
        .single();

    if (clinicError) {
        console.error('Error fetching clinic:', clinicError?.message);
    }
    
    // Fetch all profiles for the clinic
    const { data: profilesInClinic, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('clinic_id', profile.clinic_id);

    if (profilesError) {
        console.error('Error fetching profiles for clinic:', profilesError.message);
        const isGoogleCalendarConnected = await getGoogleConnected();
        return { user, profile, clinic, teamMembers: [], isGoogleCalendarConnected } as any;
    }

    // Fetch all users from auth.users (requires service_role key)
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
    
    if (authUsersError) {
        console.error('Error fetching auth users:', authUsersError.message);
        const isGoogleCalendarConnected = await getGoogleConnected();
        return { user, profile, clinic, teamMembers: [], isGoogleCalendarConnected } as any;
    }

    // Join profiles with auth users in code
    const teamMembers = profilesInClinic.map(p => {
        const authUser = authUsers.users.find(u => u.id === p.id);
        return {
            ...p,
            user_email: authUser?.email || 'No disponible'
        };
    });

    const isGoogleCalendarConnected = await getGoogleConnected();
    
    return {
      user,
      profile,
      clinic,
      teamMembers: teamMembers || [],
      isGoogleCalendarConnected,
    } as any;
});
