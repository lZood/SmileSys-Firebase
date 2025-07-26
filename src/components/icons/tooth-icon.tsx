import * as React from 'react';
import { cn } from '@/lib/utils';

export function ToothIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide lucide-tooth", className)}
      {...props}
    >
      <path d="M9.34 2.12a2.3 2.3 0 0 1 2.32 2.32v.02a4.4 4.4 0 0 1 .42 1.95 5.58 5.58 0 0 1-5.58 5.58 5.52 5.52 0 0 1-2.9-.84" />
      <path d="M12 2a4.82 4.82 0 0 0-3.37 1.25" />
      <path d="m2.5 11.5 2.72 2.72a2.3 2.3 0 0 0 3.24 0l.46-.46a1.5 1.5 0 0 1 2.12.12l.12.12a1.5 1.5 0 0 1 .12 2.12l-.46.46a2.3 2.3 0 0 0 0 3.24L11.5 21.5" />
      <path d="M21.5 11.5 18.78 8.78a2.3 2.3 0 0 0-3.24 0l-.46.46a1.5 1.5 0 0 1-2.12-.12l-.12-.12a1.5 1.5 0 0 1-.12-2.12l.46-.46a2.3 2.3 0 0 0 0-3.24L12.5 2.5" />
      <path d="M14.66 2.12a2.3 2.3 0 0 0-2.32 2.32v.02a4.4 4.4 0 0 0-.42 1.95 5.58 5.58 0 0 0 5.58 5.58 5.52 5.52 0 0 0 2.9-.84" />
      <path d="M12 2a4.82 4.82 0 0 1 3.37 1.25" />
    </svg>
  );
}
