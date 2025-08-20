import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'
import { buildEmail } from '@/lib/email/template'

// Replace the big inline HTML template with a small wrapper that uses the shared builder
const INVITE_HTML = (link: string) => buildEmail({
  heading: 'Te hemos invitado a SmileSys',
  intro: 'Para activar tu cuenta y crear tu contraseña, haz clic en el botón de abajo. El enlace expirará por seguridad, así que actívalo cuanto antes.',
  ctaText: 'Confirma tu cuenta',
  ctaUrl: link,
  footerNote: '— El equipo de SmileSys'
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, clinicId, inviterId, role = 'member' } = body
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

    const supabase = await createClient()

    // Generate token
    const token = uuidv4()

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

    const { error: insertErr } = await supabase.from('invites').insert({
      email,
      token,
      clinic_id: clinicId || null,
      inviter_id: inviterId || null,
      role,
      expires_at: expiresAt,
    })

    if (insertErr) return NextResponse.json({ error: 'No se pudo crear la invitación' }, { status: 500 })

    // Send email via nodemailer using SMTP env
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const link = `${appUrl.replace(/\/$/, '')}/first-login?invite=${token}`

    const html = INVITE_HTML(link)

    let sendResult = null
    let sendError = null
    try {
      // verify transporter
      try { await transporter.verify(); } catch (vErr) { console.warn('SMTP verify failed', vErr); }

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Invitación a SmileSys',
        html,
        text: `Visita ${link} para aceptar la invitación`,
      })
      sendResult = info
      console.log('Invite email sent:', info && info.response ? info.response : info)
    } catch (err: any) {
      sendError = err?.message || String(err)
      console.error('Failed sending invite email', err)
    }

    return NextResponse.json({ ok: true, emailSent: Boolean(sendResult), sendResult, sendError })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}