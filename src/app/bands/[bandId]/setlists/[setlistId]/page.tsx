// app/bands/[bandId]/setlists/[setlistId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useBand } from '@/contexts/BandProvider';
import { useSetlist } from '@/contexts/SetlistProvider';
import type { SetlistSong } from '@/lib/types/setlist';
import type { BandSong } from '@/lib/types/song';
import PageLayout from '@/components/layout/PageLayout';
import { Clock, ListMusic, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import {AddSongsView} from '@/components/songs/SetLists/AddSongsView';
import { formatDuration } from '@/lib/utils/duration';
import { SetlistSongCard } from '@/components/songs/SongCard/SetListSongCard';
import CreateSetlistModal from '@/components/songs/SetLists/CreateSetlistModal';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { updateSetlistSongs } from '@/lib/services/firebase/setlists';



async function fetchSongDetails(songId: string): Promise<BandSong | null> {
  try {
    const songDoc = await getDoc(doc(db, 'bf_band_songs', songId));
    if (!songDoc.exists()) return null;
    return { id: songDoc.id, ...songDoc.data() } as BandSong;
  } catch (error) {
    console.error('Error fetching song details:', error);
    return null;
  }
}

const calculateSetDuration = (songs: (BandSong | undefined)[]): string => {
  const totalSeconds = songs.reduce((total, song) => {
    if (!song?.metadata?.duration) return total;
    const [mins, secs] = song.metadata.duration.split(':').map(Number);
    return total + ((mins || 0) * 60 + (secs || 0));
  }, 0);

  //const minutes = Math.floor(totalSeconds / 60);
  //const seconds = totalSeconds % 60;
  return formatDuration(totalSeconds);
};

export default function SetlistDetailsPage() {
  const { setActiveBandId, isLoading: isBandLoading } = useBand();
  const { setlist, isLoading: isLoadingSetlist, error: setlistError, refreshSetlist } = useSetlist();
  const [showEditModal, setShowEditModal] = useState(false);
  const params = useParams();
  const pathname = usePathname();
  const bandId = params?.bandId as string;
  const setlistId = (params?.setlistId || pathname?.split('/').pop()) as string;

  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [songDetails, setSongDetails] = useState<Record<string, BandSong>>({});
  const [selectedSetNumber, setSelectedSetNumber] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRemoveSong = async (songId: string) => {
    if (!setlist) return;

    const updatedSongs = setlist.songs.filter(s => s.songId !== songId);

    try {
      await updateSetlistSongs(bandId, setlistId, updatedSongs);
      await refreshSetlist();
    } catch (error) {
      console.error('Error removing song:', error);
    }
  };

  const handleSongSelect = async (newSongs: SetlistSong[]) => {
    if (!setlist) return;
  
    const currentSetSongs = setlist.songs
      .filter(song => song.setNumber === selectedSetNumber);
  
    const updatedSongs = [
      ...setlist.songs,
      ...newSongs.map((song, idx) => ({
        ...song,
        position: currentSetSongs.length + idx
      }))
    ];
  
    try {
      await updateSetlistSongs(bandId, setlistId, updatedSongs);
      await refreshSetlist();
    } catch (error) {
      console.error('Error adding songs:', error);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Increase the drag delay to prevent accidental drags
        delay: 100,
        tolerance: 5, // Add tolerance for better touch handling
        // Increase the distance threshold to help distinguish between drag and swipe
        distance: 10,
      },
    })
  );

  useEffect(() => {
    if (bandId) {
      setActiveBandId(bandId);
    }
  }, [bandId, setActiveBandId]);

  useEffect(() => {
    const loadSongDetails = async () => {
      if (!setlist) return;

      setIsLoadingSongs(true);
      const details: Record<string, BandSong> = {};

      try {
        await Promise.all(
          setlist.songs.map(async (song) => {
            const songDetail = await fetchSongDetails(song.songId);
            if (songDetail) {
              details[song.songId] = songDetail;
            }
          })
        );

        setSongDetails(details);
      } catch (error) {
        console.error('Error loading song details:', error);
      } finally {
        setIsLoadingSongs(false);
      }
    };

    if (setlist) {
      loadSongDetails();
    }
  }, [setlist]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !setlist) return;
  
    if (active.id !== over.id) {
      const activeSetNumber = (active.data.current as { setNumber: number })?.setNumber;
      const overSetNumber = (over.data.current as { setNumber: number })?.setNumber;
  
      // Create updated songs array
      const updatedSongs = setlist.songs.map(song => {
        if (song.songId === active.id) {
          // Update the dragged song with new set number and position
          return {
            ...song,
            setNumber: overSetNumber,
            position: setlist.songs
              .filter(s => s.setNumber === overSetNumber)
              .length
          };
        }
        return song;
      });
  
      try {
        await updateSetlistSongs(bandId, setlistId!, updatedSongs);
        await refreshSetlist();
      } catch (error) {
        console.error('Error updating song positions:', error);
      }
    }
  };

   if (isBandLoading || isLoadingSetlist) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  if (setlistError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">{setlistError}</div>
      </div>
    );
  }

  if (!setlist) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Setlist not found</div>
      </div>
    );
  }
  return (
    <PageLayout title={setlist.name}>
      <div className="p-4">
        {/* Setlist Info */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">{setlist.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-gray-400">
                <div className="flex items-center gap-1">
                  <ListMusic className="w-4 h-4" />
                  <span>{setlist.songs.length} songs</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {setlist.format.numSets} sets, {setlist.format.setDuration}min each
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(true)}
              className="text-gray-400 hover:text-white"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Add the edit modal */}
        {showEditModal && (
          <CreateSetlistModal
            onClose={() => setShowEditModal(false)}
            existingSetlist={{
              id: setlistId,
              name: setlist.name,
              format: setlist.format
            }}
            onUpdate={refreshSetlist}
          />
        )}

        {/* Sets */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {Array.from({ length: setlist.format.numSets }).map((_, setIndex) => {
            const setNumber = setIndex + 1;
            const setSongs = setlist.songs
              .filter((song) => song.setNumber === setNumber)
              .sort((a, b) => a.position - b.position);

            return (
              <div key={setNumber} className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    Set {setNumber}
                    <span className="text-sm text-gray-400">
                      ({setSongs.length} songs - {calculateSetDuration(setSongs.map(song => songDetails[song.songId]).filter(Boolean))} mins)
                    </span>
                  </h3>
                  <Button
                    variant="outline"
                    className="text-orange-500 border-orange-500 hover:bg-orange-500/10"
                    onClick={() => {
                      setSelectedSetNumber(setNumber);
                      setIsModalOpen(true);
                    }}
                  >
                    Add Songs to Set {setNumber}
                  </Button>
                </div>

                {setSongs.length > 0 ? (
                  <SortableContext
                    items={setSongs.map(song => song.songId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {setSongs.map((song, index) => (
                        <SetlistSongCard
                          key={song.songId}
                          songDetails={songDetails[song.songId]}
                          position={index + 1}
                          setNumber={setNumber}
                          onRemove={() => handleRemoveSong(song.songId)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                ) : (
                  <div className="text-center py-8 bg-gray-800/30 rounded-lg">
                    <p className="text-gray-400">No songs in this set</p>
                    <Button
                      variant="outline"
                      className="mt-2 text-orange-500 border-orange-500 hover:bg-orange-500/10"
                      onClick={() => {
                        setSelectedSetNumber(setNumber);
                        setIsModalOpen(true);
                      }}
                    >
                      Add Songs to Set {setNumber}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </DndContext>
      </div>

      {/* Song Selection Modal */}
      {isModalOpen && selectedSetNumber !== null && (
        <AddSongsView
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSetNumber(null);
          }}
          setlist={setlist}
          songDetails={songDetails}
          selectedSetNumber={selectedSetNumber}
          onSongAdd={handleSongSelect}
        />
      )}
    </PageLayout>
  );
}