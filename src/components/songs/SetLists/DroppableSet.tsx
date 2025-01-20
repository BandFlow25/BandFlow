// src\components\songs\SetLists\DroppableSet.tsx
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { SetlistSongCard } from '@/components/songs/SongCard/SetListSongCard';
import type { BandSong } from '@/lib/types/song';
import { cn } from '@/lib/utils';
import type { SetlistSong } from '@/lib/types/setlist';
import { ArrowDown, ArrowUp, CheckCircle2 } from 'lucide-react';


interface DroppableSetProps {
  setNumber: number;
  setSongs: SetlistSong[];
  activeSetNumber: number | null;
  activeId: string | null;
  songDetails: Record<string, BandSong>;
  isLoadingSongs: boolean;
  durationInfo: {
    color: string;
    duration: string;
    isUndertime: boolean;
    variancePercent: number;
  };
  onSongRemove: (songId: string) => void;
  onSetNumberSelect: (setNumber: number) => void;
}

function DroppableSet({
  setNumber,
  setSongs,
  activeSetNumber,
  activeId,
  songDetails,
  isLoadingSongs,
  durationInfo,
  onSongRemove,
  onSetNumberSelect
}: DroppableSetProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: `set-${setNumber}`,
    data: { setNumber },
  });

  // Create an array of IDs even when empty to maintain sortable context
  const sortableIds = setSongs.map(song => song.songId);

  // Calculate visual indicators for duration
  const getDurationIndicator = () => {
    if (durationInfo.variancePercent <= 8) {
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    }
    return durationInfo.isUndertime ? 
      <ArrowDown className="w-4 h-4" /> : 
      <ArrowUp className="w-4 h-4" />;
  };

  return (
    <div className={cn(
      "p-4 rounded-lg bg-gray-800 transition-all duration-200 shadow-md",
      activeSetNumber === setNumber && "ring-2 ring-orange-500/20",
      isOver && setSongs.length === 0 && "bg-orange-500/10" // Add highlight for empty set
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-white">Set {setNumber}</h3>
          <div className={cn(
            "flex items-center gap-1 text-sm",
            durationInfo.color
          )}>
            <span>({setSongs.length} songs - {durationInfo.duration})</span>
            {getDurationIndicator()}
          </div>
        </div>
        <Button
          variant="outline"
          className={cn(
            "text-orange-500 border-orange-500 hover:bg-orange-500/10",
            setSongs.length === 0 && "hidden"
          )}
          onClick={() => onSetNumberSelect(setNumber)}
        >
          Add More Songs
        </Button>
      </div>

      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          data-set-number={setNumber}
          role="list"
          className={cn(
            "relative space-y-2 rounded-lg p-2 transition-all duration-200",
            "min-h-[100px]",
            setSongs.length === 0 && [
              "border-2 border-dashed",
              isOver 
                ? "border-orange-500" 
                : activeId 
                  ? "border-orange-500/50" 
                  : "border-gray-700/50 hover:border-orange-500/30"
            ],
            activeSetNumber === setNumber && "bg-gray-700/50",
          )}
        >
          {/* Invisible overlay to improve drop detection */}
          <div className="absolute inset-0 pointer-events-none" />
          
          {setSongs.map((song, index) => (
            <SetlistSongCard
              key={`${song.songId}-${setNumber}`}
              id={song.songId}
              songDetails={songDetails[song.songId] || {} as BandSong}
              position={index + 1}
              setNumber={setNumber}
              isLoading={isLoadingSongs}
              onRemove={() => onSongRemove(song.songId)}
            />
          ))}
          
          {setSongs.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-gray-400 mb-2">Drop songs here or</p>
              <Button
                variant="outline"
                size="lg"
                className="text-orange-500 border-orange-500 hover:bg-orange-500/10"
                onClick={() => onSetNumberSelect(setNumber)}
              >
                Add Songs to Set {setNumber}
              </Button>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default DroppableSet;