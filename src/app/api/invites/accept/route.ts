import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, userId } = body
    if (!token || !userId) return NextResponse.json({ error: 'token y userId son requeridos' }, { status: 400 })

    const supabase = await createClient()
    // Mark invite accepted
    const { data, error } = await supabase.from('invites').update({ accepted: true, accepted_at: new Date().toISOString() }).eq('token', token).select().single()
    if (error) return NextResponse.json({ error: 'No se pudo aceptar la invitación' }, { status: 500 })

    // Create member row linking user to clinic if provided
    if (data?.clinic_id) {
      await supabase.from('members').insert({ user_id: userId, clinic_id: data.clinic_id, role: data.role || 'member' })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
