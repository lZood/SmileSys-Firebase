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
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false)
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('signup') === 'success') {
        setSignupSuccess(true)
      }
    }
  }, [])

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
          {signupSuccess && (
            <div className="mb-2 rounded bg-green-100 text-green-800 text-sm px-3 py-2 font-medium">
              Your account was created successfully! Please sign in to continue.
            </div>
          )}
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
                <Link href="#" className="ml-auto inline-block text-sm underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando Sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
            ¿No tienes una cuenta?{' '}
            <Link href="/signup-new" className="underline">
              Regístrate
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
