// components/auth/GodModeGuard.tsx
'use client';

import { useAuth } from '@/contexts/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function GodModeGuard({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/god' && !profile?.godMode) {
      router.push('/home');
    }
  }, [profile, router, pathname]);

  if (!profile?.godMode) return null;

  return <>{children}</>;
}