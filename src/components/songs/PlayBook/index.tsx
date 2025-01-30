// components/songs/PlayBook/index.tsx
import { useMemo, useState } from 'react';
import { useSongs } from '@/contexts/SongProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlayBookSongCard } from '@/components/songs/SongCard/PlayBookSongCard';
import type { BandSong } from '@/lib/types/song';
import { Loader2, Music } from 'lucide-react';
import { useBand } from '@/contexts/BandProvider';

export function PlayBookList() {
  const { songs, isLoading, error } = useSongs();
  const { activeBand } = useBand();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<BandSong[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const playBookSongs = useMemo(() => {
    let filtered = songs.filter(song => song.status === 'PLAYBOOK');

    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(song =>
        song.title.toLowerCase().includes(search) ||
        song.artist.toLowerCase().includes(search)
      );
    }

    return filtered.sort((a, b) => a.title.localeCompare(b.title));
  }, [songs, searchQuery]);

  const handleSongToggle = (song: BandSong) => {
    setSelectedSongs(prev => {
      const index = prev.findIndex(s => s.id === song.id);
      if (index > -1) {
        const next = [...prev];
        next.splice(index, 1);
        return next;
      }
      return [...prev, song];
    });
  };

  const handleCreateSetlist = () => {
    const encodedSongs = encodeURIComponent(JSON.stringify(selectedSongs));
    router.push(`/bands/${activeBand?.id}/setlists/create?songs=${encodedSongs}`);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* no Header */}
      <div className="flex-none px-4 pt-4 pb-2 space-y-4 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search Play Book..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2"
        />

        {/* Mobile-optimized Selection Controls */}
        {isMultiSelectMode && (
          <div className="flex items-center justify-between bg-orange-500/10 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <span className="text-orange-500 font-medium">
                {selectedSongs.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSongs([]);
                  setIsMultiSelectMode(false);
                }}
                className="border-orange-500 text-orange-500"
              >
                Cancel
              </Button>
            </div>
            {selectedSongs.length > 0 && (
              <Button
                size="sm"
                onClick={handleCreateSetlist}
                className="bg-orange-500"
              >
                Create Setlist
              </Button>
            )}
          </div>
        )}

        {!isMultiSelectMode && (
          <Button
            variant="outline"
            onClick={() => setIsMultiSelectMode(true)}
            className="w-full border-gray-600 text-gray-400 hover:bg-gray-800"
          >
            Select Songs
          </Button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-red-400">{error.message}</span>
          </div>
        ) : playBookSongs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-gray-400">No songs in the Play Book</span>
          </div>
        ) : (
          <div className="space-y-1 px-4 py-2">
            {playBookSongs.map((song) => (
              <PlayBookSongCard
                key={song.id}
                song={song}
                isSelected={selectedSongs.some(s => s.id === song.id)}
                onSelect={() => handleSongToggle(song)}
                selectionOrder={selectedSongs.findIndex(s => s.id === song.id)}
                isSelectionMode={isMultiSelectMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}