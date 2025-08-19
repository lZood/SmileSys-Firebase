'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SmileSysLogoDynamic } from '@/components/icons/smilesys-logo-dynamic';
import { useToast } from '@/hooks/use-toast';
import { signUpNewClinic } from '../admin/actions';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      clinicName: '',
      email: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const result = await signUpNewClinic({
        firstName: formData.firstName,
        lastName: formData.lastName,
        clinicName: formData.clinicName,
        adminEmail: formData.email,
    });

    // Handle backend validation / creation errors
    if (result?.error) {
        toast({
            variant: 'destructive',
            title: 'Error durante el registro',
            description: result.error,
        });
    } else {
        // Success: show main toast
        toast({
            title: '¡Registro Exitoso!',
            description: 'Revisa tu correo para activar la cuenta y crear tu contraseña.',
        });

        // If backend returned a warning about email (rate limit), show it as info
        if ((result as any)?.warning) {
            toast({
                title: 'Aviso',
                description: (result as any).warning,
            });
        }

        // Redirect to plan selection or check-email page, include email as query param
        router.push(`/select-plan?email=${encodeURIComponent(formData.email)}`);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <SmileSysLogoDynamic size={48} className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">Crea tu Cuenta en SmileSys</CardTitle>
          <CardDescription>Empieza contándonos un poco sobre ti y tu clínica.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="grid gap-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input id="firstName" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input id="lastName" value={formData.lastName} onChange={handleChange} required />
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="clinicName">Nombre de la Clínica</Label>
              <Input id="clinicName" value={formData.clinicName} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creando Cuenta...' : 'Continuar a la Selección de Plan'}
            </Button>
          </form>
            <div className="mt-4 text-center text-sm">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/" className="underline">
                    Iniciar Sesión
                </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

