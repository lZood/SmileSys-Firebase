import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type SmileSysLogoProps = {
  className?: string;
};

export function SmileSysLogo({ className }: SmileSysLogoProps) {
  return (
    <Image
      src="https://placehold.co/48x48.png"
      alt="SmileSys Logo"
      width={48}
      height={48}
      className={cn(className)}
      data-ai-hint="logo"
    />
  );
}
