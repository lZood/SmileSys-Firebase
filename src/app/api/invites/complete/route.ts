import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, firstName: bFirstName, lastName: bLastName, password } = body
    // only token and password are strictly required
    if (!token || !password) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

    // Normalize name fields: accept body values or try to infer from email later
    const firstName = (bFirstName || bFirstName === '') ? bFirstName : undefined
    const lastName = (bLastName || bLastName === '') ? bLastName : undefined

    const supabaseAdmin = await createClient()

    // Fetch invite
    const { data: invite, error: inviteErr } = await supabaseAdmin.from('invites').select('*').eq('token', token).single()
    if (inviteErr || !invite) return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })

    if (invite.accepted) return NextResponse.json({ error: 'Invitación ya aceptada' }, { status: 400 })
    if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Invitación expirada' }, { status: 400 })

    // If names are not provided, try to infer from invite record or email local-part
    let finalFirst = firstName
    let finalLast = lastName
    if (!finalFirst && invite.first_name) finalFirst = invite.first_name
    if (!finalLast && invite.last_name) finalLast = invite.last_name
    if ((!finalFirst || !finalLast) && invite.email) {
      const local = invite.email.split('@')[0].replace(/[._]/g, ' ')
      const parts = local.split(' ')
      if (!finalFirst && parts.length >= 1) finalFirst = parts[0]
      if (!finalLast && parts.length >= 2) finalLast = parts.slice(1).join(' ')
    }

    // Ensure at least empty strings for DB inserts
    finalFirst = finalFirst || ''
    finalLast = finalLast || ''

    // Create user in Auth using admin key
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `${finalFirst} ${finalLast}`.trim() }
    })

    if (authError) {
      console.error('Error creating auth user', authError)
      // If the email already exists, return a friendly 409 so the client can prompt reset/login
      if (authError?.status === 422 || authError?.code === 'email_exists') {
        return NextResponse.json({ error: 'Ya existe un usuario con este correo. Pide restablecer la contraseña o inicia sesión.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 500 })
    }

    const userId = authData.user.id

    // Create profile and member entries
    const { error: profileErr } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      clinic_id: invite.clinic_id || null,
      first_name: finalFirst,
      last_name: finalLast,
      roles: [invite.role || 'member']
    })

    if (profileErr) {
      console.error('Profile creation failed', profileErr)
      // Attempt to rollback user
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'No se pudo crear el perfil' }, { status: 500 })
    }

    if (invite.clinic_id) {
      const { error: memberErr } = await supabaseAdmin.from('members').insert({ user_id: userId, clinic_id: invite.clinic_id, role: invite.role || 'member' })
      if (memberErr) {
        console.error('Member creation failed', memberErr)
      }
    }

    // Mark invite accepted
    await supabaseAdmin.from('invites').update({ accepted: true, accepted_at: new Date().toISOString() }).eq('token', token)

    return NextResponse.json({ ok: true, userId })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
