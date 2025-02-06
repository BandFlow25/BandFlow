'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageTitleHeader } from '@/components/layout/PageTitleHeader';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout title="Band Settings">
      
      {children}
    </AppLayout>

  );
}