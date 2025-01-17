//src\app\bands\[bandId]\events\page.tsx
'use client';

import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import {PageLayout} from '@/components/layout/PageLayout';
import EventCalendar from '@/components/events/EventCalendar';


/** HIGHLIGHT: Removed setActiveBandId, params, and useEffect */
export default function EventsPage() {
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
    <PageLayout title="Events">
      <EventCalendar />
    </PageLayout>
  );
}