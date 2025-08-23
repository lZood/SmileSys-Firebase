import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('id, roles, clinic_id').eq('id', user.id).single();
    if (!profile) return NextResponse.json({ ok: false, error: 'Perfil no encontrado' }, { status: 404 });

    // Require admin role to refresh
    if (!profile.roles || !profile.roles.includes('admin')) {
      return NextResponse.json({ ok: false, error: 'Acceso denegado' }, { status: 403 });
    }

    // Execute the SQL function
    const { error } = await supabase.rpc('reports.refresh_all_materialized_views');
    if (error) {
      console.error('refresh rpc error', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('reports.refresh error', e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
