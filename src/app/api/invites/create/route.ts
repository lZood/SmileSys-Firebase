import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

const INVITE_HTML = (link: string) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-width:100%;background:#f5f7fb;padding:24px 0">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(20,30,40,0.08)">
            <tr>
              <td style="padding:28px 28px 8px;text-align:center;background:linear-gradient(90deg,#06b6d4,#0891b2);color:#fff">
                <img src="https://your-domain.com/images/smileSys_Negro.png" alt="SmileSys" width="84" style="display:block;margin:0 auto 12px" />
                <h1 style="margin:0;font-size:20px;font-weight:700">Bienvenido a SmileSys</h1>
                <p style="margin:6px 0 0;font-size:13px;opacity:0.95">Tu gestión odontológica, más simple y segura</p>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 36px 20px;color:#0f172a">
                <h2 style="margin:0 0 8px;font-size:18px;color:#0f172a">Te hemos invitado a SmileSys</h2>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.5;color:#334155">
                  Para activar tu cuenta y crear tu contraseña, haz clic en el botón de abajo. El enlace expirará por seguridad, así que actívalo cuanto antes.
                </p>

                <div style="text-align:center;margin:18px 0">
                  <a href="${link}" style="display:inline-block;padding:12px 22px;background:#0ea5a4;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;box-shadow:0 6px 18px rgba(14,165,164,0.16)">
                    Confirma tu cuenta
                  </a>
                </div>

                <p style="margin:0 0 12px;font-size:13px;color:#94a3b8">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:
                </p>
                <p style="word-break:break-all;font-size:13px;color:#0f172a;margin:0 0 18px"><a href="${link}" style="color:#0ea5a4;text-decoration:underline">${link}</a></p>

                <hr style="border:none;height:1px;background:#eef2f7;margin:18px 0" />

                <p style="margin:0;font-size:13px;color:#475569">
                  Si no solicitaste este correo, puedes ignorarlo y nadie tendrá acceso a tu cuenta.
                </p>

                <p style="margin:16px 0 0;font-size:13px;color:#475569">
                  — El equipo de <strong>SmileSys</strong>
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#0f172a;color:#cbd5e1;padding:14px 20px;text-align:center;font-size:12px">
                <div>¿Necesitas ayuda? Responde a este correo o visita <a href="https://your-domain.com" style="color:#9be8e0;text-decoration:underline">our-site</a></div>
                <div style="margin-top:6px;opacity:0.75">© SmileSys</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

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