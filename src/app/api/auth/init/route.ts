import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    // Create an admin client using the service role key to bypass RLS for administrative inserts
    const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return NextResponse.json({ error: 'No authenticated user' }, { status: 401 });

    // Check profile
    const { data: profile } = await supabase.from('profiles').select('id, clinic_id').eq('id', user.id).maybeSingle();
    if (profile && profile.clinic_id) {
      // profile exists, check clinic
      const { data: clinic } = await supabase.from('clinics').select('first_setup_required').eq('id', profile.clinic_id).maybeSingle();
      const redirect = clinic?.first_setup_required ? '/onboarding' : '/dashboard';
      return NextResponse.json({ redirect });
    }

    // Create clinic and profile using service role (idempotent-ish)
    const clinicName = (user.user_metadata?.full_name || user.email?.split('@')[0] || 'Tu Clínica').slice(0, 120);
    const defaultSchedule = { monday:[{start:'09:00',end:'17:00'}], tuesday:[{start:'09:00',end:'17:00'}], wednesday:[{start:'09:00',end:'17:00'}], thursday:[{start:'09:00',end:'17:00'}], friday:[{start:'09:00',end:'17:00'}], saturday:[], sunday:[] };

    // Use admin client to insert clinic (bypass RLS)
    const { data: clinicInserted, error: clinicErr } = await supabaseAdmin.from('clinics').insert({ name: clinicName, first_setup_required: true, schedule: defaultSchedule }).select('id, first_setup_required').single();
    if (clinicErr) {
      console.error('clinic insert error', clinicErr);
      return NextResponse.json({ error: 'Failed to create clinic', details: clinicErr }, { status: 500 });
    }

    const fullName: string = user.user_metadata?.full_name || '';
    const firstName = fullName.split(' ')[0] || '';
    const lastName = fullName.split(' ').slice(1).join(' ') || '';
    const roles = ['admin'];

    // Upsert profile using admin client — avoid writing 'email' if the column is not present in the schema
    const profilePayload: any = { id: user.id, first_name: firstName, last_name: lastName, roles, clinic_id: clinicInserted.id };
    try {
      const { data: profData, error: profErr } = await supabaseAdmin.from('profiles').upsert(profilePayload, { onConflict: 'id' } as any).select('id, clinic_id');
      if (profErr) {
        console.error('profile upsert', profErr);
      }
    } catch (e) {
      console.error('profile upsert exception', e);
    }

    try {
      const memberPayload = { clinic_id: clinicInserted.id, user_id: user.id, role: 'admin', is_active: true, roles };
      const { data: memberData, error: memberErr } = await (supabaseAdmin.from('members') as any).upsert(memberPayload, { onConflict: 'clinic_id,user_id' }).select('clinic_id, user_id');
      if (memberErr) console.error('member upsert error', memberErr);
    } catch (e) {
      console.error('member upsert exception', e);
    }

    // Return JSON with redirect target (do not issue server redirect to avoid fetch following it)
    return NextResponse.json({ redirect: '/onboarding' });
  } catch (e) {
    console.error('init auth error', e);
    return NextResponse.json({ error: 'Unexpected error', details: String(e) }, { status: 500 });
  }
}
