import { useMemo, useState } from 'react';
import { useSongs } from '@/contexts/SongProvider';
import { Plus } from 'lucide-react';
import { PlayBookListContent } from './PlayBookListContent';
import CreateSetlistModal from '@/components/songs/SetLists/CreateSetlistModal';
import { Input } from '@/components/ui/input';

export function PlayBookList() {
  const { songs, isLoading, error } = useSongs();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<any[]>([]); // Change to an ordered list
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
        // If already selected, remove it
        const next = [...prev];
        next.splice(index, 1);
        return next;
      } else {
        // Add to the end of the list
        return [...prev, song];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedSongs.length === playBookSongs.length) {
      setSelectedSongs([]);
    } else {
      setSelectedSongs([...playBookSongs]);
    }
  };

  const handleCancelSelection = () => {
    setIsMultiSelectMode(false);
    setSelectedSongs([]);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-900">
      {/* Header with Search and Actions */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm p-4 space-y-4">
        <div className="relative">
          <Input
            type="search"
            placeholder="Search Play Book..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800/50 border-gray-700 text-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                isMultiSelectMode 
                  ? 'border-orange-500 text-orange-500 hover:bg-orange-500/10' 
                  : 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
              }`}
            >
              {isMultiSelectMode ? 'Cancel Selection' : 'Select Multiple'}
            </button>
            
            {isMultiSelectMode && (
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-gray-400 hover:text-gray-300"
              >
                {selectedSongs.length === playBookSongs.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {selectedSongs.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-gray-400">
                {selectedSongs.length} selected
              </span>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Setlist
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Songs List */}
      <PlayBookListContent
        songs={playBookSongs}
        isLoading={isLoading}
        error={error}
        selectedSongs={new Set(selectedSongs.map(song => song.id))} // Pass as a Set for current compatibility
        onSongToggle={(id) => {
          const song = playBookSongs.find((s) => s.id === id);
          if (song) handleSongToggle(song);
        }}
        isMultiSelectMode={isMultiSelectMode}
      />

      {/* Create Setlist Modal */}
      {showCreateModal && (
        <CreateSetlistModal
          onClose={() => {
            setShowCreateModal(false);
            setSelectedSongs([]);
            setIsMultiSelectMode(false);
          }}
          selectedSongs={selectedSongs} // Pass in the ordered list
        />
      )}
    </div>
  );
}
