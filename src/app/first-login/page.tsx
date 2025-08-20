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
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const process = async () => {
      try {
        // 1) consume hash tokens if present
        try {
          const hash = typeof window !== 'undefined' ? window.location.hash : '';
          if (hash) {
            const params = new URLSearchParams(hash.replace(/^#/, ''));
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            if (access_token && refresh_token) {
              const { error } = await supabase.auth.setSession({ access_token, refresh_token });
              if (!error) {
                try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) { /* ignore */ }
              }
            }
          }
        } catch (e) {
          console.warn('Error processing URL hash:', e);
        }

        // Check query for invite token first
        const urlParams = new URLSearchParams(window.location.search);
        const invite = urlParams.get('invite');
        if (invite) {
          setInviteToken(invite);
          try {
            const invRes = await fetch(`/api/invites/${invite}`);
            if (invRes.ok) {
              const invData = await invRes.json();
              setInviteInfo(invData);
              // prefill names if provided in invite data
              setFormData((f) => ({ ...f, firstName: invData?.first_name || '', lastName: invData?.last_name || '' }));
            }
          } catch (e) {
            console.warn('Failed to fetch invite info', e);
          }
          // For invite flow we allow no authenticated user
        }

        // Now check current user session
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            // if no user and no invite, must redirect to login
            if (!invite) {
              router.push('/');
              return;
            }
            // else: invite flow continues without session
          } else {
            // User present: check mustChangePassword
            const response = await fetch('/api/user/me');
            if (response.ok) {
              const data = await response.json();
              if (!data.mustChangePassword) {
                router.push('/dashboard');
                return;
              }
              setIsFirstTime(Boolean(data.mustChangePassword));
            }
          }
        } catch (e) {
          console.warn('Auth check failed', e);
        }

      } catch (err) {
        console.error('Error checking auth status:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    process();
  }, [router, supabase.auth]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setError(null);
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    // derive token from state or URL to avoid missing-token issues
    const tokenToUse = inviteToken || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('invite') : null);
    if (!tokenToUse) {
      setError('Token de invitación inválido.');
      return;
    }

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
      const res = await fetch('/api/invites/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenToUse,
          password: formData.newPassword,
          firstName: inviteInfo?.first_name || inviteInfo?.firstName || '',
          lastName: inviteInfo?.last_name || inviteInfo?.lastName || ''
        })
      });

      const data = await res.json();

      if (!res.ok) {
        // handle specific 409 email exists case
        if (res.status === 409) {
          setError(data.error || 'Ya existe un usuario con este correo. Por favor inicia sesión o solicita restablecer la contraseña.');
          setIsLoading(false);
          return;
        }
        throw new Error(data.error || 'No se pudo completar la invitación');
      }

      // Invitation completed successfully. Redirect user to login with a success message
      try {
        toast({ title: 'Cuenta creada', description: 'La cuenta se creó correctamente. Por favor, inicia sesión.' });
      } catch (e) { /* ignore */ }
      // Ensure any client session is cleared and redirect to login
      try { await supabase.auth.signOut(); } catch (e) { /* ignore */ }
      router.replace('/');
      return;
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: formData.newPassword, confirmPassword: formData.confirmPassword })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al cambiar la contraseña');

      toast({ title: 'Contraseña actualizada', description: 'Tu contraseña ha sido cambiada exitosamente. Por favor, inicia sesión nuevamente.' });

      const cleared = (result && (result.cleared && (result.cleared.profiles || result.cleared.members))) || null;
      if (cleared) {
        router.replace('/dashboard');
      } else {
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
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{inviteInfo ? 'Crear Contraseña' : (isFirstTime ? 'Crear Contraseña' : 'Cambiar Contraseña')}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {inviteInfo
              ? `Has sido invitado a ${inviteInfo?.clinic_id ? `la clínica` : 'SmileSys'}. Completa tus datos y crea una contraseña para activar tu cuenta.`
              : (isFirstTime ? 'Bienvenido a SmileSys — crea tu contraseña para activar tu cuenta y acceder al panel.' : 'Debes cambiar tu contraseña temporal antes de continuar.')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{inviteInfo ? 'Crear tu contraseña' : 'Nueva Contraseña'}</CardTitle>
            <CardDescription>
              {inviteInfo ? 'Elige una contraseña segura para tu cuenta de SmileSys.' : 'Ingresa una contraseña segura que recordarás para futuras sesiones.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={inviteInfo ? handleAcceptInvite : handleSubmit} className="space-y-4">
              {/* For invite flow we only ask for password; email/name are taken from the invite and not requested here */}

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input id="newPassword" type="password" value={formData.newPassword} onChange={handleChange} placeholder="Mínimo 8 caracteres" disabled={isLoading} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Repite la contraseña" disabled={isLoading} required />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || !formData.newPassword || !formData.confirmPassword}>
                {isLoading ? (inviteInfo ? 'Creando contraseña...' : (isFirstTime ? 'Creando contraseña...' : 'Cambiando contraseña...')) : (inviteInfo ? 'Crear Contraseña' : (isFirstTime ? 'Crear Contraseña' : 'Cambiar Contraseña'))}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
