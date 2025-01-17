// components/songs/PlayBook/PlayBookList/PlayBookListContent.tsx
import { PlayBookSongCard } from 'src/components/songs/SongCard/PlayBookSongCard';
import type { BandSong } from '@/lib/types/song';
import { Loader2 } from 'lucide-react';

interface PlayBookListContentProps {
  songs: BandSong[];
  isLoading: boolean;
  error: Error | null;
  selectedSongs: Set<string>;
  onSongToggle: (songId: string) => void;
  isMultiSelectMode: boolean;
}

export function PlayBookListContent({
  songs,
  isLoading,
  error,
  selectedSongs,
  onSongToggle,
  isMultiSelectMode
}: PlayBookListContentProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-red-400">{error.message}</span>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-gray-400">No songs in the Play Book</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {songs.map((song) => (
        <PlayBookSongCard
          key={song.id}
          song={song}
          isSelected={selectedSongs.has(song.id)}
          onSelect={() => onSongToggle(song.id)}
          isSelectionMode={isMultiSelectMode}
        />
      ))}
    </div>
  );
}