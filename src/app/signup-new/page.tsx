"use client";
import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
const defaultSchedule = { monday:[{start:'09:00',end:'17:00'}], tuesday:[{start:'09:00',end:'17:00'}], wednesday:[{start:'09:00',end:'17:00'}], thursday:[{start:'09:00',end:'17:00'}], friday:[{start:'09:00',end:'17:00'}], saturday:[], sunday:[] }

export default function NewSignupPage() {
  const { toast } = useToast()
  const supabase = createClient()
  const [step, setStep] = useState<1|2>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [code, setCode] = useState(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  React.useEffect(() => {
    // If the user comes back from Google OAuth, process the URL hash to set session,
    // then call the server-side init endpoint which uses the service role to create
    // clinic/profile/member and returns where to redirect (onboarding).
    const init = async () => {
      try {
        // 1) Process URL hash tokens (access_token & refresh_token) if present
        if (typeof window !== 'undefined') {
          const hash = window.location.hash || '';
          if (hash) {
            try {
              const params = new URLSearchParams(hash.replace(/^#/, ''));
              const access_token = params.get('access_token');
              const refresh_token = params.get('refresh_token') ?? undefined;
              if (access_token) {
                // set session so supabase.auth.getUser() works
                await (supabase.auth as any).setSession({ access_token, refresh_token });
                try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) { /* ignore */ }
              }
            } catch (e) {
              console.warn('Failed to parse URL hash for OAuth tokens', e);
            }
          }
        }

        // 2) Now check for a session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // 3) Call server init to create clinic/profile/member using the admin service role
        const res = await fetch('/api/auth/init', { method: 'POST' });
        // If the server redirected, follow it; otherwise parse JSON
        if (res.redirected) {
          window.location.replace(res.url);
          return;
        }
        const json = await res.json().catch(() => null);
        if (json?.redirect) {
          window.location.replace(json.redirect);
        } else {
          // Default fallback
          window.location.replace('/onboarding');
        }
      } catch (e) {
        console.error('init after google on signup', e);
      }
    };
    init();
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const startSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, clinicName }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast({ title: 'Code sent', description: 'Check your email for the 6-digit code.' })
      setStep(2)
      setResendCooldown(60)
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message })
    } finally { setLoading(false) }
  }

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const codeStr = code.join('')
    if (codeStr.length !== 6) { toast({ variant: 'destructive', title: 'Código incompleto' }); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code: codeStr }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast({ title: 'Cuenta creada', description: 'Ahora puedes iniciar sesión.' })
      window.location.href = '/login?signup=success'
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message })
    } finally { setLoading(false) }
  }

  const resend = async () => {
    if (resendCooldown > 0) return
    try {
      const res = await fetch('/api/auth/resend-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast({ title: 'Código reenviado' })
      setResendCooldown(60)
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message }) }
  }

  const signUpWithGoogle = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar',
          queryParams: { access_type: 'offline', prompt: 'consent' },
          redirectTo: typeof window !== 'undefined' ? window.location.origin + '/signup-new' : undefined,
        }
      })
      if (error) {
        const msg = error.message.includes('provider is not enabled') ? 'Proveedor Google no habilitado en Supabase.' : error.message
        toast({ variant:'destructive', title:'Error', description: msg })
      }
    } catch (e:any) {
      toast({ variant:'destructive', title:'Error', description: e.message })
    } finally { setLoading(false) }
  }

  const GoogleIcon = () => (
    <svg className='mr-2 h-4 w-4' viewBox='0 0 24 24' aria-hidden='true'>
      <path fill='#EA4335' d='M12 11v3.6h5.1c-.2 1.2-.9 2.3-2 3.1l3.2 2.5c1.9-1.8 3-4.3 3-7 0-.7-.1-1.4-.2-2.1H12z' />
      <path fill='#34A853' d='M6.6 14.3 5.4 15.4l-2.6 2C4.6 20.6 8.1 22 12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.9-1.7-5.7-4.1z' />
      <path fill='#4A90E2' d='M3.8 7.6C3.3 8.9 3 10.4 3 12s.3 2.6.8 3.9c0 .1 2.8-2.2 2.8-2.2-.2-.5-.3-1.1-.3-1.7 0-.6.1-1.2.3-1.7L3.8 7.6z' />
      <path fill='#FBBC05' d='M12 6c1.5 0 2.9.5 4 1.5L18.8 4C16.9 2.3 14.5 1.5 12 1.5 8.1 1.5 4.6 3.4 2.8 7.6l2.8 2.2C6.3 8.4 8.6 6 12 6z' />
    </svg>
  )

  return (
    <div className='flex items-center justify-center min-h-screen bg-background p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className="relative">
          {step === 2 && (
            <button
              type="button"
              aria-label="Volver"
              onClick={() => {
                setStep(1);
                setCode(Array(6).fill(''));
                setTimeout(() => {
                  const el = document.querySelector('input[type=email]') as HTMLInputElement | null
                  if (el) el.focus()
                }, 50)
              }}
              className="absolute left-4 top-4 inline-flex items-center justify-center p-1 rounded-md hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div className={step === 2 ? 'pl-8' : ''}>
            <CardTitle>{step === 1 ? 'Crear cuenta' : 'Verificar correo'}</CardTitle>
            <CardDescription>
              {step === 1 ? 'Ingresa tus datos para crear tu cuenta.' : 'Introduce el código de 6 dígitos enviado a tu correo.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={startSignup} className='space-y-4'>
              <Button type='button' variant='outline' className='w-full mt-1 font-medium' disabled={loading} onClick={signUpWithGoogle}>
                <GoogleIcon /> Continuar con Google
              </Button>
              <div className='flex items-center gap-2 my-2'>
                <Separator className='flex-1' />
                <span className='text-xs text-muted-foreground'>o registrarse con email</span>
                <Separator className='flex-1' />
              </div>
              <div>
                <Label>Email</Label>
                <Input type='email' value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input type='password' value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div>
                <Label>Nombre de la Clínica</Label>
                <Input value={clinicName} onChange={e => setClinicName(e.target.value)} required />
              </div>
              <Button type='submit' className='w-full' disabled={loading}>{loading ? 'Enviando...' : 'Continuar'}</Button>
              <div className='mt-2 text-center'>
                <button type='button' className='text-sm underline' onClick={() => { window.location.href = '/'; }}>¿Ya tienes cuenta? Iniciar sesión</button>
              </div>
             </form>
           )}
           {step === 2 && (
             <form onSubmit={verifyCode} className='space-y-6'>
               <div className='flex gap-2 justify-between'>
                 {code.map((c,i) => (
                   <Input key={i} maxLength={1} className='text-center' value={c} onChange={e => {
                     const v = e.target.value.replace(/[^0-9]/g,'')
                     setCode(prev => prev.map((p,idx)=> idx===i? v : p))
                     if (v && i < 5) (document.getElementById('code-'+(i+1)) as HTMLInputElement)?.focus()
                   }} id={'code-'+i} />
                 ))}
               </div>
               <Button type='submit' className='w-full' disabled={loading}>{loading ? 'Verificando...' : 'Verificar'}</Button>
               <div className='text-sm text-center'>
                 {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : <button type='button' className='underline' onClick={resend}>Reenviar código</button>}
               </div>
               <div className='mt-4 flex flex-col items-center gap-2'>
                <button type='button' className='text-sm underline' onClick={() => {
                  // Allow user to update the email: go back to step 1 and focus email input
                  setStep(1)
                  setCode(Array(6).fill(''))
                  setTimeout(() => {
                    const el = document.querySelector('input[type=email]') as HTMLInputElement | null
                    if (el) el.focus()
                  }, 50)
                }}>Actualizar correo</button>
              </div>
             </form>
           )}
        </CardContent>
      </Card>
    </div>
  )
}
