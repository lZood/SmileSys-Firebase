import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Combined global search endpoint
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (!q) {
    return NextResponse.json({ patients: [], appointments: [], inventory: [] });
  }

  const supabase = await createClient();
  const term = `%${q}%`;

  // Patients
  let patients: any[] = [];
  try {
    const { data } = await supabase
      .from('patients')
      .select('id, first_name, last_name, email')
      .or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`)
      .limit(5);
    patients = (data || []).map(p => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`.trim(),
      email: p.email,
      type: 'patient'
    }));
  } catch (e) {
    console.error('[search] patients error', e);
  }

  // Appointments (join basic info)
  let appointments: any[] = [];
  try {
    const { data } = await supabase
      .from('appointments')
      .select('id, service_description, appointment_date, appointment_time, patients(first_name,last_name)')
      .or(`service_description.ilike.${term}`)
      .limit(5);
    appointments = (data || []).map(a => ({
      id: a.id,
      summary: `${a.service_description} - ${(a as any).patients ? (a as any).patients.first_name + ' ' + (a as any).patients.last_name : 'Paciente'}`,
      date: a.appointment_date,
      time: a.appointment_time,
      type: 'appointment'
    }));
  } catch (e) {
    console.error('[search] appointments error', e);
  }

  // Inventory (best-effort, table name guess: inventory_items)
  let inventory: any[] = [];
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id, name, sku')
      .or(`name.ilike.${term},sku.ilike.${term}`)
      .limit(5);
    if (!error) {
      inventory = (data || []).map(i => ({ id: i.id, name: i.name, sku: i.sku, type: 'inventory' }));
    }
  } catch (e) {
    // Silencioso si tabla no existe
  }

  return NextResponse.json({ patients, appointments, inventory });
}
