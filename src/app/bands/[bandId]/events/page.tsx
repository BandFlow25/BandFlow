// For both events/page.tsx and media/page.tsx
'use client';

import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import { PageLayout } from '@/components/layout/PageLayout';
import EventCalendar from '@/components/events/EventCalendar'; // or MediaGallery
  
export default function EventsPage() { // or MediaPage
  const { activeBand, isReady, error } = useBand();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
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

  return (
    <PageLayout title="Events"> {/* or "Media" */}
      <EventCalendar /> {/* or <MediaGallery /> */}
    </PageLayout>
  );
}