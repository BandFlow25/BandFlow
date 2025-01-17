// src/app/bands/[bandId]/setlists/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useBand } from '@/contexts/BandProvider';
import { Plus, Clock, ListMusic } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { Setlist } from '@/lib/types/setlist';
import CreateSetlistModal from '@/components/songs/SetLists/CreateSetlistModal';
import { Button } from '@/components/ui/button';
import { SearchHeader } from 'src/components/songs/Shared/SearchHeader';
import { cn } from '@/lib/utils';
import { SetlistProvider } from '@/contexts/SetlistProvider';
import { PageTitleHeader } from '@/components/layout/PageTitleHeader';

// Simplified interface for overview
interface SetlistOverview extends Setlist {
  id: string;
  hasNonPlaybookSongs?: boolean;
}

// Type for sort options
type SortOption = 'created' | 'duration' | 'sets';

function SetlistsPageContent() {
  const router = useRouter();
  const { activeBand, isActiveBandLoaded } = useBand();
  
  const [setlists, setSetlists] = useState<SetlistOverview[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [groupBySets, setGroupBySets] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBand?.id) return;

    console.log('Setting up setlists listener for band:', activeBand.id);
    setIsLoading(true);
    setError(null);

    const setlistsRef = collection(db, COLLECTIONS.BANDS, activeBand.id, COLLECTIONS.SETLISTS);
    const setlistsQuery = query(
      setlistsRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(setlistsQuery, 
      (snapshot) => {
        console.log('Received setlists update');
        const setlistData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          hasNonPlaybookSongs: false
        })) as SetlistOverview[];

        setSetlists(setlistData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Setlists subscription error:', error);
        setError('Failed to load setlists');
        setIsLoading(false);
      }
    );

    return () => {
      console.log('Cleaning up setlists listener');
      unsubscribe();
    };
  }, [activeBand?.id]);

  const organizedSetlists = useMemo(() => {
    let filtered = setlists;

    if (searchQuery) {
      filtered = filtered.filter(setlist =>
        setlist.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'duration':
          return (b.format?.setDuration || 0) - (a.format?.setDuration || 0);
        case 'sets':
          return (b.format?.numSets || 0) - (a.format?.numSets || 0);
        default:
          return b.createdAt.seconds - a.createdAt.seconds;
      }
    });

    if (groupBySets) {
      return filtered.reduce((acc, setlist) => {
        const key = `${setlist.format.numSets} ${setlist.format.numSets === 1 ? 'Set' : 'Sets'}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(setlist);
        return acc;
      }, {} as Record<string, typeof filtered>);
    }

    return { 'All Setlists': filtered };
  }, [setlists, searchQuery, sortBy, groupBySets]);

  if (!isActiveBandLoaded || isLoading) {
    return (
      <>
        <PageTitleHeader title="Setlists" count={0} />
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading setlists...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageTitleHeader title="Setlists" count={0} />
        <div className="text-red-500">{error}</div>
      </>
    );
  }

  return (
    <>
      <PageTitleHeader 
        title="Setlists" 
        count={setlists.length} 
       
      />
      <div className="flex flex-col h-[calc(100vh-120px)]">
        <SearchHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search setlists..."
          className="border-b border-gray-800"
        >
          <div className="flex gap-4 items-center">
            <div className="flex-1" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-gray-800 border-gray-700 rounded-lg px-3 py-2 text-gray-300"
            >
              <option value="created">Recently Created</option>
              <option value="duration">Set Duration</option>
              <option value="sets">Number of Sets</option>
            </select>
            <Button
              variant="outline"
              onClick={() => setGroupBySets(!groupBySets)}
              className={cn(
                "border-gray-700",
                groupBySets && "bg-gray-700"
              )}
            >
              Group by Sets
            </Button>
          </div>
        </SearchHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {setlists.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-400 mb-4">No setlists yet</h3>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-orange-500 hover:bg-orange-400"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Setlist
              </Button>
            </div>
          ) : (
            <>
              {Object.entries(organizedSetlists).map(([groupTitle, groupSetlists]) => (
                <div key={groupTitle} className="mb-8">
                  <h3 className="text-lg font-medium text-white mb-4">{groupTitle}</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groupSetlists.map(setlist => (
                      <div
                        key={setlist.id}
                        onClick={() => router.push(`/bands/${activeBand?.id}/setlists/${setlist.id}`)}
                        className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-medium text-white group-hover:text-orange-500 transition-colors">
                            {setlist.name}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {new Date(setlist.createdAt.seconds * 1000).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <ListMusic className="w-4 h-4" />
                            <span>{setlist.songs.length} songs</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {setlist.format.numSets} {setlist.format.numSets === 1 ? 'set' : 'sets'}, {setlist.format.setDuration} mins each
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <Button
                onClick={() => setShowCreateModal(true)}
                className="fixed bottom-6 right-6 rounded-full h-14 w-14 p-0 bg-orange-500 hover:bg-orange-400"
              >
                <Plus className="w-6 h-6" />
              </Button>
            </>
          )}
        </div>

        {showCreateModal && (
          <CreateSetlistModal
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </div>
    </>
  );
}

export default function SetlistsPage() {
  return (
    <PageLayout title="Setlists">
      <SetlistProvider>
        <SetlistsPageContent />
      </SetlistProvider>
    </PageLayout>
  );
}