//src\app\bands\[bandId]\setlists\[setlistId]\page.tsx
'use client';

import { useEffect, useState } from 'react';
import { SetlistProvider, useSetlist } from '@/contexts/SetlistProvider';
import Link from 'next/link';
import { useBand } from '@/contexts/BandProvider';
import DroppableSet from '@/components/songs/SetLists/DroppableSet';
import { AddSetlistSongsModal } from '@/components/songs/Modals/AddSetListSongsModal';
import type { BandSong } from '@/lib/types/song';
import { PageLayout } from '@/components/layout/PageLayout';
import { Clock, ListMusic, Edit2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import CreateSetlistModal from '@/components/songs/Modals/CreateSetlistModal';
import { updateSetlistSongs } from '@/lib/services/firebase/setlists';
import {
  calculateSetDurationInSeconds,
  getSetDurationInfo
} from '@/lib/services/bandflowhelpers/SetListHelpers';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  MeasuringStrategy
} from '@dnd-kit/core';
import { COLLECTIONS } from '@/lib/constants';

async function fetchSongDetails(bandId: string, songId: string): Promise<BandSong | null> {
  try {
    const songRef = doc(db, COLLECTIONS.BANDS, bandId, COLLECTIONS.BAND_SONGS, songId);
    const songDoc = await getDoc(songRef);
    
    if (!songDoc.exists()) return null;
    return { id: songDoc.id, ...songDoc.data() } as BandSong;
  } catch (error) {
    return null;
  }
}

