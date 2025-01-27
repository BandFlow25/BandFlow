//src\components\Setlists\SetlistSongCard.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { BandSong } from '@/lib/types/song';
import { DurationtoMinSec } from '@/lib/services/bandflowhelpers/SetListHelpers';

interface SetlistSongCardProps {
  id: string;
  song: BandSong;
  index: number;
  setId: string;  // Add this to the interface
}

// components/Setlists/SetlistSongCard.tsx
export function SetlistSongCard({ id, song, index, setId }: SetlistSongCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id,
    data: {
      type: 'setlist-song',
      song,
      index,
      setId
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center h-8 px-2 rounded-lg",
        "touch-none select-none cursor-grab active:cursor-grabbing",
        isDragging ? "bg-orange-500/20" : "bg-gray-700/50 hover:bg-gray-700"
      )}
    >
      <span className="w-6 text-xs text-gray-400">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-sm truncate">{song.title}</div>
      </div>
      {song.metadata?.duration && (
        <div className="text-xs text-gray-400 ml-2">
          {DurationtoMinSec(parseInt(song.metadata.duration))}
        </div>
      )}
    </div>
  );
}