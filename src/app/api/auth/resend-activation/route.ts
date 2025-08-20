import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { v4 as uuidv4 } from 'uuid'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { buildEmail } from '@/lib/email/template'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = body
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

    // Create invite + send email via nodemailer
    const token = uuidv4()
    const supabase = await createServerClient()
    await supabase.from('invites').insert({ email, token, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const link = `${appUrl.replace(/\/$/, '')}/first-login?invite=${token}`
    const html = buildEmail({
      heading: 'Has sido invitado a SmileSys',
      intro: `Para activar tu cuenta y crear tu contraseña haz clic en el siguiente enlace.`,
      ctaText: 'Confirma tu cuenta',
      ctaUrl: link,
    })

    try {
      await transporter.sendMail({ from: process.env.EMAIL_FROM, to: email, subject: 'Invitación a SmileSys', html, text: link })
    } catch (err) {
      console.error('nodemailer send failed', err)
      return NextResponse.json({ error: 'No se pudo enviar el correo' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}