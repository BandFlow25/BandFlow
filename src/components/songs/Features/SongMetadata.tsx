// components/songs/SongCard/SongMetadata.tsx
import { cn } from '@/lib/utils';
import type { BandSong } from '@/lib/types/song';
import { Clock, Activity, Music2 } from 'lucide-react';

interface SongMetadataProps {
  song: BandSong;
  className?: string;
}

export function SongMetadata({ song, className }: SongMetadataProps) {
  return (
    <div className={cn("flex items-center gap-4 text-xs text-gray-400", className)}>
      <span className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {song.metadata?.duration || '-'}
      </span>
      <span className="flex items-center gap-1">
        <Activity className="w-3 h-3" />
        {song.metadata?.bpm || '-'}
      </span>
      <span className="flex items-center gap-1">
        <Music2 className="w-3 h-3" />
        {song.metadata?.key || '-'}
      </span>
    </div>
  );
}