import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import { buildEmail } from '@/lib/email/template'

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
    const code_hash = await bcrypt.hash(code, 8)
    const expires_at = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString()

    const { error: updateErr } = await supabase.from('pending_signups').update({ code_hash, expires_at, last_code_sent_at: new Date().toISOString() }).eq('email', email)
    if (updateErr) {
      console.error('Failed updating pending_signups for resend:', updateErr)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }

    // Send email with the new code
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      })

      const mailHtml = buildEmail({
        heading: 'Nuevo código de verificación',
        intro: `Tu nuevo código de verificación es: <strong style="font-size:24px;display:block;margin-top:8px">${code}</strong>`,
        ctaText: 'Usar código',
        ctaUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        ctaNote: `Este código expira en ${CODE_TTL_MINUTES} minutos.`
      })
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Nuevo código de verificación — SmileSys',
        html: mailHtml,
        text: `Código: ${code}`
      })
    } catch (mailErr) {
      console.error('Failed sending resend email', mailErr)
      // We do not fail the request if email sending fails; client will show generic message
    }

    console.log('Resent signup code for', email)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
