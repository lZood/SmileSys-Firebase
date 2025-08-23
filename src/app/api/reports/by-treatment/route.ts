import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('startDate');
  const end = searchParams.get('endDate');

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
    const clinicId = profile.clinic_id;

    let q = supabase.from('reports.daily_revenue_by_service').select('*').eq('clinic_id', clinicId);
    if (start) q = q.gte('day', start);
    if (end) q = q.lte('day', end);

    const res = await q;
    if (res.error) {
      console.error('reports.by-treatment query error', res.error);
      return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
    }

    // Aggregate revenue by service
    const map: Record<string, number> = {};
    (res.data || []).forEach((r: any) => {
      const key = r.service || 'Sin Categorizar';
      map[key] = (map[key] || 0) + Number(r.revenue || 0);
    });

    const data = Object.entries(map).map(([name, revenue]) => ({ name, revenue }));

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error('reports.by-treatment error', e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
