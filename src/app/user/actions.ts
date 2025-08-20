'use server';

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Simple in-memory per-user cache + in-flight map to deduplicate concurrent calls
const _inFlight = new Map<string, Promise<any>>();
const _cache = new Map<string, { value: any; ts: number }>();
const USER_DATA_TTL = 5000; // 5 seconds

export async function getUserData() {
    console.log('[getUserData] start');
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[getUserData] auth.getUser result:', { user: user ? { id: user.id, email: user.email } : null, authError });

    // If the session references a non-existent auth.user, clear the session/cookies to avoid stale JWTs.
    // Supabase may return a 403 or code 'user_not_found' with message like "User from sub claim in JWT does not exist".
    if (authError) {
        const msg = String(authError?.message || '').toLowerCase();
        if (authError?.status === 403 || authError?.code === 'user_not_found' || msg.includes('user from sub claim')) {
            console.warn('[getUserData] stale session detected (user_not_found). Signing out to clear cookies.');
            try {
                await supabase.auth.signOut();
            } catch (e) {
                console.error('[getUserData] error signing out to clear stale session:', e);
            }
            return null;
        }
    }

    if (!user) {
        console.error('Error fetching user or no user logged in:', authError?.message);
        return null;
    }

    const key = user.id;

    // Return cached if fresh
    const cached = _cache.get(key);
    if (cached && (Date.now() - cached.ts) < USER_DATA_TTL) {
        console.log('[getUserData] returning cached result for user:', key);
        return cached.value;
    }

    // If a fetch is already in-flight for this user, wait for it and return its result
    if (_inFlight.has(key)) {
        console.log('[getUserData] awaiting in-flight fetch for user:', key);
        return _inFlight.get(key)!;
    }

    const work = (async () => {
        // Helper para estado Google
        const getGoogleConnected = async () => {
            const { data } = await supabase
                .from('google_integrations')
                .select('id')
                .eq('user_id', user.id)
                .limit(1);
            return !!(data && data.length > 0);
        };

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
        console.log('[getUserData] profile:', profile, 'profileError:', profileError);

        if (profileError) {
            console.error('Error fetching profile (non-fatal):', profileError?.message);
            // continue — we'll return profile: null but still provide useful flags
        }

        if (!profile) {
            const isGoogleCalendarConnected = await getGoogleConnected();
            console.log('[getUserData] no profile found, returning partial result, isGoogleCalendarConnected:', isGoogleCalendarConnected);
            const partialResult = { user, profile: null, clinic: null, teamMembers: [], isGoogleCalendarConnected } as any;
            // cache and return partial result
            return partialResult;
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

        console.log('[getUserData] clinic:', clinic, 'clinicError:', clinicError);

        if (clinicError) {
            console.error('Error fetching clinic:', clinicError?.message);
        }

        // Fetch all profiles for the clinic
        const { data: profilesInClinic, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .eq('clinic_id', profile.clinic_id);

        console.log('[getUserData] profilesInClinic length:', profilesInClinic?.length, 'profilesError:', profilesError);

        if (profilesError) {
            console.error('Error fetching profiles for clinic:', profilesError.message);
            const isGoogleCalendarConnected = await getGoogleConnected();
            console.log('[getUserData] returning due to profilesError, isGoogleCalendarConnected:', isGoogleCalendarConnected);
            return { user, profile, clinic, teamMembers: [], isGoogleCalendarConnected } as any;
        }

        // Fetch all users from auth.users only if caller has 'admin' role; otherwise skip to avoid 403
        let teamMembers: any[] = [];
        let authUsers: any = null;
        if (profile.roles && profile.roles.includes('admin')) {
            try {
                const adminAuth = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
                const { data: authUsersResp, error: authUsersError } = await adminAuth.auth.admin.listUsers();
                if (!authUsersError && authUsersResp) {
                    authUsers = authUsersResp;
                    teamMembers = profilesInClinic.map(p => {
                        const au = authUsersResp.users.find((u: any) => u.id === p.id);
                        return { ...p, user_email: au?.email || 'No disponible' };
                    });
                } else {
                    console.warn('[getUserData] listUsers skipped/failed:', authUsersError?.message);
                    teamMembers = profilesInClinic.map(p => ({ ...p, user_email: 'No disponible' }));
                }
            } catch (e: any) {
                console.warn('[getUserData] admin listUsers exception:', e?.message || e);
                teamMembers = profilesInClinic.map(p => ({ ...p, user_email: 'No disponible' }));
            }
        } else {
            teamMembers = profilesInClinic.map(p => ({ ...p, user_email: 'No disponible' }));
        }

        const isGoogleCalendarConnected = await getGoogleConnected();
        console.log('[getUserData] isGoogleCalendarConnected:', isGoogleCalendarConnected);

        const result = {
          user,
          profile,
          clinic,
          teamMembers: teamMembers || [],
          isGoogleCalendarConnected,
        } as any;

        console.log('[getUserData] returning result:', { user: { id: user.id, email: user.email }, profile: { id: profile.id }, clinic: clinic ? { id: clinic.id } : null, teamMembersCount: teamMembers.length, isGoogleCalendarConnected });
        return result;
    })();

    // mark in-flight and cache result on completion
    _inFlight.set(key, work);
    try {
        const res = await work;
        _cache.set(key, { value: res, ts: Date.now() });
        return res;
    } finally {
        _inFlight.delete(key);
    }
}
