// playbook/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useBand } from '@/contexts/BandProvider';
import { PageLayout } from '@/components/layout/PageLayout';
import { PlayBookList } from '@/components/songs/PlayBook';
import { SongsProvider } from '@/contexts/SongProvider';
import { SongHelpers } from '@/lib/services/bandflowhelpers/SongHelpers';

export default function PlayBookPage() {
  const { activeBand, isReady } = useBand();
  const [playBookCount, setPlayBookCount] = useState(0);
  
  useEffect(() => {
    const loadCounts = async () => {
      if (activeBand?.id) {
        const counts = await SongHelpers.getAllSongCounts(activeBand.id);
        setPlayBookCount(counts.playbook);
      }
    };
    loadCounts();
  }, [activeBand?.id]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <SongsProvider>
      <PageLayout 
        title="Play Book / Repertoire"
        count={playBookCount}
        pageType="songs"
      >
        <PlayBookList />
      </PageLayout>
    </SongsProvider>
  );
}