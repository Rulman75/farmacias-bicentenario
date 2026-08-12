'use client'

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import TransferCartIndicator from '@/components/layout/TransferCartIndicator';
import { getCurrentUser } from '@/app/auth/actions';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (pathname !== '/login') {
      getCurrentUser().then(u => setUser(u));
    }
  }, [pathname]);
  
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const isVisor = user?.id_perfil === 2;

  return (
    <div className="flex min-h-screen">
      {!isVisor && <Sidebar />}
      <div className={`flex-1 flex flex-col min-h-screen ${!isVisor ? 'ml-64' : ''}`}>
        <Header isVisor={isVisor} />
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
        {!isVisor && <TransferCartIndicator />}
      </div>
    </div>
  );
}
