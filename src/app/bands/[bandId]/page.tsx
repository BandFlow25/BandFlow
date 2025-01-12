//src/app/bands/[bandId]/page.tsx
'use client';
 
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import { SongsProvider } from '@/contexts/SongProvider';
import PageLayout from '@/components/layout/PageLayout';
import { PlayBookList } from '@/components/songs/PlayBook/PlayBookList';
import { useParams } from 'next/navigation';


function PlaybookContent() {
  return (
    <PageLayout title="Play Book">
      <PlayBookList />
    </PageLayout>
  );
}

export default function BandPage() {
  const { user } = useAuth();
  const { setActiveBandId, activeBand, isLoading, error } = useBand();
  const params = useParams();
  
  useEffect(() => {
    if (user && params?.bandId) {
      setActiveBandId(params.bandId as string);
    }
  }, [params?.bandId, user, setActiveBandId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading band...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  if (!activeBand) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Band not found</div>
      </div>
    );
  }

  return (
    <SongsProvider>
      <PlaybookContent />
    </SongsProvider>
  );
}