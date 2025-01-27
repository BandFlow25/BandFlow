// components/Setlists/SetlistSet.tsx
import { useMemo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { SetlistSongCard } from './SetlistSongCard';
import type { BandSong } from '@/lib/types/song';
import type { SetlistSet as SetlistSetType, DropPosition } from '@/lib/types/setlist';
import { DurationtoMinSec, calculateSetDurationInSeconds, getSetDurationInfo } from '@/lib/services/bandflowhelpers/SetListHelpers';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface SetlistSetProps {
  set: SetlistSetType;
  songs: Record<string, BandSong>;
  isOver?: boolean;
  dropPosition?: DropPosition | null;
}

export function SetlistSet({ set, songs, isOver, dropPosition }: SetlistSetProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { setNodeRef } = useDroppable({
    id: set.id,
    data: {
      type: 'set',
      setId: set.id,
      songs: set.songs
    }
  });

  // Calculate duration info for non-Extras sets
  const durationInfo = useMemo(() => {
    if (set.name === 'Extras') {
      return { duration: '0:00', color: 'text-gray-400' };
    }

    const durationSeconds = calculateSetDurationInSeconds(
      set.songs.map(s => songs[s.songId])
    );

    return getSetDurationInfo(durationSeconds, set.targetDuration);
  }, [set.songs, songs, set.targetDuration, set.name]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-gray-800 rounded-lg overflow-hidden transition-colors duration-200",
        isOver && "ring-2 ring-orange-500 bg-orange-500/5",
        "relative"
      )}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-700 hover:bg-gray-600 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
          <h2 className="font-medium text-white">{set.name}</h2>
        </div>
        {set.name !== 'Extras' && (
          <div className={cn("text-sm", durationInfo.color)}>
            {durationInfo.duration} / {set.targetDuration}m
          </div>
        )}
      </button>

      {!isCollapsed && (
        <div className="p-2">
          <SortableContext
            items={set.songs.map(s => s.songId)}
            strategy={verticalListSortingStrategy}
          >
            <div className={cn(
              "space-y-1 min-h-[40px]",
              "relative"
            )}>
              {set.songs.map((song, index) => {
                const songDetails = songs[song.songId];
                if (!songDetails) return null;

                const isDropTarget = dropPosition?.setId === set.id && 
                                   dropPosition?.index === index;

                return (
                  <div key={`${set.id}-${song.songId}-${index}`}>
                    {isDropTarget && (
                      <div className="h-1 bg-orange-500 rounded my-1" />
                    )}
                    <SetlistSongCard
                      id={song.songId}
                      song={songDetails}
                      index={index}
                      setId={set.id}
                    />
                  </div>
                );
              })}

              {set.songs.length === 0 && (
                <div className={cn(
                  "border-2 border-dashed rounded-lg transition-colors h-24",
                  "flex items-center justify-center",
                  isOver ? "border-orange-500 bg-orange-500/10" : "border-gray-700"
                )}>
                  <p className="text-sm text-gray-400">Drop song here</p>
                </div>
              )}
            </div>
          </SortableContext>
        </div>
      )}
    </div>
  );
}