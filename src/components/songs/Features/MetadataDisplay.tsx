// components/songs/Features/MetadataDisplay.tsx
import { Clock, Activity, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BandSong } from '@/lib/types/song';
import { DurationtoMinSec } from '@/lib/services/bndyhelpers/SetListHelpers';

interface MetadataDisplayProps {
  song: BandSong;
  className?: string;
}

export function MetadataDisplay({ song, className }: MetadataDisplayProps) {
  return (
    <div className={cn(
      "flex flex-col justify-center min-w-[80px] px-1 gap-0.5",
      className
    )}>
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Clock className="w-3 h-3 shrink-0" />
        <span>{song.metadata?.duration 
          ? DurationtoMinSec(parseInt(song.metadata.duration, 10))
          : '-'}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Activity className="w-3 h-3 shrink-0" />
        <span>{song.metadata?.bpm ? `${song.metadata.bpm} bpm` : '-'}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Music2 className="w-3 h-3 shrink-0" />
        <span>{song.metadata?.key || '-'}</span>
      </div>
    </div>
  );
}