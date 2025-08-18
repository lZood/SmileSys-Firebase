import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = body
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Servidor no configurado' }, { status: 500 })
    }

    // Use the admin generate_link endpoint with type 'signup' so Supabase sends
    // the Confirm Signup template instead of the Reset Password template.
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ type: 'signup', email, redirect_to: `${NEXT_PUBLIC_APP_URL}/first-login` }),
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      // pass through status and details so frontend can react to rate limits
      return NextResponse.json({ error: 'Error al enviar', detail: text }, { status: resp.status })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}