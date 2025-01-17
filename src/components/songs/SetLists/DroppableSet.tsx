// src\components\songs\SetLists\DroppableSet.tsx
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { SetlistSongCard } from '@/components/songs/SongCard/SetListSongCard';
import type { BandSong } from '@/lib/types/song';
import type { SetlistSong } from '@/lib/types/setlist';

interface DroppableSetProps {
  setNumber: number;
  setSongs: SetlistSong[];
  activeSetNumber: number | null;
  activeId: string | null;
  songDetails: Record<string, BandSong>;
  isLoadingSongs: boolean;
  durationInfo: { color: string; duration: string };
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
  const { setNodeRef, isOver } = useDroppable({
    id: `set-${setNumber}`,
    data: { setNumber }
  });

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
            onClick={() => onSetNumberSelect(setNumber)}
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
          ref={setNodeRef}
          data-set-number={setNumber}
          role="list"
          style={{ position: 'relative' }}
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
            ${isOver ? 'bg-gray-700/30' : ''}
          `}
          data-droppable={true}
        >
          {setSongs.map((song, index) => (
            <SetlistSongCard
              key={`${song.songId}-${setNumber}`}
              id={song.songId}
              songDetails={songDetails[song.songId]}
              position={index + 1}
              setNumber={setNumber}
              isLoading={isLoadingSongs}
              onRemove={() => onSongRemove(song.songId)}
            />
          ))}
          {setSongs.length === 0 && (
            <div className="text-center py-6">
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