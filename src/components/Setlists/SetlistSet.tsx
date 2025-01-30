//src\components\Setlists\SetlistSet.
import { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SetlistSongCard } from './SetlistSongCard';
import type { BandSong } from '@/lib/types/song';
import type { SetlistSet as SetlistSetType, DropPosition, SetlistSong } from '@/lib/types/setlist';
import { calculateSetDurationInSeconds, getSetDurationInfo } from '@/lib/services/bandflowhelpers/SetListHelpers';

interface SetlistSetProps {
  set: SetlistSetType;
  songs: Record<string, BandSong>;
  isOver?: boolean;
  dropPosition?: DropPosition | null;
  onSongUpdate?: (setId: string, updatedSongs: SetlistSong[]) => void;
}

export function SetlistSet({ set, songs, isOver, dropPosition, onSongUpdate }: SetlistSetProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { setNodeRef } = useDroppable({
    id: set.id,
    data: {
      type: 'set',
      setId: set.id,
      songs: set.songs
    }
  });

  const durationInfo = useMemo(() => {
    if (set.name === 'Extras') {
      return { duration: '0:00', color: 'text-gray-400' };
    }

    const durationSeconds = calculateSetDurationInSeconds(
      set.songs.map(s => songs[s.songId]),
      set.songs
    );

    return getSetDurationInfo(durationSeconds, set.targetDuration);
  }, [set.songs, songs, set.targetDuration, set.name]);

  const handleSetupTimeChange = (songId: string, setupTime: number | null) => {
    const updatedSongs = set.songs.map(song => {
      if (song.id === songId) {
        return {
          ...song,
          setupTime
        };
      }
      return song;
    });

    onSongUpdate?.(set.id, updatedSongs);
  };

  const hasNonPlaybookSongs = set.songs.some(song =>
    songs[song.songId]?.status !== 'PLAYBOOK'
  );

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
          {hasNonPlaybookSongs && (
            <span className="text-xs text-orange-400">
              Some songs no longer in Play Book
            </span>
          )}
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

                const songId = `${set.id}-${song.songId}-${index}`;

                return (
                  <div key={songId}>
                    {isDropTarget && (
                      <div className="h-1 bg-orange-500 rounded my-1" />
                    )}
                    <SetlistSongCard
                      id={song.id}
                      songId={song.songId}
                      song={songDetails}
                      index={index}
                      setId={set.id}
                      setupTime={song.setupTime}
                      onSetupTimeChange={(time) => handleSetupTimeChange(song.id, time)}
                      onRemove={() => {
                        const filteredSongs = set.songs.filter((_, i) => i !== index);
                        onSongUpdate?.(set.id, filteredSongs);
                      }}
                      onToggleSegue={() => {
                        const updatedSongs = [...set.songs];
                        if (updatedSongs[index]) {
                          updatedSongs[index] = {
                            ...updatedSongs[index],
                            segueIntoNext: !(updatedSongs[index].segueIntoNext || false)
                          };
                          onSongUpdate?.(set.id, updatedSongs);
                        }
                      }}
                      hasSegue={song.segueIntoNext || false}
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