import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user)
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('clinic_id')
      .eq('id', user.id)
      .single();
    if (profileErr || !profile)
      return NextResponse.json({ ok: false, error: 'Perfil no encontrado' }, { status: 403 });

    const res = await supabase.from('reports.quotes_overview').select('*').eq('clinic_id', profile.clinic_id);
    if (res.error) {
      console.error('reports.quotes query error', res.error);
      return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
    }

    const data = (res.data || []).map((r: any) => ({ status: r.status, count: Number(r.count || 0), total_amount: Number(r.total_amount || 0) }));
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error('reports.quotes error', e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
