'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function PasswordChangeGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        const checkPasswordChangeRequired = async () => {
            try {
                // No redirigir si ya está en la página de primer login o en páginas públicas
                if (pathname === '/first-login' || pathname === '/' || pathname.startsWith('/auth')) {
                    return;
                }

                // Verificar si el usuario está autenticado
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    return; // No autenticado, no hacer nada
                }

                // Verificar si necesita cambiar contraseña
                const response = await fetch('/api/user/me');
                if (response.ok) {
                    const data = await response.json();
                    if (data.mustChangePassword === true) {
                        router.replace('/first-login');
                    }
                }
            } catch (error) {
                console.error('Error checking password change requirement:', error);
            }
        };

        checkPasswordChangeRequired();
    }, [pathname, router]);

    return <>{children}</>;
}
