// src/app/bands/[bandId]/setlists/[setlistId]/addsongs/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
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
  closestCenter
} from '@dnd-kit/core';
import { ArrowLeft, Music, Loader2 } from 'lucide-react';
import { useBand } from '@/contexts/BandProvider';
import { useSetlist } from '@/contexts/SetlistProvider';
import { SetlistSet } from '@/components/Setlists/SetlistSet';
import { SearchHeader } from '@/components/songs/Shared/SearchHeader';
import { Checkbox } from '@/components/ui/checkbox';
import { getBandSongs } from '@/lib/services/firebase/songs';
import { updateSetlistSets } from '@/lib/services/firebase/setlists';
import { toast } from 'react-hot-toast';
import { SONG_STATUS } from '@/lib/types/song';
import type { BandSong } from '@/lib/types/song';
import type { DropPosition } from '@/lib/types/setlist';
import { SetlistPBSongCard } from '@/components/Setlists/SetlistPBSongCard';

interface DragItem {
  type: 'playbook-song' | 'setlist-song';
  song: BandSong;
  index?: number;
}

export default function AddSongsPage() {
  const { activeBand } = useBand();
  const { setlist, isLoading: setlistLoading, updateSetlist } = useSetlist();
  const [playbookSongs, setPlaybookSongs] = useState<BandSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeExisting, setIncludeExisting] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);
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
    if (active.data.current) {
      setActiveItem(active.data.current as DragItem);
    }
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
    
    setActiveId(null);
    setActiveItem(null);
    setActiveSetId(null);
    setDropPosition(null);

    if (!over || !setlist || !activeBand?.id) return;

    try {
      let newSets = [...setlist.sets];

      if (active.data.current?.type === 'playbook-song') {
        const droppedSong = active.data.current.song as BandSong;
        const targetSetId = over.data.current?.setId || over.id;
        const targetSet = newSets.find(set => set.id === targetSetId);
        
        if (!targetSet) return;

        const targetIndex = over.data.current?.type === 'setlist-song'
          ? over.data.current.index
          : targetSet.songs.length;

        targetSet.songs.splice(targetIndex, 0, {
          songId: droppedSong.id,
          setNumber: parseInt(targetSet.id.split('-')[1] || '1', 10),
          position: targetIndex,
          isPlayBookActive: true,
          transitionNote: ''
        });

        // Update positions for all songs in the set
        targetSet.songs = targetSet.songs.map((s, i) => ({
          ...s,
          position: i
        }));

        await updateSetlistSets(activeBand.id, setlist.id, newSets);
        updateSetlist({
          ...setlist,
          sets: newSets,
          songDetails: {
            ...setlist.songDetails,
            [droppedSong.id]: droppedSong
          }
        });

        toast.success('Song added to set');
      }
    } catch (error) {
      console.error('Error adding song to set:', error);
      toast.error('Failed to add song');
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
    <div className="min-h-screen bg-gray-900 flex flex-col">
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
        <div className="flex-1 flex lg:flex-row overflow-hidden">
          {/* Sets Column */}
          <div className="w-1/2 border-r border-gray-800 flex flex-col">
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
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

          {/* PlayBook Column */}
          <div className="w-1/2 flex flex-col h-full">
            {/* Fixed Search */}
            <div className="flex-none p-4 bg-gray-900 border-b border-gray-800">
              <SearchHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                placeholder="Search Play Book songs..."
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

            {/* Scrollable Songs List */}
            <div className="flex-1 overflow-y-auto">
              {filteredAndGroupedSongs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Music className="w-8 h-8 mb-2" />
                  <p>No songs found</p>
                </div>
              ) : (
                <div className="p-4 space-y-6">
                  {filteredAndGroupedSongs.map(group => (
                    <div key={group.letter}>
                      <div className="text-sm font-semibold text-gray-400 mb-2">
                        {group.letter}
                      </div>
                      <div className="space-y-2">
                        {group.songs.map(song => (
                          <SetlistPBSongCard key={song.id} song={song} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && activeItem && (
            activeItem.type === 'playbook-song' ? (
              <SetlistPBSongCard song={activeItem.song} />
            ) : null
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}