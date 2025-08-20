import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, firstName: bFirstName, lastName: bLastName, password } = body
    // only token and password are strictly required
    if (!token || !password) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

    // Normalize name fields: accept body values or try to infer from email later
    const firstName = (bFirstName || bFirstName === '') ? bFirstName : undefined
    const lastName = (bLastName || bLastName === '') ? bLastName : undefined

    // Use service role client explicitly for admin operations
    const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Optionally still have anon client if needed for session-based stuff
    // const supabase = await createClient();

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
    let userId: string | null = null
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: invite.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: `${finalFirst} ${finalLast}`.trim() }
      })

      if (authError) throw authError
      userId = authData.user.id
    } catch (err: any) {
      console.error('Error creating auth user', err)
      // If the email already exists, try to find the existing user and update its password / confirm email
      if (err?.status === 422 || err?.code === 'email_exists') {
        try {
          const { data: listRes, error: listErr } = await supabaseAdmin.auth.admin.listUsers()
          if (listErr) {
            console.error('Failed listing auth users to locate existing user:', listErr)
            return NextResponse.json({ error: 'No se pudo completar la activación' }, { status: 500 })
          }
          const existing = (listRes && listRes.users || []).find((u: any) => (u.email || '').toLowerCase() === String(invite.email || '').toLowerCase())
          if (!existing) {
            return NextResponse.json({ error: 'Ya existe un usuario con este correo. Pide restablecer la contraseña o inicia sesión.' }, { status: 409 })
          }

          userId = existing.id
          // Update existing user: set password and confirm email
          const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password,
            email_confirm: true,
            user_metadata: { full_name: `${finalFirst} ${finalLast}`.trim() }
          })
          if (updErr) {
            console.error('Failed updating existing auth user:', updErr)
            return NextResponse.json({ error: 'No se pudo actualizar la cuenta existente.' }, { status: 500 })
          }
        } catch (findErr) {
          console.error('Error handling existing auth user:', findErr)
          return NextResponse.json({ error: 'No se pudo completar la activación' }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 500 })
      }
    }

    if (!userId) return NextResponse.json({ error: 'No se pudo determinar el usuario' }, { status: 500 })

    // Create profile if missing, else update basic info
    try {
      const { data: existingProfile, error: profErr } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).maybeSingle()
      if (profErr) {
        console.error('Error checking existing profile:', profErr)
      }

      if (!existingProfile) {
        const { error: profileErr } = await supabaseAdmin.from('profiles').insert({
          id: userId,
          clinic_id: invite.clinic_id || null,
          first_name: finalFirst,
          last_name: finalLast,
          roles: [invite.role || 'member']
        })
        if (profileErr) {
          console.error('Profile creation failed', profileErr)
          // Attempt to rollback user only if we created it just now — but safer to not delete existing users
          return NextResponse.json({ error: 'No se pudo crear el perfil' }, { status: 500 })
        }
      } else {
        // If profile exists, ensure roles contains invite.role
        const existingRoles = Array.isArray(existingProfile.roles) ? existingProfile.roles : (existingProfile.roles ? [existingProfile.roles] : [])
        const desired = new Set([...(existingRoles || []), invite.role || 'member'])
        const { error: updProfErr } = await supabaseAdmin.from('profiles').update({ first_name: finalFirst, last_name: finalLast, roles: Array.from(desired) }).eq('id', userId)
        if (updProfErr) console.warn('Failed to update existing profile basic info:', updProfErr)
      }

      // Create member row if invite includes clinic and members row missing
      if (invite.clinic_id) {
        const { data: existingMember } = await supabaseAdmin.from('members').select('*').eq('user_id', userId).eq('clinic_id', invite.clinic_id).maybeSingle()
        if (!existingMember) {
          const { error: memberErr } = await supabaseAdmin.from('members').insert({ user_id: userId, clinic_id: invite.clinic_id, role: invite.role || 'member' })
          if (memberErr) console.error('Member creation failed', memberErr)
        }
      }

      // Clear must_change_password flags on activation
      try {
        await supabaseAdmin.from('profiles').update({ must_change_password: false }).eq('id', userId)
      } catch (e) { /* ignore */ }
      try {
        await supabaseAdmin.from('members').update({ must_change_password: false }).eq('user_id', userId)
      } catch (e) { /* ignore */ }

    } catch (err) {
      console.error('Error creating profile/member after auth:', err)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    // Mark invite accepted
    await supabaseAdmin.from('invites').update({ accepted: true, accepted_at: new Date().toISOString() }).eq('token', token)

    return NextResponse.json({ ok: true, userId })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
