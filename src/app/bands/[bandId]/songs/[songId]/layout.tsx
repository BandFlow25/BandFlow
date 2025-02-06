//src/app/bands/[bandId]/songs/[songId]/layout.tsx
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { useBand } from '@/contexts/BandProvider';

export default function SongDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeBand } = useBand();

  // This sets TOP level heading / back link
  return (
    <AppLayout
      backPath={`/bands/${activeBand?.id}/songs`}
      backLabel="Back to Songs"
      contentClassName="pb-16 sm:pb-0" // Add bottom padding on mobile for footer space
    >
      {children}
    </AppLayout>
  );
}