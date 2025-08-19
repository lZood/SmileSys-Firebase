import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Protect routes: if user logged in and clinic requires onboarding, redirect to /onboarding
// Skip for api, _next static, auth endpoints

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/onboarding')) {
    return NextResponse.next()
  }

  // Only enforce after login pages
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: () => {},
        remove: () => {},
      }
    }
  ) as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.next()

  // Fetch clinic flag via profile
  try {
    const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).maybeSingle()
    if (profile?.clinic_id) {
      const { data: clinic } = await supabase.from('clinics').select('first_setup_required').eq('id', profile.clinic_id).single()
      if (clinic?.first_setup_required && pathname !== '/onboarding') {
        const url = req.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    }
  } catch (e) {
    // ignore
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!favicon.ico).*)'],
}
