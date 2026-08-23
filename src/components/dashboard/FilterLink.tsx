'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function FilterLink({ 
  href, 
  children, 
  className, 
  active 
}: { 
  href: string; 
  children: React.ReactNode; 
  className: string;
  active?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (active) return; // Si ya está activo, no recargar
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <a 
      href={href}
      onClick={handleClick}
      className={`relative block ${className} ${isPending ? 'opacity-70 cursor-wait' : ''}`}
    >
      {children}
      {isPending && (
        <div className="absolute inset-0 bg-white/50 rounded-2xl flex items-center justify-center z-10 backdrop-blur-[1px]">
          <Loader2 className="animate-spin text-slate-800" size={32} />
        </div>
      )}
    </a>
  );
}
