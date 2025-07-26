import * as React from 'react';
import { cn } from '@/lib/utils';

export function SmileSysLogo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      {...props}
    >
      <path
        d="M24 4C12.96 4 4 12.96 4 24C4 35.04 12.96 44 24 44C35.04 44 44 35.04 44 24C44 12.96 35.04 4 24 4Z"
        fill="#2563EB"
      />
      <path
        d="M24 34C29.52 34 34 29.52 34 24H14C14 29.52 18.48 34 24 34Z"
        fill="white"
      />
      <path
        d="M31 20C31 21.66 29.66 23 28 23C26.34 23 25 21.66 25 20C25 18.34 26.34 17 28 17C29.66 17 31 18.34 31 20Z"
        fill="white"
      />
      <path
        d="M23 20C23 21.66 21.66 23 20 23C18.34 23 17 21.66 17 20C17 18.34 18.34 17 20 17C21.66 17 23 18.34 23 20Z"
        fill="white"
      />
    </svg>
  );
}
