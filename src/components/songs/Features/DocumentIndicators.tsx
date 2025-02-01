// components/songs/Features/DocumentIndicators.tsx
import { Mic2, Guitar, Drum, Keyboard, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BandSong, SongDocument } from '@/lib/types/song';

interface DocumentIndicatorsProps {
    song: BandSong;
    className?: string;
  }
  
export function DocumentIndicators({ song, className }: DocumentIndicatorsProps) {
  // Get document status from song
  const docs = song.documents || {};
  const hasLyrics = Object.values(docs).some(userDocs => 
    userDocs.some(doc => doc.type === 'lyrics')
  );
  const hasGuitar = Object.values(docs).some(userDocs => 
    userDocs.some(doc => doc.type === 'guitar')
  );
  // ... similar for other types

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {hasLyrics && (
        <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-lg">
          <Mic2 className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-gray-300">Lyrics</span>
        </div>
      )}
      {/* Add other indicators similarly */}
    </div>
  );
}