// app/bands/[bandId]/songs/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useBand } from '@/contexts/BandProvider';
import { SongsProvider, useSongs } from '@/contexts/SongProvider';
import { PageLayout } from '@/components/layout/PageLayout';
import { SongList } from '@/components/songs/SongList';
import { useSearchParams } from 'next/navigation';
import { SONG_LIST_TYPES, SongListType } from '@/lib/types/song';
import { SongHelpers } from '@/lib/services/bandflowhelpers/SongHelpers';

function SongsContent() {
  const { songs } = useSongs();
  const { activeBand } = useBand();
  const [songCounts, setSongCounts] = useState({
    total: 0,
    active: 0,
    suggested: 0,
    voting: 0,
    review: 0,
    practice: 0,
    playbook: 0,
    parked: 0,
    discarded: 0
  });
  
  const searchParams = useSearchParams();
  const rawView = searchParams?.get('view') || 'all';
  
  // Ensure the view matches one of our valid SONG_LIST_TYPES values
  let view = rawView.toLowerCase() as SongListType;
  
  // Validate the view is a valid type
  if (!Object.values(SONG_LIST_TYPES).includes(view)) {
    view = SONG_LIST_TYPES.ALL;
  }
  
  useEffect(() => {
    const loadCounts = async () => {
      if (activeBand?.id) {
        const counts = await SongHelpers.getAllSongCounts(activeBand.id);
        setSongCounts(counts);
      }
    };
    loadCounts();
  }, [activeBand?.id]);

  // Get the correct count based on view type
  const getViewCount = () => {
    switch (view) {
      case SONG_LIST_TYPES.SUGGESTIONS:
        return songCounts.suggested;
      case SONG_LIST_TYPES.VOTING:
        return songCounts.voting;
      case SONG_LIST_TYPES.REVIEW:
        return songCounts.review;
      case SONG_LIST_TYPES.PRACTICE:
        return songCounts.practice;
      case SONG_LIST_TYPES.PLAYBOOK:
        return songCounts.playbook;
      case SONG_LIST_TYPES.ALL:
      default:
        return songCounts.active; // For ALL view, show active songs count
    }
  };
  
  const getTitle = () => {
    switch (view) {
      case SONG_LIST_TYPES.SUGGESTIONS:
        return 'Suggestions';
      case SONG_LIST_TYPES.VOTING:
        return 'In Voting';
      case SONG_LIST_TYPES.REVIEW:
        return 'In Review';
      case SONG_LIST_TYPES.PRACTICE:
        return 'Practice List';
      case SONG_LIST_TYPES.PLAYBOOK:
        return 'Playbook';
      case SONG_LIST_TYPES.ALL:
      default:
        return 'All Songs';
    }
  };
  
  return (
    <PageLayout 
      title={getTitle()}
      count={getViewCount()}
      pageType="songs"
    >
      <SongList type={view} />
    </PageLayout>
  );
}

export default function SongsPage() {
  const { activeBand, isActiveBandLoaded } = useBand();

  if (!isActiveBandLoaded || !activeBand) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <SongsProvider>
      <SongsContent />
    </SongsProvider>
  );
}