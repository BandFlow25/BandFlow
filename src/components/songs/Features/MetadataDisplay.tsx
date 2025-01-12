// components/songs/SongCard/MetadataDisplay.tsx
import { Clock, Activity, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BandSong } from '@/lib/types/song';

interface MetadataDisplayProps {
  song: BandSong;
  className?: string;
}

export function MetadataDisplay({ song, className }: MetadataDisplayProps) {
  return (
    <div className={cn("flex flex-col justify-center gap-1 min-w-[80px] px-2", className)}>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Clock className="w-3 h-3" />
        <span>{song.metadata?.duration || '-'}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Activity className="w-3 h-3" />
        <span>{song.metadata?.bpm || '-'}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Music2 className="w-3 h-3" />
        <span>{song.metadata?.key || '-'}</span>
      </div>
    </div>
  );
}