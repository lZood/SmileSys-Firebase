'use server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Public endpoint to create/update a pending signup using the SECURITY DEFINER function.
// RLS: Table only writable by service_role; function handles controlled insert.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email: string = (body.email || '').trim().toLowerCase();
    const extra = body.extra_data && typeof body.extra_data === 'object' ? body.extra_data : {};

    if (!email) return NextResponse.json({ ok: false, error: 'Email requerido' }, { status: 400 });
    if (!email.includes('@')) return NextResponse.json({ ok: false, error: 'Email inválido' }, { status: 400 });

    // (Optional) basic rate-limit by IP (best-effort, in-memory placeholder; replace with persistent store / Redis)
    // Skipped here to keep minimal; implement middleware or edge cache for production.

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('insert_pending_signup', { p_email: email, p_extra_data: extra });
    if (error) {
      console.error('[pending signup] rpc error', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data });
  } catch (e: any) {
    console.error('[pending signup] exception', e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
