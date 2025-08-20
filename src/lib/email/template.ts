export function buildEmail(opts: {
  title?: string
  heading?: string
  intro?: string
  ctaText?: string
  ctaUrl?: string
  ctaNote?: string
  footerNote?: string
  logoUrl?: string
}) {
  const {
    title = 'Bienvenido a SmileSys',
    heading = 'Bienvenido a SmileSys',
    intro = 'Tu gestión odontológica, más simple y segura',
    ctaText = 'Continuar',
    ctaUrl = '#',
    ctaNote = '',
    footerNote = '— El equipo de SmileSys',
    logoUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com').replace(/\/$/, '') + '/images/smileSys_Negro.png',
  } = opts

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-width:100%;background:#f5f7fb;padding:24px 0">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(20,30,40,0.08)">
            <tr>
              <td style="padding:28px 28px 8px;text-align:center;background:linear-gradient(90deg,#06b6d4,#0891b2);color:#fff">
                <img src="${logoUrl}" alt="SmileSys" width="84" style="display:block;margin:0 auto 12px" />
                <h1 style="margin:0;font-size:20px;font-weight:700">${heading}</h1>
                <p style="margin:6px 0 0;font-size:13px;opacity:0.95">${intro}</p>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 36px 20px;color:#0f172a">
                <h2 style="margin:0 0 8px;font-size:18px;color:#0f172a">${heading}</h2>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.5;color:#334155">
                  ${opts.intro || ''}
                </p>

                <div style="text-align:center;margin:18px 0">
                  <a href="${ctaUrl}" style="display:inline-block;padding:12px 22px;background:#0ea5a4;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;box-shadow:0 6px 18px rgba(14,165,164,0.16)">
                    ${ctaText}
                  </a>
                </div>

                <p style="margin:0 0 12px;font-size:13px;color:#94a3b8">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:
                </p>
                <p style="word-break:break-all;font-size:13px;color:#0f172a;margin:0 0 18px"><a href="${ctaUrl}" style="color:#0ea5a4;text-decoration:underline">${ctaUrl}</a></p>

                ${ctaNote ? `<p style="margin:0 0 18px;font-size:13px;color:#475569">${ctaNote}</p>` : ''}

                <hr style="border:none;height:1px;background:#eef2f7;margin:18px 0" />

                <p style="margin:0;font-size:13px;color:#475569">
                  Si no solicitaste este correo, puedes ignorarlo y nadie tendrá acceso a tu cuenta.
                </p>

                <p style="margin:16px 0 0;font-size:13px;color:#475569">
                  ${footerNote}
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#0f172a;color:#cbd5e1;padding:14px 20px;text-align:center;font-size:12px">
                <div>¿Necesitas ayuda? Responde a este correo o visita <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}" style="color:#9be8e0;text-decoration:underline">our-site</a></div>
                <div style="margin-top:6px;opacity:0.75">© SmileSys</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
