import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

type SmileSysLogoProps = {
  className?: string;
  size?: number;
};

export function SmileSysLogo({ className, size = 48 }: SmileSysLogoProps) {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';
  const src = isDark ? '/images/smileSys_Blanco.png' : '/images/smileSys_Negro.png';

  return (
    <Image
      src={src}
      alt="SmileSys Logo"
      width={size}
      height={size}
      className={cn(className)}
      priority
      data-ai-hint="logo"
    />
  );
}
