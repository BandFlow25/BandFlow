//src\app\bands\[bandId]\setlists\[setlistid]\page.tsx
'use client';

import { useState } from 'react';
import { Clock, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useBand } from '@/contexts/BandProvider';
import { useSetlist } from '@/contexts/SetlistProvider';
import { SetlistSet } from '@/components/setlists/SetlistSet';
import { SetlistSongCard } from '@/components/setlists/SetlistSongCard'
import { toast } from 'react-hot-toast';
import type { BandSong } from '@/lib/types/song';
import { updateSetlistSets } from '@/lib/services/firebase/setlists';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    DragOverlay,
    closestCenter
} from '@dnd-kit/core';
import type { DropPosition } from '@/lib/types/setlist';

function SetlistContent() {
    const { activeBand } = useBand();
    const { setlist, isLoading, updateSetlist } = useSetlist();
    const [activeSetId, setActiveSetId] = useState<string | null>(null);
    const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeSong, setActiveSong] = useState<BandSong | null>(null);

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

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id.toString());
        if (active.data.current?.song) {
            setActiveSong(active.data.current.song);
        }
        const sourceSetId = active.data.current?.setId;
        if (sourceSetId) {
            setActiveSetId(sourceSetId);
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
        setActiveSetId(null);
        setDropPosition(null);
        setActiveSong(null);
        
        if (!over || !setlist || !activeBand?.id) return;

        try {
            let newSets = [...setlist.sets];
            const sourceSetId = active.data.current?.setId;
            const targetSetId = over.data.current?.setId || over.id;
            const sourceSet = newSets.find(s => s.id === sourceSetId);
            const targetSet = newSets.find(s => s.id === targetSetId);
            
            if (!sourceSet || !targetSet) return;

            const songId = active.data.current?.songId;
            const sourceIndex = sourceSet.songs.findIndex(s => s.id === active.id);
            const movedSong = sourceSet.songs[sourceIndex];
            
            if (!movedSong) return;
            
            sourceSet.songs.splice(sourceIndex, 1);
            
            const targetIndex = over.data.current?.type === 'setlist-song'
                ? over.data.current.index
                : targetSet.songs.length;
                
            targetSet.songs.splice(targetIndex, 0, {
                ...movedSong,
                setNumber: parseInt(targetSet.id.split('-')[1] || '1', 10),
                position: targetIndex,
                segueIntoNext: false  // Reset segue on move
            });

            [sourceSet, targetSet].forEach(set => {
                set.songs = set.songs.map((s, i) => ({
                    ...s,
                    position: i
                }));
            });

            await updateSetlistSets(activeBand.id, setlist.id, newSets);
            updateSetlist({
                ...setlist,
                sets: newSets
            });
        } catch (error) {
            console.error('Error updating setlist:', error);
            toast.error('Failed to update setlist');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white">Loading setlist...</div>
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
        <div className="min-h-screen bg-gray-900">
            <div className="border-b border-gray-800">
                <div className="px-4 py-4 max-w-7xl mx-auto">
                    <Link
                        href={`/bands/${activeBand?.id}/setlists`}
                        className="inline-flex items-center text-gray-400 hover:text-white mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Setlists
                    </Link>

                    <div className="flex items-baseline justify-between">
                        <h1 className="text-2xl font-bold text-white">{setlist.name}</h1>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>{setlist.format.setDuration} mins/set</span>
                            </div>
                            <Link
                                href={`/bands/${activeBand?.id}/setlists/${setlist.id}/addsongs`}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Songs
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="space-y-6">
                        {setlist.sets.map((set) => (
                            <SetlistSet
                                key={set.id}
                                set={set}
                                songs={setlist.songDetails || {}}
                                isOver={activeSetId === set.id}
                                dropPosition={dropPosition}
                                onSongUpdate={async (setId, updatedSongs) => {
                                    if (!activeBand?.id || !setlist) return;
                                    try {
                                        const newSets = setlist.sets.map(s =>
                                            s.id === setId ? { ...s, songs: updatedSongs } : s
                                        );
                                        await updateSetlistSets(activeBand.id, setlist.id, newSets);
                                        updateSetlist({
                                            ...setlist,
                                            sets: newSets
                                        });
                                    } catch (error) {
                                        console.error('Error updating setlist:', error);
                                        toast.error('Failed to update setlist');
                                    }
                                }}
                            />
                        ))}
                    </div>

                    <DragOverlay>
                        {activeId && activeSong && (
                            <SetlistSongCard
                                id={activeId}
                                songId={activeId}
                                song={activeSong}
                                index={-1}
                                setId=""
                            />
                        )}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
}

export default function SetlistViewPage() {
    return <SetlistContent />;
}