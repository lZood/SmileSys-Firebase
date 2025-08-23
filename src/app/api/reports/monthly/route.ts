import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subMonths, startOfMonth, format } from 'date-fns';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthsParam = parseInt(searchParams.get('months') || '6', 10);
  const months = isNaN(monthsParam) ? 6 : monthsParam;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    const { data: profile, error: profileErr } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
    if (profileErr || !profile) return NextResponse.json({ ok: false, error: 'Perfil no encontrado' }, { status: 403 });

    const clinicId = profile.clinic_id;
    const startDate = format(startOfMonth(subMonths(new Date(), months - 1)), 'yyyy-MM-dd');

    const res = await supabase
      .from('reports.monthly_revenue')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('month', startDate)
      .order('month', { ascending: true });

    if (res.error) {
      console.error('reports.monthly query error', res.error);
      return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
    }

    const monthsMap: Record<string, number> = {};
    (res.data || []).forEach((r: any) => { monthsMap[r.month] = Number(r.revenue || 0); });

    const result = Array.from({ length: months }).map((_, i) => {
      const date = subMonths(new Date(), months - 1 - i);
      const key = format(startOfMonth(date), 'yyyy-MM-dd');
      return { month: format(date, 'MMM yyyy'), revenue: monthsMap[key] || 0 };
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (e: any) {
    console.error('reports.monthly error', e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
