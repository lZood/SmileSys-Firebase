import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('startDate');
  const end = searchParams.get('endDate');

  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    const { data: profile, error: profileErr } = await supabase.from('profiles').select('clinic_id, roles').eq('id', user.id).single();
    if (profileErr || !profile) return NextResponse.json({ ok: false, error: 'Perfil no encontrado' }, { status: 403 });
    const clinicId = profile.clinic_id;

    // Build queries filtered by user's clinic
    const monthlyQ = supabase.from('reports.monthly_revenue').select('*').eq('clinic_id', clinicId).order('month', { ascending: true });
    const patientsQ = supabase.from('reports.new_patients_by_day').select('*').eq('clinic_id', clinicId).order('day', { ascending: true });
    const quotesQ = supabase.from('reports.quotes_overview').select('*').eq('clinic_id', clinicId);
    const apptsQ = supabase.from('reports.appointments_by_doctor').select('*').eq('clinic_id', clinicId);

    if (start) {
      monthlyQ.gte('month', start);
      patientsQ.gte('day', start);
    }
    if (end) {
      monthlyQ.lte('month', end);
      patientsQ.lte('day', end);
    }

    const [monthlyRes, patientsRes, quotesRes, apptsRes] = await Promise.all([
      monthlyQ,
      patientsQ,
      quotesQ,
      apptsQ,
    ]);

    if (monthlyRes.error || patientsRes.error || quotesRes.error || apptsRes.error) {
      console.error('reports.overview query errors', { monthly: monthlyRes.error, patients: patientsRes.error, quotes: quotesRes.error, appts: apptsRes.error });
      return NextResponse.json({ ok: false, error: 'Error consultando vistas' }, { status: 500 });
    }

    const monthly = monthlyRes.data || [];
    const patients = patientsRes.data || [];
    const quotes = quotesRes.data || [];
    const appts = apptsRes.data || [];

    const currentMonthRevenue = monthly.length > 0 ? monthly[monthly.length - 1].revenue : 0;
    const newPatientsCount = patients.reduce((sum: number, row: any) => sum + (row.new_patients || 0), 0);
    const presented = quotes.reduce((sum: number, q: any) => q.status === 'Presented' || q.status === 'Accepted' ? sum + (q.count || 0) : sum, 0);
    const accepted = quotes.reduce((sum: number, q: any) => q.status === 'Accepted' ? sum + (q.count || 0) : sum, 0);
    const topDoctorRow = appts.reduce((prev: any, curr: any) => (prev == null || (curr.appointments || 0) > (prev.appointments || 0)) ? curr : prev, null);

    return NextResponse.json({
      ok: true,
      data: {
        currentMonthRevenue,
        newPatientsCount,
        quotePresentedCount: presented,
        quoteAcceptedCount: accepted,
        quoteConversionRate: presented > 0 ? (accepted / presented) * 100 : 0,
        topDoctor: topDoctorRow || null,
        raw: { monthly, patients, quotes, appointments: appts }
      }
    });
  } catch (e: any) {
    console.error('reports.overview error', e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
