
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToothIcon } from '@/components/icons/tooth-icon';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            // Check if user needs to set password (invited)
            // A user who clicked an invite link will have an `aal` (Authenticator Assurance Level) of aal1
            // We also check if their name is missing in their profile, as a secondary sign of an incomplete signup.
            if (session.user.user_metadata.first_name === undefined) {
                 router.push('/signup');
            } else if (session.user.email === 'admin@smilesys.com') {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
        }
    });

    return () => subscription.unsubscribe();
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
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error de Autenticación",
        description: error.message,
      });
    }
    // The onAuthStateChange listener will handle the redirect
    
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <ToothIcon className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">Welcome to SmileSys</CardTitle>
          <CardDescription>Enter your credentials to access your clinic's dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline">
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
