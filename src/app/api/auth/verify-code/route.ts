import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { decryptEphemeral } from '@/lib/crypto'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json()
    if (!email || !code) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Use service role for pending_signups because RLS only allows service_role
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: pending, error: pendErr } = await admin.from('pending_signups').select('*').eq('email', email).single()
    if (pendErr || !pending) return NextResponse.json({ error: 'Signup not found' }, { status: 404 })

    if (new Date(pending.expires_at) < new Date()) {
      await admin.from('pending_signups').delete().eq('email', email)
      return NextResponse.json({ error: 'Code expired' }, { status: 410 })
    }

    if (!(await bcrypt.compare(code, pending.code_hash))) {
      const attempts = (pending.attempts || 0) + 1
      await admin.from('pending_signups').update({ attempts }).eq('email', email)
      if (attempts >= 5) {
        await admin.from('pending_signups').delete().eq('email', email)
        return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
      }
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    // Decrypt password
    let password: string
    try { password = decryptEphemeral(pending.encrypted_password) } catch { return NextResponse.json({ error: 'Password decrypt failed' }, { status: 500 }) }

    // Create auth user (confirmed)
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { roles: ['admin'] }
    })
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: 'Auth create failed' }, { status: 500 })
    }

    const userId = authData.user.id

    // Create clinic
    const { data: clinicData, error: clinicErr } = await admin.from('clinics').insert({ name: pending.clinic_name, subscription_status: 'pending_payment', first_setup_required: true }).select().single()
    if (clinicErr) {
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Clinic creation failed' }, { status: 500 })
    }

    // Create profile
    const { error: profileErr } = await admin.from('profiles').insert({ id: userId, clinic_id: clinicData.id, first_name: '', last_name: '', roles: ['admin'], must_change_password: false })
    if (profileErr) {
      await admin.auth.admin.deleteUser(userId)
      await admin.from('clinics').delete().eq('id', clinicData.id)
      return NextResponse.json({ error: 'Profile creation failed' }, { status: 500 })
    }

    await admin.from('pending_signups').delete().eq('email', email)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
