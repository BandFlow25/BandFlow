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
        <span className="text-gray-400">
          {getEmptyMessage(listType)}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1 px-4">
      {songs.map((song) => (
        <BaseSongCard
          key={song.id}
          song={song}
          type={listType}
          {...(onSongDeleted ? { onSongDeleted } : {})}  // Only pass if defined
        />
      ))}
    </div>
  );
}

function getEmptyMessage(type: SongListType): string {
  switch (type) {
    case 'suggestions':
      return 'No song suggestions yet';
    case 'voting':
      return 'No songs currently in voting';
    case 'review':
      return 'No songs to review';
    case 'practice':
      return 'No songs in practice';
    case 'playbook':
      return 'No songs in the Play Book';
    case 'parked':
      return 'No parked songs';
    case 'discarded':
      return 'No discarded songs';
    default:
      return 'No songs found';
  }
}