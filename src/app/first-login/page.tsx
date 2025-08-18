'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function FirstLoginPage() {
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    // true when this is the first-time activation (must change password)
    const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    // Verificar y consumir token en el fragmento (#access_token=...)
    useEffect(() => {
        const processHashAndCheck = async () => {
            try {
                // 1) Si la URL contiene un fragmento con access_token, establecer sesión
                try {
                    const hash = typeof window !== 'undefined' ? window.location.hash : '';
                    if (hash) {
                        const params = new URLSearchParams(hash.replace(/^#/, ''));
                        const access_token = params.get('access_token');
                        const refresh_token = params.get('refresh_token');
                        if (access_token && refresh_token) {
                            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
                            if (error) {
                                console.error('Error setting session from hash:', error);
                            } else {
                                // Clean the hash from the URL to avoid resubmitting tokens
                                try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) { /* ignore */ }
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Error processing URL hash:', e);
                }

                // 2) Ahora validar si hay usuario autenticado y necesita cambiar contraseña
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    // No autenticado, redirigir al login
                    router.push('/');
                    return;
                }

                // Verificar si realmente necesita cambiar contraseña
                const response = await fetch('/api/user/me');
                if (response.ok) {
                    const data = await response.json();
                    if (!data.mustChangePassword) {
                        // No necesita cambiar contraseña, redirigir al dashboard
                        router.push('/dashboard');
                        return;
                    }
                    // Mark that this flow was triggered because the user must set a password
                    setIsFirstTime(Boolean(data.mustChangePassword));
                }
            } catch (error) {
                console.error('Error checking auth status:', error);
                router.push('/');
            } finally {
                setIsCheckingAuth(false);
            }
        };

        processHashAndCheck();
    }, [router, supabase.auth]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.newPassword !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (formData.newPassword.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/users/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newPassword: formData.newPassword,
                    confirmPassword: formData.confirmPassword
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al cambiar la contraseña');
            }

            toast({
                title: 'Contraseña actualizada',
                description: 'Tu contraseña ha sido cambiada exitosamente. Por favor, inicia sesión nuevamente.'
            });

            // If backend cleared the must_change_password flag, keep session and go to dashboard
            const cleared = (result && (result.cleared && (result.cleared.profiles || result.cleared.members))) || null;
            if (cleared) {
                // Redirect to dashboard (session should already be active)
                router.replace('/dashboard');
            } else {
                // Fallback: sign out and redirect to login so the user can sign in with the new password
                try { await supabase.auth.signOut(); } catch (e) { /* ignore */ }
                router.push('/');
            }
        } catch (err: any) {
            setError(err.message || 'Error inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <Skeleton className="h-8 w-64 mx-auto mb-4" />
                        <Skeleton className="h-4 w-48 mx-auto" />
                    </div>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        {isFirstTime ? 'Crear Contraseña' : 'Cambiar Contraseña'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {isFirstTime
                            ? 'Bienvenido a SmileSys — crea tu contraseña para activar tu cuenta y acceder al panel.'
                            : 'Debes cambiar tu contraseña temporal antes de continuar.'}
                    </p>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>{isFirstTime ? 'Crear tu contraseña' : 'Nueva Contraseña'}</CardTitle>
                        <CardDescription>
                            {isFirstTime ? 'Elige una contraseña segura para tu cuenta de SmileSys.' : 'Ingresa una contraseña segura que recordarás para futuras sesiones.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="Mínimo 8 caracteres"
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Repite la contraseña"
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={isLoading || !formData.newPassword || !formData.confirmPassword}
                            >
                                {isLoading ? (isFirstTime ? 'Creando contraseña...' : 'Cambiando contraseña...') : (isFirstTime ? 'Crear Contraseña' : 'Cambiar Contraseña')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
