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
import { SmileSysLogo } from '@/components/icons/smilesys-logo';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<'idle'|'sent'|'error'>('idle');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // This effect will run once on component mount to check
  // if the user is already logged in from a previous session.
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // If a session exists, redirect to dashboard.
        // This handles cases where user revisits the page while logged in.
        router.push('/dashboard');
      }
    };
    checkUser();
  }, [router, supabase]);

  // Process auth tokens in URL fragment (e.g. links from Supabase recovery emails)
  useEffect(() => {
    const processHash = async () => {
      try {
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        if (!hash) return;
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const access_token = params.get('access_token');
        if (!access_token) return;
        const refresh_token = params.get('refresh_token') ?? undefined;

        // Bypass strict typing here — runtime values are strings when present
        const { error } = await (supabase.auth as any).setSession({ access_token: access_token, refresh_token });
        if (!error) {
          // clean the hash from the URL
          try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) { /* ignore */ }
          // redirect user to first-login flow where they will be prompted to change password
          router.replace('/first-login');
        } else {
          console.error('Error setting session from URL hash:', error);
        }
      } catch (e) {
        console.error('Error processing URL hash:', e);
      }
    };
    processHash();
  }, [router, supabase]);


  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
       toast({
        variant: "destructive",
        title: "Configuración Incompleta",
        description: "Las variables de entorno de Supabase no están configuradas. Revisa tu archivo .env.",
      });
      setIsLoading(false);
      return;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error de Autenticación",
        description: error.message,
      });
    } else if (data.session) {
      // On successful login, explicitly redirect to the dashboard.
      router.push('/dashboard');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <SmileSysLogo className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">Bienvenido a SmileSys</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder al panel de tu clínica.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Contraseña</Label>
                <button type="button" onClick={() => { setShowForgot(s => !s); setForgotEmail(email || ''); setForgotStatus('idle'); setForgotError(null); }} className="ml-auto inline-block text-sm underline text-sky-600">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              {showForgot && (
                <div className="mt-3 p-3 border rounded bg-white">
                  <p className="text-sm text-gray-700 mb-2">Ingresa tu correo para recibir instrucciones para restablecer tu contraseña.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <Input id="forgotEmail" type="email" placeholder="correo@ejemplo.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                    <div className="sm:col-span-2 flex gap-2">
                      <Button className="ml-auto" onClick={async () => {
                        setForgotLoading(true); setForgotStatus('idle'); setForgotError(null);
                        try {
                          const res = await fetch('/api/auth/resend-activation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail || email }) });
                          const data = await res.json().catch(() => ({}));
                          if (res.ok) {
                            setForgotStatus('sent');
                            setShowForgot(false);
                            toast({ title: 'Enviado', description: 'Revisa tu correo para restablecer la contraseña.' });
                          } else if (res.status === 429) {
                            setForgotStatus('error');
                            const msg429 = data?.detail || data?.error || data?.msg || 'Límite de envíos alcanzado. Intenta más tarde.';
                            setForgotError(msg429);
                            toast({ variant: 'destructive', title: 'Límite alcanzado', description: msg429 });
                          } else {
                             setForgotStatus('error');
                             setForgotError(data?.error || 'Error al enviar correo');
                             toast({ variant: 'destructive', title: 'Error', description: data?.error || 'No se pudo enviar el correo.' });
                           }
                        } catch (err) {
                          setForgotStatus('error');
                          setForgotError('Error de red');
                          toast({ variant: 'destructive', title: 'Error', description: 'Error de red al intentar enviar el correo.' });
                        } finally {
                          setForgotLoading(false);
                        }
                      }} disabled={forgotLoading || !(forgotEmail || email)}>{forgotLoading ? 'Enviando...' : 'Enviar correo'}</Button>
                      <Button variant="ghost" onClick={() => setShowForgot(false)}>Cancelar</Button>
                    </div>
                  </div>
                  {forgotStatus === 'sent' && <p className="mt-2 text-sm text-green-600">Correo enviado. Revisa tu bandeja y carpeta de spam.</p>}
                  {forgotStatus === 'error' && <p className="mt-2 text-sm text-red-600">{forgotError}</p>}
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando Sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
            ¿No tienes una cuenta?{' '}
            <Link href="/signup" className="underline">
              Regístrate
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
