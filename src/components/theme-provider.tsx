
'use client';

import * as React from 'react';
import { getUserData } from '@/app/user/actions';
import { useServerInsertedHTML } from 'next/navigation';

type Theme = {
    light: Record<string, string>;
    dark: Record<string, string>;
};

function useGetTheme() {
    const [theme, setTheme] = React.useState<Theme | null>(null);

    React.useEffect(() => {
        const fetchTheme = async () => {
            const userData = await getUserData();
            if (userData?.clinic?.theme) {
                setTheme(userData.clinic.theme);
            }
        };
        fetchTheme();
    }, []);
    return theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useGetTheme();

    useServerInsertedHTML(() => {
        if (!theme) return null;
        
        const cssVariables = `
:root {
  --background: ${theme.light.background};
  --primary: ${theme.light.primary};
  --accent: ${theme.light.accent};
}
.dark {
  --background: ${theme.dark.background};
  --primary: ${theme.dark.primary};
  --accent: ${theme.dark.accent};
}
        `;
        return (
            <style
                id="custom-theme-provider"
                dangerouslySetInnerHTML={{
                    __html: cssVariables,
                }}
            />
        );
    });
    
    return <>{children}</>;
}
