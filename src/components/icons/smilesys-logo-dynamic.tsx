import * as React from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

type SmileSysLogoDynamicProps = {
  className?: string;
  size?: number;
};

export const SmileSysLogoDynamic: React.FC<SmileSysLogoDynamicProps> = ({ className = '', size = 40 }) => {
  const { theme, systemTheme } = useTheme();
  // Determina el modo actual
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';
  const src = isDark
    ? '/images/smileSys_Blanco.png'
    : '/images/smileSys_Negro.png';
  return (
    <Image
      src={src}
      alt="SmileSys Logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
};
