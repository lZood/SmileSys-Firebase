import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

const RESEND_INTERVAL_SECONDS = 60
const CODE_TTL_MINUTES = 15

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const supabase = await createServerClient()
    const { data: pending, error } = await supabase.from('pending_signups').select('*').eq('email', email).single()
    if (error || !pending) return NextResponse.json({ error: 'Signup not found' }, { status: 404 })

    const lastSent = pending.last_code_sent_at ? new Date(pending.last_code_sent_at).getTime() : 0
    if (Date.now() - lastSent < RESEND_INTERVAL_SECONDS * 1000) {
      return NextResponse.json({ error: 'Please wait before requesting another code' }, { status: 429 })
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires_at = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString()

    await supabase.from('pending_signups').update({ code_hash: code, expires_at, last_code_sent_at: new Date().toISOString() }).eq('email', email)

    console.log('Resent signup code for', email, code)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
