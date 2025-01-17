// components/songs/PlayBook/PlayBookList.tsx
import { useMemo, useState } from 'react';
import { useSongs } from '@/contexts/SongProvider';
import { Plus } from 'lucide-react';
import { SearchHeader } from 'src/components/songs/Shared/SearchHeader';
import { PlayBookSongCard } from 'src/components/songs/SongCard/PlayBookSongCard';
import CreateSetlistModal from '../SetLists/CreateSetlistModal';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function PlayBookList() {
  const { songs, isLoading, error } = useSongs();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<any[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const playBookSongs = useMemo(() => {
    let filtered = songs.filter(song => song.status === 'PLAYBOOK');

    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(song =>
        song.title.toLowerCase().includes(search)
      );
    }

    return filtered.sort((a, b) => a.title.localeCompare(b.title));
  }, [songs, searchQuery]);

  const handleSongToggle = (song: any) => {
    setSelectedSongs(prev => {
      const index = prev.findIndex(item => item.id === song.id);
      if (index > -1) {
        const next = [...prev];
        next.splice(index, 1);
        return next;
      }
      return [...prev, song];
    });
  };

  return (
    <div className="flex flex-col">
      <SearchHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search Play Book..."
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
              className={isMultiSelectMode 
                ? 'border-orange-500 text-orange-500 hover:bg-orange-500/10'
                : 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
              }
            >
              {isMultiSelectMode ? 'Cancel Selection' : 'Select Multiple'}
            </Button>

            {isMultiSelectMode && selectedSongs.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setSelectedSongs(
                  selectedSongs.length === playBookSongs.length ? [] : playBookSongs
                )}
                className="text-gray-400 hover:text-gray-300"
              >
                {selectedSongs.length === playBookSongs.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>

          {selectedSongs.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-gray-400">
                {selectedSongs.length} selected
              </span>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-orange-500 hover:bg-orange-400"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Setlist
              </Button>
            </div>
          )}
        </div>
      </SearchHeader>

      <div className="flex-1 overflow-y-auto px-4">
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
          <div className="space-y-1">
            {playBookSongs.map((song) => (
              <PlayBookSongCard
                key={song.id}
                song={song}
                isSelected={selectedSongs.some(s => s.id === song.id)}
                onSelect={() => handleSongToggle(song)}
                isSelectionMode={isMultiSelectMode}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateSetlistModal
          onClose={() => {
            setShowCreateModal(false);
            setSelectedSongs([]);
            setIsMultiSelectMode(false);
          }}
          selectedSongs={selectedSongs}
        />
      )}
    </div>
  );
}