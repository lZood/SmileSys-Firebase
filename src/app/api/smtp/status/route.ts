import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const testEmail = process.env.SUPABASE_SMTP_TEST_EMAIL || '';

  const result: any = {
    serviceRoleConfigured: Boolean(serviceKey),
    supabaseUrlConfigured: Boolean(supabaseUrl),
    hasTestEmail: Boolean(testEmail),
    recoverAttempted: false,
    recoverOk: null,
    message: null,
  };

  // If a test email is configured, attempt to trigger a recovery email (best-effort).
  // NOTE: This will actually attempt to send an email to the configured address when service key + url are present.
  if (serviceKey && supabaseUrl && testEmail) {
    try {
      const resp = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ email: testEmail }),
      });

      result.recoverAttempted = true;
      result.recoverOk = resp.ok;
      result.message = await resp.text();
    } catch (e: any) {
      result.recoverAttempted = true;
      result.recoverOk = false;
      result.message = String(e?.message || e);
    }
  }

  return NextResponse.json(result);
}
