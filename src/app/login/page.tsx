'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { SmileSysLogo } from '@/components/icons/smilesys-logo';
import { Separator } from '@/components/ui/separator';

// Default schedule used when a Google user signs in for the first time and no clinic exists yet
const defaultSchedule = { monday:[{start:'09:00',end:'17:00'}], tuesday:[{start:'09:00',end:'17:00'}], wednesday:[{start:'09:00',end:'17:00'}], thursday:[{start:'09:00',end:'17:00'}], friday:[{start:'09:00',end:'17:00'}], saturday:[], sunday:[] };

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  // default client (uses localStorage)
  const supabase = createClient();

  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(/\bsmilesys_remember=(1|0)\b/);
        if (match) setRememberMe(match[1] === '1');
      }
    } catch {}
  }, []);

  // If user already logged in, initialize and redirect
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      try {
        const initRes = await fetch('/api/auth/init', { method: 'POST' });
        if (!initRes.ok) {
          let detail = ''; let friendly = 'No fue posible inicializar tu cuenta. Intenta de nuevo.';
          try { const json = await initRes.json(); detail = json?.error || json?.message || JSON.stringify(json); } catch {}
          console.error('Server /api/auth/init failed', initRes.status, detail);
          toast({ variant: 'destructive', title: 'Error del servidor', description: friendly });
          return;
        }
        let redirectTo = '/onboarding';
        const locationHeader = initRes.headers.get('location') || initRes.headers.get('Location');
        if (locationHeader) redirectTo = locationHeader; else { try { const json = await initRes.json(); if (json?.redirect) redirectTo = json.redirect; } catch {} }
        router.replace(redirectTo);
      } catch (e) {
        console.error('Initialization after login failed', e);
        toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un error al inicializar la cuenta.' });
      }
    };
    checkUser();
  }, [router, supabase, toast]);

  // Process auth tokens in URL hash (OAuth / recovery)
  useEffect(() => {
    const processHash = async () => {
      try {
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        if (!hash) return;
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const access_token = params.get('access_token');
        if (!access_token) return;
        const refresh_token = params.get('refresh_token') ?? undefined;
        const rememberFlag = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('remember') : null;
        const persist = rememberFlag !== null ? (rememberFlag === '1') : true;
        const client = createClient(persist);
        const { error } = await (client.auth as any).setSession({ access_token, refresh_token });
        if (!error) {
          try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch {}
          try {
            const initRes = await fetch('/api/auth/init', { method: 'POST' });
            if (!initRes.ok) {
              let detail = ''; let friendly = 'No se pudo configurar tu cuenta automáticamente.';
              try { const json = await initRes.json(); detail = json?.error || json?.message || JSON.stringify(json); } catch {}
              console.error('/api/auth/init failed after hash processing', initRes.status, detail);
              toast({ variant: 'destructive', title: 'Error del servidor', description: friendly });
              router.replace('/first-login');
              return;
            }
            let redirectTo = '/onboarding';
            const locationHeader = initRes.headers.get('location') || initRes.headers.get('Location');
            if (locationHeader) redirectTo = locationHeader; else { try { const json = await initRes.json(); if (json?.redirect) redirectTo = json.redirect; } catch {} }
            router.replace(redirectTo);
          } catch (e) {
            console.error('Error calling /api/auth/init after setting session', e);
            toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un error al configurar la cuenta.' });
            router.replace('/first-login');
          }
        } else {
          console.error('Error setting session from URL hash:', error);
        }
      } catch (e) { console.error('Error processing URL hash:', e); }
    };
    processHash();
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('signup') === 'success') setSignupSuccess(true);
    }
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      toast({ variant: 'destructive', title: 'Configuración Incompleta', description: 'Variables Supabase no configuradas.' });
      setIsLoading(false); return;
    }
    try {
      if (typeof document !== 'undefined') {
        const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
        const secure = location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `smilesys_remember=${rememberMe ? '1' : '0'}; Expires=${expires}; Path=/; SameSite=Lax${secure}`;
      }
    } catch {}
    const client = createClient(rememberMe);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ variant: 'destructive', title: 'Error de Autenticación', description: error.message });
    } else if (data.session) {
      try {
        const userId = data.session.user.id;
        const { data: profileData } = await client.from('profiles').select('clinic_id').eq('id', userId).maybeSingle();
        if (profileData?.clinic_id) {
          const { data: clinicData } = await client.from('clinics').select('first_setup_required').eq('id', profileData.clinic_id).maybeSingle();
          if (clinicData) {
            router.replace(clinicData.first_setup_required ? '/onboarding' : '/dashboard');
            setIsLoading(false); return;
          }
        }
        const initRes = await fetch('/api/auth/init', { method: 'POST' });
        if (!initRes.ok) {
          console.error('/api/auth/init failed after login', initRes.status);
          router.replace('/dashboard');
        } else {
          const locationHeader = initRes.headers.get('location') || initRes.headers.get('Location');
          if (locationHeader) router.replace(locationHeader); else {
            try { const json = await initRes.json(); if (json?.redirect) router.replace(json.redirect); else router.replace('/onboarding'); } catch { router.replace('/onboarding'); }
          }
        }
      } catch (e) {
        console.error('Initialization after login failed', e);
        toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un error al inicializar la cuenta.' });
        router.replace('/dashboard');
      }
    }
    setIsLoading(false);
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const client = createClient(true);
      const redirectBase = typeof window !== 'undefined' ? window.location.origin + '/login' : undefined;
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { scopes: 'openid email profile https://www.googleapis.com/auth/calendar', queryParams: { access_type: 'offline', prompt: 'consent' }, redirectTo: redirectBase }
      });
      if (error) {
        const msg = error.message.includes('provider is not enabled') ? 'Proveedor Google no habilitado en Supabase (Auth > Providers > Google).' : error.message;
        toast({ variant: 'destructive', title: 'Error', description: msg });
      }
    } catch (e:any) { toast({ variant: 'destructive', title: 'Error', description: e.message }); } finally { setIsLoading(false); }
  };

  const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 11v3.6h5.1c-.2 1.2-.9 2.3-2 3.1l3.2 2.5c1.9-1.8 3-4.3 3-7 0-.7-.1-1.4-.2-2.1H12z" />
      <path fill="#34A853" d="M6.6 14.3 5.4 15.4l-2.6 2C4.6 20.6 8.1 22 12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.9-1.7-5.7-4.1z" />
      <path fill="#4A90E2" d="M3.8 7.6C3.3 8.9 3 10.4 3 12s.3 2.6.8 3.9c0 .1 2.8-2.2 2.8-2.2-.2-.5-.3-1.1-.3-1.7 0-.6.1-1.2.3-1.7L3.8 7.6z" />
      <path fill="#FBBC05" d="M12 6c1.5 0 2.9.5 4 1.5L18.8 4C16.9 2.3 14.5 1.5 12 1.5 8.1 1.5 4.6 3.4 2.8 7.6l2.8 2.2C6.3 8.4 8.6 6 12 6z" />
    </svg>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <SmileSysLogo className="h-12 w-12" />
          </div>
          {signupSuccess && (
            <div className="mb-2 rounded bg-green-100 text-green-800 text-sm px-3 py-2 font-medium">
              ¡Tu cuenta se creó correctamente! Inicia sesión para continuar.
            </div>
          )}
          <CardTitle className="text-2xl font-bold font-headline">Bienvenido a SmileSys</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder al panel de tu clínica.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 mb-6">
            <Button type="button" variant="outline" onClick={signInWithGoogle} disabled={isLoading} className="w-full font-medium">
               <GoogleIcon /> Continuar con Google
             </Button>
             <div className="flex items-center gap-2">
               <Separator className="flex-1" />
               <span className="text-xs text-muted-foreground">o ingresa con email</span>
               <Separator className="flex-1" />
             </div>
           </div>
            <form onSubmit={handleLogin} className="grid gap-4">
             <div className="grid gap-2">
               <Label htmlFor="email">Email</Label>
               <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
             </div>
             <div className="grid gap-2">
               <div className="flex items-center">
                 <Label htmlFor="password">Contraseña</Label>
                 <Link href="/forgot-password" className="ml-auto inline-block text-sm underline">
                   ¿Olvidaste tu contraseña?
                 </Link>
               </div>
               <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
             </div>
             <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </Button>
            <div className="mt-3 flex justify-center">
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <label className="inline-flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4" />
                     <span className="text-sm">Mantener sesión</span>
                   </label>
                 </TooltipTrigger>
                 <TooltipContent side="top" className="max-w-xs">
                   Mantener sesión guarda tu preferencia (localStorage). Si no está activado, la sesión se guarda sólo por pestaña.
                 </TooltipContent>
               </Tooltip>
             </TooltipProvider>
           </div>
           </form>
           <div className="mt-4 text-center text-sm">
            ¿No tienes una cuenta?{' '}
            <Link href="/signup-new" className="underline">Regístrate</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
