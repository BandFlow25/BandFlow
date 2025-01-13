// app/bands/[bandId]/setlists/[setlistId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useBand } from '@/contexts/BandProvider';
import { useSetlist } from '@/contexts/SetlistProvider';
import type { SetlistSong } from '@/lib/types/setlist';
import type { BandSong } from '@/lib/types/song';
import PageLayout from '@/components/layout/PageLayout';
import { Clock, ListMusic, Edit2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { AddSongsView } from '@/components/songs/SetLists/AddSongsView';
import { SetlistSongCard } from '@/components/songs/SongCard/SetListSongCard';
import CreateSetlistModal from '@/components/songs/SetLists/CreateSetlistModal';
import { DropResult } from '@hello-pangea/dnd';
import { updateSetlistSongs } from '@/lib/services/firebase/setlists';
import { formatDuration, calculateSetDurationInSeconds, getSetDurationInfo } from '@/lib/services/bandflowhelpers/SetListHelpers';

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

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

export default function SetlistDetailsPage() {
  const { setActiveBandId, isLoading: isBandLoading } = useBand();
  const { setlist, isLoading: isLoadingSetlist, error: setlistError, refreshSetlist } = useSetlist();
  const [showEditModal, setShowEditModal] = useState(false);
  const params = useParams();
  const pathname = usePathname();
  const bandId = params?.bandId as string;
  const setlistId = (params?.setlistId || pathname?.split('/').pop()) as string;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSetNumber, setActiveSetNumber] = useState<number | null>(null);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [songDetails, setSongDetails] = useState<Record<string, BandSong>>({});
  const [selectedSetNumber, setSelectedSetNumber] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Set active band ID
    if (bandId) {
      setActiveBandId(bandId);
    }
    // Load song details if we have both bandId and setlist
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
  }, [bandId, setlist, setActiveBandId]);


  const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        // Remove the touch-specific handling as it's causing issues
        tolerance: 5, // Add some tolerance for jitter
      },
    })
  );
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveSetNumber(active.data.current?.setNumber);
  };
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    // Early return if we don't have the required data
    if (!over || !active?.data?.current || !setlist) return;

    const activeSetNumber = active.data.current.setNumber;
    const overSetNumber = (over.data.current as { setNumber?: number })?.setNumber;

    // Only proceed if we have valid set numbers and they're different
    if (typeof activeSetNumber === 'number' &&
      typeof overSetNumber === 'number' &&
      activeSetNumber !== overSetNumber) {

      const updatedSongs = setlist.songs.map(song => {
        if (song.songId === active.id) {
          return {
            ...song,
            setNumber: overSetNumber
          };
        }
        return song;
      });

      const finalSongs = updatedSongs.map((song, idx) => ({
        ...song,
        position: idx
      }));

      updateSetlistSongs(bandId, setlistId, finalSongs)
        .then(refreshSetlist)
        .catch(console.error);
    }
  };
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveSetNumber(null);

    if (!over || !active?.data?.current || !setlist) return;

    const activeSetNumber = active.data.current.setNumber;
    const overSetNumber = (over.data.current as { setNumber?: number })?.setNumber;

    if (typeof activeSetNumber !== 'number' || typeof overSetNumber !== 'number') return;

    const setSongs = setlist.songs.filter(song => song.setNumber === overSetNumber);
    const oldIndex = setSongs.findIndex(song => song.songId === active.id);
    const newIndex = setSongs.findIndex(song => song.songId === over.id);

    if (oldIndex !== newIndex) {
      const reorderedSongs = arrayMove(setSongs, oldIndex, newIndex);

      const updatedSongs = setlist.songs.map(song => {
        if (song.setNumber !== overSetNumber) return song;
        const reorderedSong = reorderedSongs[
          reorderedSongs.findIndex(s => s.songId === song.songId)
        ];
        return reorderedSong ? { ...song, position: reorderedSongs.indexOf(reorderedSong) } : song;
      });

      try {
        await updateSetlistSongs(bandId, setlistId, updatedSongs);
        await refreshSetlist();
      } catch (error) {
        console.error('Error updating song positions:', error);
      }
    }
  };
  const handleSongRemove = async (songId: string) => {
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

    const existingSongIds = new Set(setlist.songs.map(s => s.songId));
    const filteredNewSongs = newSongs.filter(song => !existingSongIds.has(song.songId));

    const updatedSongs = [
      ...setlist.songs,
      ...filteredNewSongs.map((song, idx) => ({
        ...song,
        position: setlist.songs.length + idx,
        setNumber: selectedSetNumber || 1
      }))
    ];

    try {
      await updateSetlistSongs(bandId, setlistId, updatedSongs);
      await refreshSetlist();
    } catch (error) {
      console.error('Error adding songs:', error);
    }
  };
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination || !setlist) return;

    // Skip if dropped in same location
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceSetNumber = parseInt(source.droppableId.replace('set-', ''));
    const destSetNumber = parseInt(destination.droppableId.replace('set-', ''));

    // Create a new array with all songs
    const allSongs = [...setlist.songs];

    // Find the song being moved
    const movedSongIndex = allSongs.findIndex(s =>
      s.songId === draggableId && s.setNumber === sourceSetNumber
    );

    if (movedSongIndex === -1) return;

    // Remove the song from its original position
    const [movedSong] = allSongs.splice(movedSongIndex, 1);

    if (movedSong) {
      // Update the song's set number and position
      movedSong.setNumber = destSetNumber;

      // Find where to insert in the destination set
      let insertIndex = 0;
      const destSetSongs = allSongs.filter(s => s.setNumber === destSetNumber);

      if (destination.index < destSetSongs.length) {
        // Find the actual index in allSongs where we should insert
        const indexInAllSongs = allSongs.findIndex(s =>
          s.setNumber === destSetNumber &&
          s.position === destSetSongs[destination.index]?.position
        );
        insertIndex = indexInAllSongs === -1 ? allSongs.length : indexInAllSongs;
      } else {
        insertIndex = allSongs.length;
      }

      // Insert the song at the new position
      allSongs.splice(insertIndex, 0, movedSong);
    }

    // Update all positions to be sequential within each set
    const finalSongs = allSongs.map((song, idx) => ({
      ...song,
      position: idx
    }));

    try {
      await updateSetlistSongs(bandId, setlistId, finalSongs);
      await refreshSetlist();
    } catch (error) {
      console.error('Error updating song positions:', error);
    }
  };

  return (
    <PageLayout title={setlist?.name || 'Loading...'}>
      <div className="p-4">
        {/* Back Link */}
        <Link
          href={`/bands/${bandId}/setlists`}
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to setlists
        </Link>

        {/* Setlist Info */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">{setlist?.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-gray-400">
                <div className="flex items-center gap-1">
                  <ListMusic className="w-4 h-4" />
                  <span>{setlist?.songs.length || 0} songs</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {setlist?.format.numSets} sets, {setlist?.format.setDuration}min each
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

        {/* Set Container */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-6">
            {Array.from({ length: setlist?.format.numSets || 0 }).map((_, setIndex) => {
              const setNumber = setIndex + 1;
              const setSongs = setlist?.songs
                .filter((song) => song.setNumber === setNumber)
                .sort((a, b) => a.position - b.position) || [];

              const setDurationSeconds = calculateSetDurationInSeconds(
                setSongs.map(song => songDetails[song.songId]).filter(Boolean)
              );
              const durationInfo = getSetDurationInfo(
                setDurationSeconds,
                setlist?.format.setDuration || 45
              );

              return (
                <div
                  key={setNumber}
                  className={`
                    p-4 
                    rounded-lg 
                    bg-gray-800 
                    transition-colors 
                    duration-200
                    shadow-md
                    ${activeSetNumber === setNumber ? 'ring-2 ring-orange-500/20' : ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-white">Set {setNumber}</h3>
                      <span className={`text-sm ${durationInfo.color}`}>
                        ({setSongs.length} songs - {durationInfo.duration})
                      </span>
                    </div>
                    {setSongs.length > 0 && (
                      <Button
                        variant="outline"
                        className="text-orange-500 border-orange-500 hover:bg-orange-500/10"
                        onClick={() => {
                          setSelectedSetNumber(setNumber);
                          setIsModalOpen(true);
                        }}
                      >
                        Add More Songs
                      </Button>
                    )}
                  </div>

                  <SortableContext
                    items={setSongs.map(song => song.songId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div
                      data-set-number={setNumber}
                      role="list"  // Add this for accessibility
                      className={`
                      space-y-2 
                      rounded-lg 
                      p-2
                      transition-colors 
                      duration-200
                      min-h-[100px]
                      ${setSongs.length === 0 ? 'border-2 border-dashed border-gray-700/50' : ''}
                      ${activeSetNumber === setNumber ? 'bg-gray-700/50' : ''}
                    `}
                    >
                      {setSongs.map((song, index) => (
                        <SetlistSongCard
                          key={`${song.songId}-${setNumber}`}
                          id={song.songId}
                          songDetails={songDetails[song.songId]}
                          position={index + 1}
                          setNumber={setNumber}
                          isLoading={isLoadingSongs}
                          onRemove={() => handleSongRemove(song.songId)}
                        />
                      ))}

                      {setSongs.length === 0 && (
                        <div className="text-center py-6">
                          <p className="text-gray-400 mb-2">No songs in this set</p>
                          <Button
                            variant="outline"
                            size="lg"
                            className="text-orange-500 border-orange-500 hover:bg-orange-500/10"
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
                  </SortableContext>
                </div>
              );
            })}
          </div>
        </DndContext>

        {/* Modals */}
        {showEditModal && setlist && (
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

        {isModalOpen && selectedSetNumber !== null && setlist && (
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
      </div>
    </PageLayout>
  );
}