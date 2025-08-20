import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { buildEmail } from '@/lib/email/template'

const RESET_HTML = (link: string) => buildEmail({
  title: 'Restablece tu contraseña — SmileSys',
  heading: 'Restablece tu contraseña',
  intro: 'Haz clic en el botón de abajo para crear una nueva contraseña. Por motivos de seguridad el enlace expirará; si no lo solicitaste, puedes ignorar este correo.',
  ctaText: 'Crear nueva contraseña',
  ctaUrl: link,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = body
    if (!email) return NextResponse.json({ ok: true }) // don't reveal existence

    const supabaseAdmin = await createClient()

    // Try to resolve user id from profiles table (if email stored) or from auth users
    let userId: string | null = null
    try {
      const { data: profiles } = await supabaseAdmin.from('profiles').select('id, email').ilike('email', email).limit(1)
      if (profiles && profiles.length > 0) userId = profiles[0].id
    } catch (e) {
      // ignore
    }

    if (!userId) {
      try {
        const { data: usersRes } = await supabaseAdmin.auth.admin.listUsers()
        const found = (usersRes && usersRes.users || []).find((u: any) => (u.email || '').toLowerCase() === String(email || '').toLowerCase())
        if (found) userId = found.id
      } catch (e) {
        // ignore
      }
    }

    if (!userId) {
      // Return ok to avoid account enumeration
      return NextResponse.json({ ok: true })
    }

    // Create a one-time token and store it in password_resets table
    const token = crypto.randomBytes(24).toString('hex')
    const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    // Try insert and, on failure, attempt to remove old tokens for this user and retry once.
    let insertErr: any = null
    try {
      const insertRes = await supabaseAdmin.from('password_resets').insert({ user_id: userId, token, expires_at }).select().maybeSingle()
      insertErr = (insertRes as any).error || null
      if (insertErr) {
        console.error('Failed inserting password_reset token (first attempt):', JSON.stringify(insertErr))
        // Try clearing existing tokens for this user and retry
        try {
          const delRes = await supabaseAdmin.from('password_resets').delete().eq('user_id', userId)
          if ((delRes as any).error) console.warn('Failed deleting existing password_resets during retry:', JSON.stringify((delRes as any).error))
        } catch (delErr) {
          console.warn('Error deleting existing password_resets during retry:', String(delErr))
        }

        // Retry insert
        try {
          const retryRes = await supabaseAdmin.from('password_resets').insert({ user_id: userId, token, expires_at }).select().maybeSingle()
          insertErr = (retryRes as any).error || null
          if (insertErr) {
            console.error('Failed inserting password_reset token (retry):', JSON.stringify(insertErr))
          }
        } catch (retryEx) {
          console.error('Exception on retry inserting password_reset token:', String(retryEx))
        }
      }
    } catch (ex) {
      console.error('Exception inserting password_reset token:', String(ex))
      insertErr = ex
    }

    if (insertErr) {
      // Still proceed but log — we don't reveal existence to the client
      console.error('Final failure inserting password_reset token for user:', userId, 'error:', JSON.stringify(insertErr))
      return NextResponse.json({ ok: true })
    }

    // Build reset link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const link = `${appUrl.replace(/\/$/, '')}/reset-password?token=${token}`

    // Prepare transporter from SMTP env
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    let emailSent = false
    let sendError: any = null
    try {
      try { await transporter.verify(); } catch (vErr) { console.warn('SMTP verify failed', vErr); }
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Restablece tu contraseña — SmileSys',
        html: RESET_HTML(link),
        text: `Visita ${link} para crear una nueva contraseña.`,
      })
      console.log('Password reset email sent:', info && (info as any).response ? (info as any).response : info)
      emailSent = true
    } catch (err: any) {
      sendError = err?.message || String(err)
      console.error('Failed sending password reset email', err)
    }

    return NextResponse.json({ ok: true, emailSent, sendError })
  } catch (e) {
    console.error('Forgot password error', e)
    return NextResponse.json({ ok: true })
  }
}
