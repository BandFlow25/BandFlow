// app/bands/[bandId]/songs/page.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import { SongsProvider, useSongs } from '@/contexts/SongProvider';
import PageLayout from '@/components/layout/PageLayout';
import { SongList } from '@/components/songs/SongList';
import { useParams, useSearchParams } from 'next/navigation';
import { SONG_LIST_TYPES, SongListType } from '@/lib/types/song';

// Helper to get the appropriate title based on view type
const getViewTitle = (type: SongListType, count: number) => {
  switch (type) {
    case SONG_LIST_TYPES.SUGGESTIONS:
      return `Suggestions (${count})`;
    case SONG_LIST_TYPES.VOTING:
      return `In Voting (${count})`;
    case SONG_LIST_TYPES.REVIEW:
      return `In Review (${count})`;
    case SONG_LIST_TYPES.PRACTICE:
      return `Practice List (${count})`;
    case SONG_LIST_TYPES.PLAYBOOK:
      return `Playbook (${count})`;
    default:
      return `All Songs (${count})`;
  }
};

// Wrapper component to access songs context
function SongsContent() {
  const { songs } = useSongs();
  const searchParams = useSearchParams();
  const rawView = searchParams?.get('view') || 'all';
  
  // Ensure the view matches one of our valid SONG_LIST_TYPES values
  let view = rawView.toLowerCase() as SongListType;
  
  // Validate the view is a valid type
  if (!Object.values(SONG_LIST_TYPES).includes(view)) {
    // Default to 'all' if invalid view type
    view = SONG_LIST_TYPES.ALL;
  }
  
  return (
    <PageLayout title={getViewTitle(view, songs.length)}>
      <SongList 
        type={view} 
        showCount={false} 
      />
    </PageLayout>
  );
}

export default function SongsPage() {
  const { user } = useAuth();
  const { setActiveBandId, activeBand, isLoading, error } = useBand();
  const params = useParams();
  const bandId = params?.bandId as string | undefined;

  useEffect(() => {
    if (user && bandId) {
      setActiveBandId(bandId);
    }
  }, [bandId, user, setActiveBandId]);

  if (isLoading || !activeBand) {
    return <div className="min-h-screen bg-gray-900" />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <SongsProvider>
      <SongsContent />
    </SongsProvider>
  );
}