import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { encryptEphemeral } from '@/lib/crypto'
import nodemailer from 'nodemailer'
import bcrypt from 'bcryptjs'
import { buildEmail } from '@/lib/email/template'

const CODE_TTL_MINUTES = 15

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, clinicName } = body || {}
    if (!email || !password || !clinicName) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    if (password.length < 8) return NextResponse.json({ error: 'Password too short' }, { status: 400 })

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Check existing auth user via listUsers (no direct email filter, so fetch and filter client-side if needed)
    const list = await supabaseAdmin.auth.admin.listUsers({ perPage: 100, page: 1 }) as any
    if (list?.data?.users?.some((u: any) => u.email?.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const supabase = await createServerClient()
    const { data: clinicExists } = await supabase.from('clinics').select('id').ilike('name', clinicName).maybeSingle()
    if (clinicExists) return NextResponse.json({ error: 'Clinic name already taken' }, { status: 409 })

    await supabase.from('pending_signups').delete().eq('email', email)

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const code_hash = await bcrypt.hash(code, 8)
    const expires_at = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString()

    const encrypted_password = encryptEphemeral(password)

    const { error: insertErr } = await supabase.from('pending_signups').insert({
      email,
      clinic_name: clinicName,
      password_hash: 'deprecated',
      encrypted_password,
      code_hash,
      expires_at,
      last_code_sent_at: new Date().toISOString()
    })
    if (insertErr) {
      console.error('pending_signups insert error', insertErr)
      return NextResponse.json({ error: 'Failed to start signup' }, { status: 500 })
    }

    // Send code via email
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      })

      const mailHtml = buildEmail({
        heading: 'Código de verificación',
        intro: `Tu código de verificación es: <strong style="font-size:24px;display:block;margin-top:8px">${code}</strong>`,
        ctaText: 'Usar código',
        ctaUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        ctaNote: `Este código expira en ${CODE_TTL_MINUTES} minutos.`
      })
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Código de verificación SmileSys',
        html: mailHtml,
        text: `Código: ${code}`
      })
    } catch (mailErr) {
      console.error('Email send failed', mailErr)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, email })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
