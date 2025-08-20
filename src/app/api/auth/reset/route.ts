import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, newPassword } = body
    if (!token || !newPassword) return NextResponse.json({ error: 'Campos incompletos' }, { status: 400 })

    const supabaseAdmin = await createClient()

    // Find password reset token
    const { data: pr, error: prErr } = await supabaseAdmin.from('password_resets').select('*').eq('token', token).single()
    if (prErr || !pr) return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 })
    if (new Date(pr.expires_at) < new Date()) return NextResponse.json({ error: 'Token expirado' }, { status: 400 })

    const userId = pr.user_id

    // Update auth user's password using admin API
    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword })
    if (updErr) {
      console.error('Failed updating user password', updErr)
      return NextResponse.json({ error: 'No se pudo actualizar la contraseña' }, { status: 500 })
    }

    // Clear must_change_password flags and delete token
    try {
      await supabaseAdmin.from('profiles').update({ must_change_password: false }).eq('id', userId)
    } catch (e) { /* ignore */ }
    try {
      await supabaseAdmin.from('members').update({ must_change_password: false }).eq('user_id', userId)
    } catch (e) { /* ignore */ }

    await supabaseAdmin.from('password_resets').delete().eq('token', token)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Reset endpoint error', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