function SetlistDetailsPageContent() {
  const { activeBand, isReady } = useBand();
  const { setlist, refreshSetlist, isLoading: isSetlistLoading } = useSetlist();
  
  // State
  const [songDetails, setSongDetails] = useState<Record<string, BandSong>>({});
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [targetSetNumber, setTargetSetNumber] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSetNumber, setActiveSetNumber] = useState<number | null>(null);

  // DnD sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 5 : 8,
        delay: 100,
        tolerance: 5,
      },
    })
  );

  // Handler functions
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveSetNumber(active.data.current?.setNumber);
  };

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || !active?.data?.current || !setlist || !activeBand?.id) return;

    const activeSetNumber = active.data.current.setNumber;
    let overSetNumber: number | undefined;

    if (over.data.current) {
      overSetNumber = (over.data.current as { setNumber?: number }).setNumber;
    } else {
      const container = document.querySelector(`[data-set-number="${over.id}"]`);
      if (container) {
        overSetNumber = parseInt(container.getAttribute('data-set-number') || '');
      }
    }

    if (typeof activeSetNumber === 'number' && 
        typeof overSetNumber === 'number' && 
        activeSetNumber !== overSetNumber) {

      const targetSetSongs = setlist.songs.filter(s => s.setNumber === overSetNumber);
      const updatedSongs = setlist.songs.map(song => {
        if (song.songId === active.id) {
          return {
            ...song,
            setNumber: overSetNumber,
            position: targetSetSongs.length
          };
        }
        return song;
      });

      try {
        await updateSetlistSongs(activeBand.id, setlist.id, updatedSongs);
        await refreshSetlist();
      } catch (error) {
        setError('Failed to update song positions');
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveSetNumber(null);

    if (!over || !active?.data?.current || !setlist || !activeBand?.id) return;

    const activeSetNumber = active.data.current.setNumber;
    const overElement = over.data.current as { setNumber?: number } || over.id;
    const overSetNumber = typeof overElement === 'object' ?
      overElement.setNumber :
      parseInt(over.id?.toString().split('-')[1] || '0');

    if (typeof activeSetNumber !== 'number' || typeof overSetNumber !== 'number') return;

    let updatedSongs = [...setlist.songs];
    const activeIndex = updatedSongs.findIndex(song => song.songId === active.id);
    const overIndex = updatedSongs.findIndex(song => song.songId === over.id);

    if (activeSetNumber === overSetNumber && activeIndex !== overIndex) {
      const setItems = updatedSongs
        .filter(song => song.setNumber === overSetNumber)
        .sort((a, b) => a.position - b.position);

      const [removed] = setItems.splice(activeIndex, 1);
      if (removed) {
        setItems.splice(overIndex, 0, removed);
      }

      updatedSongs = updatedSongs.map(song => {
        if (song.setNumber === overSetNumber) {
          const newIndex = setItems.findIndex(s => s.songId === song.songId);
          return { ...song, position: newIndex };
        }
        return song;
      });

      try {
        await updateSetlistSongs(activeBand.id, setlist.id, updatedSongs);
        await refreshSetlist();
      } catch (error) {
        setError('Failed to update song order');
      }
    }
  };

  // Load song details
  useEffect(() => {
    const loadSongDetails = async () => {
      if (!setlist || !activeBand?.id) return;

      setIsLoadingSongs(true);
      try {
        const details: Record<string, BandSong> = {};
        await Promise.all(
          setlist.songs.map(async (song) => {
            const songDetail = await fetchSongDetails(activeBand.id, song.songId);
            if (songDetail) {
              details[song.songId] = songDetail;
            }
          })
        );
        setSongDetails(details);
      } catch (error) {
        setError('Failed to load song details');
      } finally {
        setIsLoadingSongs(false);
      }
    };

    if (setlist && activeBand?.id) {
      loadSongDetails();
    }
  }, [setlist, activeBand?.id]);

  // Loading state
  if (!isReady || isSetlistLoading || isLoadingSongs) {
    return (
      <PageLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading setlist...</div>
        </div>
      </PageLayout>
    );
  }

  // Not found state
  if (!activeBand || !setlist) {
    return (
      <PageLayout title="Not Found">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Setlist not found</div>
        </div>
      </PageLayout>
    );
  }


  const handleSongRemove = async (songId: string) => {
    if (!setlist || !activeBand?.id) return;
    const updatedSongs = setlist.songs.filter(s => s.songId !== songId);
    try {
      await updateSetlistSongs(activeBand.id, setlist.id, updatedSongs);
      await refreshSetlist();
    } catch (error) {
      setError('Failed to remove song');
    }
  };

  const handleSetSelect = (setNumber: number) => {
    setTargetSetNumber(setNumber);
    setShowAddSongsModal(true);
  };

  const handleAddSongs = async (songIds: string[]) => {
    if (!setlist || !activeBand?.id || !targetSetNumber) return;

    const targetSetSongs = setlist.songs.filter(s => s.setNumber === targetSetNumber);
    const startPosition = targetSetSongs.length;

    const newSongs = songIds.map((songId, index) => ({
      songId,
      setNumber: targetSetNumber,
      position: startPosition + index,
      isPlayBookActive: true,
    }));

    const updatedSongs = [...setlist.songs, ...newSongs];

    try {
      await updateSetlistSongs(activeBand.id, setlist.id, updatedSongs);
      await refreshSetlist();
    } catch (error) {
      setError('Failed to add songs');
    }
  };

  return (
    <PageLayout title={setlist.name}>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header Area */}
        <div className="flex-none px-4 py-4 space-y-4 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
          <Link
            href={`/bands/${activeBand.id}/setlists`}
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to setlists
          </Link>

          {/* Setlist Info Card */}
          <div className="bg-gray-800 rounded-lg p-4">
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
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4">
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
              {Array.from({ length: setlist.format.numSets }).map((_, setIndex) => {
                const setNumber = setIndex + 1;
                const setSongs = setlist.songs
                  .filter((song) => song.setNumber === setNumber)
                  .sort((a, b) => a.position - b.position);

                const setDurationSeconds = calculateSetDurationInSeconds(
                  setSongs.map(song => songDetails[song.songId]).filter(Boolean)
                );
                const durationInfo = getSetDurationInfo(
                  setDurationSeconds,
                  setlist.format.setDuration
                );

                return (
                  <DroppableSet
                    key={setNumber}
                    setNumber={setNumber}
                    setSongs={setSongs}
                    activeSetNumber={activeSetNumber}
                    activeId={activeId}
                    songDetails={songDetails}
                    isLoadingSongs={isLoadingSongs}
                    durationInfo={durationInfo}
                    onSongRemove={handleSongRemove}
                    onSetNumberSelect={handleSetSelect}
                  />
                );
              })}
            </div>
          </DndContext>
        </div>

        {/* Modals */}
        {showEditModal && setlist && (
          <CreateSetlistModal
            onClose={() => setShowEditModal(false)}
            existingSetlist={{
              id: setlist.id,
              name: setlist.name,
              format: setlist.format
            }}
            onUpdate={refreshSetlist}
          />
        )}

        {showAddSongsModal && targetSetNumber !== null && (
          <AddSetlistSongsModal
            isOpen={showAddSongsModal}
            onClose={() => {
              setShowAddSongsModal(false);
              setTargetSetNumber(null);
            }}
            onAddSongs={handleAddSongs}
            currentSetNumber={targetSetNumber}
            setlist={setlist}
          />
        )}
      </div>
    </PageLayout>
  );
}

export default function SetlistDetailsPage() {
  return (
    <SetlistProvider>
      <SetlistDetailsPageContent />
    </SetlistProvider>
  );
}