// app/bands/[bandId]/setlists/[setlistId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useBand } from '@/contexts/BandProvider';
import { useSetlist } from '@/contexts/SetlistProvider';
//import type { SetlistSong } from '@/lib/types/setlist';
import type { BandSong } from '@/lib/types/song';
import PageLayout from '@/components/layout/PageLayout';
import { Clock, ListMusic, Edit2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { SetlistSongCard } from '@/components/songs/SongCard/SetListSongCard';
import CreateSetlistModal from '@/components/songs/SetLists/CreateSetlistModal';
import { updateSetlistSongs } from '@/lib/services/firebase/setlists';
import { calculateSetDurationInSeconds, getSetDurationInfo } from '@/lib/services/bandflowhelpers/SetListHelpers';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,      // Add this
  MeasuringStrategy   // Add this
} from '@dnd-kit/core';
import {
  SortableContext,
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
  const { setActiveBandId } = useBand();
  const { setlist, refreshSetlist } = useSetlist();
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

  //const [isModalOpen, setIsModalOpen] = useState(false);

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
        distance: isTouchDevice() ? 5 : 8,
        // Prevent accidental drags
        delay: 100,
        // Required for consistent behavior
        tolerance: 5,
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

    if (!over || !active?.data?.current || !setlist) return;

    const activeSetNumber = active.data.current.setNumber;

    // Get the set number from either the data or the DOM element
    let overSetNumber: number | undefined;

    if (over.data.current) {
      overSetNumber = (over.data.current as { setNumber?: number }).setNumber;
    } else {
      // Get set number from the container's data attribute
      const container = document.querySelector(`[data-set-number="${over.id}"]`);
      if (container) {
        overSetNumber = parseInt(container.getAttribute('data-set-number') || '');
      }
    }
    // Only proceed if we have valid set numbers and they're different
    if (typeof activeSetNumber === 'number' &&
      typeof overSetNumber === 'number' &&
      activeSetNumber !== overSetNumber) {

      // Get current songs in both sets
      // const currentSetSongs = setlist.songs.filter(s => s.setNumber === activeSetNumber);
      const targetSetSongs = setlist.songs.filter(s => s.setNumber === overSetNumber);

      // Update the moved song's set number
      const updatedSongs = setlist.songs.map(song => {
        if (song.songId === active.id) {
          return {
            ...song,
            setNumber: overSetNumber,
            position: targetSetSongs.length // Put it at the end of target set
          };
        }
        return song;
      });

      updateSetlistSongs(bandId, setlistId, updatedSongs)
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
    const overElement = over.data.current as { setNumber?: number } || over.id;
    const overSetNumber = typeof overElement === 'object' ?
      overElement.setNumber :
      parseInt(over.id?.toString().split('-')[1] || '0');

    if (typeof activeSetNumber !== 'number' || typeof overSetNumber !== 'number') return;

    let updatedSongs = [...setlist.songs];
    const activeIndex = updatedSongs.findIndex(song => song.songId === active.id);
    const overIndex = updatedSongs.findIndex(song => song.songId === over.id);

    if (activeSetNumber === overSetNumber) {
      // Same set reordering
      if (activeIndex !== overIndex) {
        const setItems = updatedSongs
          .filter(song => song.setNumber === overSetNumber)
          .sort((a, b) => a.position - b.position);

        const [removed] = setItems.splice(activeIndex, 1);
        if (removed) {
          setItems.splice(overIndex, 0, removed);
        }

        // Update positions within the set
        updatedSongs = updatedSongs.map(song => {
          if (song.setNumber === overSetNumber) {
            const newIndex = setItems.findIndex(s => s.songId === song.songId);
            return { ...song, position: newIndex };
          }
          return song;
        });
      }
    } else {
      // Moving between sets
      updatedSongs = updatedSongs.map(song => {
        if (song.songId === active.id) {
          const targetSetSongs = updatedSongs.filter(s => s.setNumber === overSetNumber);
          return {
            ...song,
            setNumber: overSetNumber,
            position: targetSetSongs.length
          };
        }
        return song;
      });

      // Reorder positions in both source and target sets
      const sourceSetSongs = updatedSongs
        .filter(song => song.setNumber === activeSetNumber)
        .sort((a, b) => a.position - b.position);

      const targetSetSongs = updatedSongs
        .filter(song => song.setNumber === overSetNumber)
        .sort((a, b) => a.position - b.position);

      updatedSongs = updatedSongs.map(song => {
        if (song.setNumber === activeSetNumber) {
          const newIndex = sourceSetSongs.findIndex(s => s.songId === song.songId);
          return { ...song, position: newIndex };
        }
        if (song.setNumber === overSetNumber) {
          const newIndex = targetSetSongs.findIndex(s => s.songId === song.songId);
          return { ...song, position: newIndex };
        }
        return song;
      });
    }

    try {
      await updateSetlistSongs(bandId, setlistId, updatedSongs);
      await refreshSetlist();
    } catch (error) {
      console.error('Error updating song positions:', error);
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
  // const handleSongSelect = async (newSongs: SetlistSong[]) => {
  //   if (!setlist) return;

  //   const existingSongIds = new Set(setlist.songs.map(s => s.songId));
  //   const filteredNewSongs = newSongs.filter(song => !existingSongIds.has(song.songId));

  //   const updatedSongs = [
  //     ...setlist.songs,
  //     ...filteredNewSongs.map((song, idx) => ({
  //       ...song,
  //       position: setlist.songs.length + idx,
  //       setNumber: selectedSetNumber || 1
  //     }))
  //   ];

  //   try {
  //     await updateSetlistSongs(bandId, setlistId, updatedSongs);
  //     await refreshSetlist();
  //   } catch (error) {
  //     console.error('Error adding songs:', error);
  //   }
  // };

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
          collisionDetection={closestCenter}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always
            }
          }}
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
                          //setIsModalOpen(true);
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
                    {/* This is the droppable wrapper that allows dropping into empty sets */}
                    <div
                      data-set-number={setNumber}
                      role="list"
                      style={{ position: 'relative' }}  // Important for proper drop detection
                      className={`
      space-y-2 
      rounded-lg 
      p-2
      transition-colors 
      duration-200
      min-h-[100px]
      ${setSongs.length === 0 ? 'border-2 border-dashed border-gray-700/50 hover:border-orange-500/50' : ''}
      ${activeSetNumber === setNumber ? 'bg-gray-700/50' : ''}
      ${setSongs.length === 0 && activeId ? 'border-orange-500/50' : ''}
    `}
                      data-droppable={true}  // Important - marks this as a valid drop target
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
                          <p className="text-gray-400 mb-2">Drop songs here or</p>
                          <Button
                            variant="outline"
                            size="lg"
                            className="text-orange-500 border-orange-500 hover:bg-orange-500/10"
                            onClick={() => {
                              setSelectedSetNumber(setNumber);
                             // setIsModalOpen(true);
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

        {/* {isModalOpen && selectedSetNumber !== null && setlist && (
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
        )} */}
      </div>
    </PageLayout>
  );
}