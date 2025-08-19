import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request, context: any) {
  try {
    // read params safely from context to avoid Next.js sync-dynamic-apis warning
    const token = context?.params?.token
    if (!token) return NextResponse.json({ error: 'Token faltante' }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase.from('invites').select('*').eq('token', token).single()
    if (error || !data) return NextResponse.json({ error: 'Invite no encontrado' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
