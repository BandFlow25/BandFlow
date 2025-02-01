// src\components\Setlists\SetlistPBSongCard.tsx
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { BandSong } from "@/lib/types/song";

interface SetlistPBSongCardProps {
  song: BandSong;
}

export function SetlistPBSongCard({ song }: SetlistPBSongCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: song.id,
    data: {
      type: 'playbook-song',
      song
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transform ? 'transform 200ms ease' : undefined,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="h-8 px-2 bg-gray-800 rounded-lg cursor-grab active:cursor-grabbing touch-none select-none hover:bg-gray-700 transition-colors"
    >
      <div className="font-medium text-sm text-white truncate leading-8">
        {song.title}
      </div>
    </div>
  );
}