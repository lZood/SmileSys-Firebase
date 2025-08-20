'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      // We intentionally don't reveal whether the email exists.
      if (res.ok) {
        setSent(true);
        toast({ title: 'Correo enviado', description: 'Si existe una cuenta asociada, recibirás un correo con instrucciones para crear una nueva contraseña.' });
        // Optionally redirect to login after short delay
        setTimeout(() => router.replace('/'), 2500);
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Error', description: data?.error || 'Ocurrió un error al solicitar el restablecimiento.' });
      }
    } catch (err: any) {
      console.error('Forgot password request failed', err);
      toast({ title: 'Error', description: 'No se pudo enviar el correo. Intenta de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Olvidé mi contraseña</h2>
          <p className="mt-2 text-sm text-gray-600">Introduce el correo asociado a tu cuenta y te enviaremos un enlace para crear una nueva contraseña.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Restablecer contraseña</CardTitle>
            <CardDescription>Recibirás un correo con un enlace seguro para crear una nueva contraseña.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required disabled={isLoading || sent} />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !email || sent}>
                {isLoading ? 'Enviando...' : (sent ? 'Enviado' : 'Enviar correo')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
