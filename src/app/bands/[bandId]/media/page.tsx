//src\app\bands\[bandId]\media\page.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import PageLayout from '@/components/layout/PageLayout';
import { useParams } from 'next/navigation';
import MediaGallery from '@/components/media/MediaGallery';

export default function MediaPage() {
  const { user } = useAuth();
  const { setActiveBandId, activeBand, isLoading, error } = useBand();
  const params = useParams();
  const bandId = params?.bandId as string;

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
    <PageLayout title="Media">
      <MediaGallery />
    </PageLayout>
  );
}