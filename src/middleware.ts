import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Protect routes: if user logged in and clinic requires onboarding, redirect to /onboarding
// Skip for api, _next static, auth endpoints

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options?: any) => { res.cookies.set({ name, value, ...options }) },
        remove: (name: string, options?: any) => { res.cookies.set({ name, value: '', ...options }) },
      }
    }
  ) as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return res // not authenticated

  // Fetch profile + clinic flag
  const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).maybeSingle()
  if (!profile?.clinic_id) return res
  const { data: clinic } = await supabase.from('clinics').select('first_setup_required').eq('id', profile.clinic_id).maybeSingle()
  if (!clinic) return res

  const pathname = req.nextUrl.pathname
  if (clinic.first_setup_required) {
    // Force onboarding for any route except allowed public/auth routes
    const allow = ['/onboarding', '/api', '/first-login', '/logout', '/settings', '/favicon.ico']
    if (!allow.some(p => pathname.startsWith(p)) && pathname !== '/') {
      const url = req.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  } else if (pathname.startsWith('/onboarding')) {
    // Prevent accessing onboarding again
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next|static|.*\.[^/]+$).*)'
  ],
}
