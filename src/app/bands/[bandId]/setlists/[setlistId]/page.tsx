// app/bands/[bandId]/setlists/[setlistId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { SetlistProvider } from '@/contexts/SetlistProvider';
import Link from 'next/link';
import { useBand } from '@/contexts/BandProvider';
import DroppableSet from '@/components/songs/SetLists/DroppableSet';
import { useSetlist } from '@/contexts/SetlistProvider';
import type { BandSong } from '@/lib/types/song';
import { PageLayout } from '@/components/layout/PageLayout';
import { Clock, ListMusic, Edit2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import CreateSetlistModal from '@/components/songs/SetLists/CreateSetlistModal';
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
    console.error('Error fetching song details:', error);
    return null;
  }
}

function SetlistDetailsPageContent() {
  const { activeBand, isActiveBandLoaded } = useBand();
  const { setlist, refreshSetlist, isLoading: isSetlistLoading } = useSetlist();
  //const router = useRouter();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSetNumber, setActiveSetNumber] = useState<number | null>(null);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [songDetails, setSongDetails] = useState<Record<string, BandSong>>({});
  const [selectedSetNumber, setSelectedSetNumber] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        console.error('Error loading song details:', error);
        setError('Failed to load song details');
      } finally {
        setIsLoadingSongs(false);
      }
    };

    if (setlist && activeBand?.id) {
      loadSongDetails();
    }
  }, [setlist, activeBand?.id]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 5 : 8,
        delay: 100,
        tolerance: 5,
      },
    })
  );

  if (!isActiveBandLoaded || isSetlistLoading) {
    return (
      <PageLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading setlist...</div>
        </div>
      </PageLayout>
    );
  }

  if (!activeBand || !setlist) {
    return (
      <PageLayout title="Not Found">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Setlist not found</div>
        </div>
      </PageLayout>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveSetNumber(active.data.current?.setNumber);
  };

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || !active?.data?.current || !setlist) return;

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
        activeSetNumber !== overSetNumber &&
        activeBand?.id) {

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
      } catch (err) {
        console.error('Error updating song positions:', err);
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
    }

    try {
      await updateSetlistSongs(activeBand.id, setlist.id, updatedSongs);
      await refreshSetlist();
    } catch (error) {
      console.error('Error updating song positions:', error);
      setError('Failed to update song order');
    }
  };

  const handleSongRemove = async (songId: string) => {
    if (!setlist || !activeBand?.id) return;

    const updatedSongs = setlist.songs.filter(s => s.songId !== songId);

    try {
      await updateSetlistSongs(activeBand.id, setlist.id, updatedSongs);
      await refreshSetlist();
    } catch (error) {
      console.error('Error removing song:', error);
      setError('Failed to remove song');
    }
  };

  return (
    <PageLayout title={setlist.name}>
      <div className="p-4">
        <Link
          href={`/bands/${activeBand.id}/setlists`}
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to setlists
        </Link>

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
                  onSetNumberSelect={setSelectedSetNumber}
                />
              );
            })}
          </div>
        </DndContext>

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