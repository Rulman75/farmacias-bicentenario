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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (pathname !== '/login') {
      getCurrentUser().then(u => setUser(u));
    }
    // Close menu when navigating
    setMobileMenuOpen(false);
  }, [pathname]);
  
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const isVisor = user?.id_perfil === 2;

  return (
    <div className="flex min-h-screen relative">
      {!isVisor && (
        <>
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
          <Sidebar isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} />
        </>
      )}
      <div className={`flex-1 flex flex-col min-h-screen w-full ${!isVisor ? 'md:ml-64' : ''}`}>
        <Header isVisor={isVisor} toggleMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
        {!isVisor && <TransferCartIndicator />}
      </div>
    </div>
  );
}
