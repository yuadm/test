'use client';

import { usePathname } from 'next/navigation';

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/';
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow w-full">
        {children}
      </main>
    </div>
  );
}
