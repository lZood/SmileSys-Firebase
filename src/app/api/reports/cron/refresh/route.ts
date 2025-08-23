import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/*
  Cron Refresh Endpoint
  Usage: Called by external scheduler (e.g. Supabase Edge Function fetch, GitHub Action, Uptime cron) with header X-CRON-KEY=<CRON_SECRET>.
  Env: CRON_SECRET must be set in deployment environment.
*/
export async function POST(req: NextRequest) {
  const providedKey = req.headers.get('x-cron-key');
  const expectedKey = process.env.CRON_SECRET;
  if (!expectedKey || providedKey !== expectedKey) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc('reports.refresh_all_materialized_views');
    if (error) {
      console.error('[cron refresh] rpc error', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, refreshedAt: new Date().toISOString() });
  } catch (e: any) {
    console.error('[cron refresh] exception', e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
