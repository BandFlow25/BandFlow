// components/songs/SongList/SongListContent.tsx
import { BaseSongCard } from '../SongCard/BaseSongCard';
import type { BandSong, SongListType } from '@/lib/types/song';
import { Loader2 } from 'lucide-react';

interface SongListContentProps {
  songs: BandSong[];
  isLoading: boolean;
  error: Error | null;
  listType: SongListType;
  onSongDeleted?: () => void;
}

export function SongListContent({
  songs,
  isLoading,
  error,
  listType,
  onSongDeleted,
}: SongListContentProps) {
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
        <span className="text-gray-400">No songs found</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {songs.map((song) => (
        <BaseSongCard
          key={song.id}
          song={song}
          type={listType}
          onSongDeleted={onSongDeleted}
        />
      ))}
    </div>
  );
}