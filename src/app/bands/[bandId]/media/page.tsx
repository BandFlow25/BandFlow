//src\app\bands\[bandId]\media\page.tsx
'use client';

import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import {PageLayout} from '@/components/layout/PageLayout';
import MediaGallery from '@/components/media/MediaGallery';


/** HIGHLIGHT: Removed setActiveBandId, params, and useEffect */
export default function MediaPage() {
  const { user } = useAuth();
  const { activeBand, isLoadingBands, error } = useBand();

  if (isLoadingBands || !activeBand) {
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