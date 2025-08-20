import { createBrowserClient } from '@supabase/ssr'

export function createClient(useLocalStorage = true) {
  // Create a supabase client on the browser with project's credentials
  // Accepts useLocalStorage = false to use sessionStorage for 'remember me' false flows
  const storage =
    typeof window !== 'undefined'
      ? useLocalStorage
        ? window.localStorage
        : window.sessionStorage
      : undefined

  const options: any = {}
  if (storage) {
    options.auth = { storage }
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
  )
}
