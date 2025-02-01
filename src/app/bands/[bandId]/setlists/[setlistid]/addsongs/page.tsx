//src\app\bands\[bandId]\setlists\[setlistid]\addsongs\page.tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
  closestCenter,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { ArrowLeft, Music, Loader2 } from 'lucide-react';
import { useBand } from '@/contexts/BandProvider';
import { useSetlist } from '@/contexts/SetlistProvider';
import { SetlistSet } from '@/components/setlists/SetlistSet';
import { SetlistPBSongCard } from '@/components/setlists/SetlistPBSongCard';
import { SearchHeader } from '@/components/songs/Shared/SearchHeader';
import { Checkbox } from "@/components/ui/checkbox";
import { getBandSongs } from '@/lib/services/firebase/songs';
import { updateSetlistSets } from '@/lib/services/firebase/setlists';
import { toast } from 'react-hot-toast';
import { SONG_STATUS } from '@/lib/types/song';
import type { BandSong } from '@/lib/types/song';
import type { DropPosition } from '@/lib/types/setlist';
import { nanoid } from 'nanoid';
import { useEffect } from 'react';

export default function AddSongsPage() {
  const { activeBand } = useBand();
  const { setlist, isLoading: setlistLoading, updateSetlist } = useSetlist();
  const [playbookSongs, setPlaybookSongs] = useState<BandSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeExisting, setIncludeExisting] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeItem, setActiveItem] = useState<BandSong | null>(null);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  useEffect(() => {
    if (!activeBand?.id) return;

    const loadSongs = async () => {
      try {
        const songsData = await getBandSongs(activeBand.id);
        const filteredSongs = songsData.filter(song => song.status === SONG_STATUS.PLAYBOOK);
        setPlaybookSongs(filteredSongs);
      } catch (error) {
        console.error('Error loading songs:', error);
        toast.error('Failed to load songs');
      } finally {
        setIsLoading(false);
      }
    };

    loadSongs();
  }, [activeBand?.id]);

  const filteredAndGroupedSongs = useMemo(() => {
    const filtered = playbookSongs.filter(song => {
      const matchesSearch = !searchQuery ||
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase());

      const isInSetlist = setlist?.sets.some(set =>
        set.songs.some(s => s.songId === song.id)
      );

      return matchesSearch && (includeExisting || !isInSetlist);
    });

    const grouped = filtered.reduce<Record<string, BandSong[]>>((acc, song) => {
      const firstLetter = song.title?.trim().charAt(0)?.toUpperCase() || '#';
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(song);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, songs]) => ({
        letter,
        songs: [...songs].sort((a, b) =>
          (a.title || '').localeCompare(b.title || '')
        )
      }));
  }, [playbookSongs, searchQuery, includeExisting, setlist]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveItem(active.data.current?.song as BandSong);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setDropPosition(null);
      return;
    }

    const overType = over.data.current?.type;
    const overSetId = overType === 'set'
      ? over.id.toString()
      : over.data.current?.setId;

    setActiveSetId(overSetId);

    if (overType === 'setlist-song') {
      const overIndex = over.data.current?.index;
      setDropPosition({
        setId: overSetId,
        index: overIndex
      });
    } else if (overType === 'set') {
      setDropPosition({
        setId: overSetId,
        index: setlist?.sets.find(s => s.id === overSetId)?.songs.length || 0
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !setlist || !activeBand?.id || !active.data.current?.song) {
      setActiveId(null);
      setActiveSetId(null);
      setDropPosition(null);
      setActiveItem(null);
      return;
    }

    try {
      let newSets = [...setlist.sets];
      const targetSetId = over.data.current?.setId || over.id;
      const targetSet = newSets.find(s => s.id === targetSetId);
      
      if (!targetSet) {
        setActiveId(null);
        setActiveSetId(null);
        setDropPosition(null);
        setActiveItem(null);
        return;
      }

      const targetIndex = over.data.current?.type === 'setlist-song'
        ? over.data.current.index
        : targetSet.songs.length;

      const song = active.data.current.song as BandSong;
      
      const newSong = {
        id: nanoid(),
        songId: song.id,
        setNumber: parseInt(targetSet.id.split('-')[1] || '1', 10),
        position: targetIndex,
        isPlayBookActive: true,
        setupTime: null
      };

      targetSet.songs.splice(targetIndex, 0, newSong);

      // Update all positions
      targetSet.songs = targetSet.songs.map((s, i) => ({
        ...s,
        position: i
      }));

      // Update setlist first
      await updateSetlistSets(activeBand.id, setlist.id, newSets);
      updateSetlist({
        ...setlist,
        sets: newSets,
        songDetails: {
          ...setlist.songDetails,
          [song.id]: song
        }
      });

      // Reset states after a small delay to allow animation to complete
      requestAnimationFrame(() => {
        setActiveId(null);
        setActiveSetId(null);
        setDropPosition(null);
        setActiveItem(null);
      });

    } catch (error) {
      console.error('Error updating setlist:', error);
      toast.error('Failed to update setlist');
      // Reset states immediately on error
      setActiveId(null);
      setActiveSetId(null);
      setDropPosition(null);
      setActiveItem(null);
    }
  };

  if (isLoading || setlistLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <div className="text-gray-400">Loading data...</div>
        </div>
      </div>
    );
  }

  if (!setlist) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500">Setlist not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Fixed Header */}
      <div className="flex-none border-b border-gray-800">
        <div className="px-4 py-4">
          <Link
            href={`/bands/${activeBand?.id}/setlists/${setlist.id}`}
            className="inline-flex items-center text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Setlist
          </Link>
          <h1 className="text-2xl font-bold text-white">{setlist.name}</h1>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 overflow-hidden">
          {/* Sets Column - Fixed width */}
          <div className="w-1/2 border-r border-gray-800 flex flex-col">
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
              <div className="p-2 space-y-2">
                {setlist.sets.map(set => (
                  <SetlistSet
                    key={set.id}
                    set={set}
                    songs={setlist.songDetails || {}}
                    isOver={activeSetId === set.id}
                    dropPosition={dropPosition}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* PlayBook Column */}
          <div className="w-1/2 flex flex-col">
            {/* Fixed search header */}
            <div className="flex-none">
              <SearchHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                placeholder="Search Play Book songs..."
                className="border-b border-gray-800"
              >
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <Checkbox
                    checked={includeExisting}
                    onCheckedChange={(checked) => setIncludeExisting(checked as boolean)}
                  />
                  Show songs already in setlist
                </label>
              </SearchHeader>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
              {filteredAndGroupedSongs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Music className="w-8 h-8 mb-2" />
                  <p>No songs found</p>
                </div>
              ) : (
                <div className="p-4 space-y-6">
                  {filteredAndGroupedSongs.map(group => (
                    <div key={group.letter}>
                      <div className="sticky top-0 text-sm font-semibold text-gray-400 mb-2 bg-gray-900/95 py-1">
                        {group.letter}
                      </div>
                      <div className="space-y-2">
                        {group.songs.map(song => (
                          <SetlistPBSongCard
                            key={song.id}
                            song={song}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DragOverlay 
            dropAnimation={{
              duration: 200,
              easing: 'ease',
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5'
                  }
                }
              })
            }}
          >
            {activeId && activeItem && (
              <div style={{ width: 'calc(50% - 0.5rem)' }}>
                <SetlistPBSongCard 
                  song={activeItem}
                />
              </div>
            )}
          </DragOverlay>
        </div>
      </DndContext>
    </div>
  );
}