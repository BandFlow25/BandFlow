//src/app/bands/[bandId]/setlists/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBand } from '@/contexts/BandProvider';
import { Plus, Clock, ListMusic } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { collection, doc, getDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { Setlist } from '@/lib/types/setlist';  // Remove SetlistSong import
import type { BandSong } from '@/lib/types/song';
import CreateSetlistModal from '@/components/songs/SetLists/CreateSetlistModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/utils/duration';

// Extend Setlist type to include song details
interface SetlistWithSongDetails extends Setlist {
  songDetails: Record<string, BandSong>;
}

// Helper function to fetch song details
async function fetchSongDetails(bandId: string, songId: string): Promise<BandSong | null> {
  try {
    const songDoc = await getDoc(doc(db, 'bf_band_songs', songId));
    if (!songDoc.exists()) return null;
    return { id: songDoc.id, ...songDoc.data() } as BandSong;
  } catch (error) {
    console.error('Error fetching song details:', error);
    return null;
  }
}

function calculateSetlistDuration(setlist: SetlistWithSongDetails): string {
  let totalSeconds = setlist.songs.reduce((total, song) => {
    const songDetail = setlist.songDetails[song.songId];
    if (!songDetail?.metadata?.duration) return total;
    const [minutesStr, secondsStr] = songDetail.metadata.duration.split(':');
    const minutes = parseInt(minutesStr ?? '0') || 0;
    const seconds = parseInt(secondsStr ?? '0') || 0;
    return total + (minutes * 60 + seconds);
  }, 0);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return formatDuration(totalSeconds);
}

export default function SetlistsPage() {
  const router = useRouter();
  const { setActiveBandId, activeBand, isLoading } = useBand();
  const params = useParams();
  const bandId = params?.bandId as string;
  
  const [setlists, setSetlists] = useState<SetlistWithSongDetails[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created' | 'duration' | 'sets'>('created');
  const [groupBySets, setGroupBySets] = useState(true);

  useEffect(() => {
    if (bandId) {
      setActiveBandId(bandId);
    }
  }, [bandId, setActiveBandId]);

  // Subscribe to setlists and load song details
  useEffect(() => {
    if (!bandId) return;

    const setlistsRef = collection(db, COLLECTIONS.BANDS, bandId, 'setlists');
    const setlistsQuery = query(
      setlistsRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(setlistsQuery, async (snapshot) => {
      const setlistData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        songDetails: {}
      })) as SetlistWithSongDetails[];

      // Fetch song details for each setlist
      const updatedSetlists = await Promise.all(
        setlistData.map(async (setlist) => {
          const songDetails: Record<string, BandSong> = {};
          await Promise.all(
            setlist.songs.map(async (song) => {
              const details = await fetchSongDetails(bandId, song.songId);
              if (details) {
                songDetails[song.songId] = details;
              }
            })
          );
          return { ...setlist, songDetails };
        })
      );

      setSetlists(updatedSetlists);
    });

    return () => unsubscribe();
  }, [bandId]);

  const organizedSetlists = useMemo(() => {
    let filtered = setlists;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(setlist => 
        setlist.songs.some(song => {
          const songDetail = setlist.songDetails[song.songId];
          return songDetail && (
            songDetail.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            songDetail.artist.toLowerCase().includes(searchQuery.toLowerCase())
          );
        })
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'duration':
          return b.format.setDuration - a.format.setDuration;
        case 'sets':
          return b.format.numSets - a.format.numSets;
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

  if (isLoading || !activeBand) {
    return <div className="min-h-screen bg-gray-900" />;
  }

  return (
    <PageLayout title="Setlists">
      <div className="relative p-4">
        {/* Empty State */}
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
            {/* Search and Controls */}
            <div className="mb-6 space-y-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Input
                    type="search"
                    placeholder="Search setlists by song..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800/50 border-gray-700"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
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
            </div>

            {/* Grouped Setlists */}
            {Object.entries(organizedSetlists).map(([groupTitle, groupSetlists]) => (
              <div key={groupTitle} className="mb-8">
                <h3 className="text-lg font-medium text-white mb-4">{groupTitle}</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupSetlists.map(setlist => (
                    <div 
                    key={setlist.id}
                    onClick={() => router.push(`/bands/${bandId}/setlists/${setlist.id}`)}
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
                          {setlist.songs.length > 0 && (
                            <span className="text-gray-500">
                              ({calculateSetlistDuration(setlist)})
                            </span>
                          )}
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

            {/* FAB */}
            <Button
              onClick={() => setShowCreateModal(true)}
              className="fixed bottom-6 right-6 rounded-full h-14 w-14 p-0 bg-orange-500 hover:bg-orange-400"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <CreateSetlistModal
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </div>
    </PageLayout>
  );
}