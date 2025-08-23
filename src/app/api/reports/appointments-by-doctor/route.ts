import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    const { data: profile, error: profileErr } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
    if (profileErr || !profile) return NextResponse.json({ ok: false, error: 'Perfil no encontrado' }, { status: 403 });
    const clinicId = profile.clinic_id;

    const res = await supabase.from('reports.appointments_by_doctor').select('*').eq('clinic_id', clinicId);
    if (res.error) {
      console.error('reports.appointments-by-doctor query error', res.error);
      return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
    }

    const rows = (res.data || []).map((r: any) => ({ ...r }));
    const doctorIds = Array.from(new Set(rows.map(r => r.doctor_id).filter(Boolean)));
    let doctorsMap: Record<string, string> = {};
    if (doctorIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', doctorIds);
      (profiles || []).forEach((p: any) => { doctorsMap[p.id] = `Dr. ${p.first_name} ${p.last_name}`; });
    }

    const data = rows.map(r => ({ doctor: doctorsMap[r.doctor_id] || (r.doctor_id || 'N/A'), appointments: Number(r.appointments || 0) }));
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error('reports.appointments-by-doctor error', e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
