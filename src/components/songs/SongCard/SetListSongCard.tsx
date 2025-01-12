// components/songs/SetLists/SetlistSongCard/index.tsx
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BandSong } from '@/lib/types/song';
import { formatDuration, parseDuration } from '@/lib/utils/duration';

interface SetlistSongCardProps {
  songDetails: BandSong | undefined;
  position: number;
  isLoading?: boolean;
  setNumber: number;
  id: string;
}

export function SetlistSongCard({
  songDetails,
  position,
  isLoading,
  setNumber,
  id
}: SetlistSongCardProps) {
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
      setNumber
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none' as const
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="bg-gray-800/50 p-3 rounded flex items-center justify-between group cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100" />
        <span className="text-gray-500 w-6">{position}</span>
        <span className="text-white">
          {isLoading ? (
            <span className="animate-pulse">Loading...</span>
          ) : (
            songDetails?.title || 'Unknown Song'
          )}
        </span>
      </div>
      <span className="text-gray-500">
        {songDetails?.metadata?.duration
          ? formatDuration(parseDuration(songDetails.metadata.duration))
          : '--:--'}
      </span>
    </div>
  );
}