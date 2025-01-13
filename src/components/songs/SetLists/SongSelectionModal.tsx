// components/songs/SetLists/SongSelectionModal.tsx
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useSongs } from '@/contexts/SongProvider';
import type { SetlistSong } from '@/lib/types/setlist';

//TODO: Make this better

interface SongSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSongSelect: (songs: SetlistSong[]) => void;
    setNumber: number;
    existingSongIds: Set<string>;
}

export function SongSelectionModal({
    isOpen,
    onClose,
    onSongSelect,
    setNumber,
    existingSongIds
  }: SongSelectionModalProps) {
    const { songs, isLoading } = useSongs();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  
    // Filter out existing songs
    const availableSongs = songs.filter(song => !existingSongIds.has(song.id));
    
    const filteredSongs = availableSongs.filter(song =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    const handleSongToggle = (songId: string, event: React.MouseEvent) => {
        const newSelected = new Set(selectedSongs);
        
        if (event.shiftKey && selectedSongs.size > 0) {
          // Get the last selected song index
          const lastSelectedIndex = filteredSongs.findIndex(
            song => Array.from(selectedSongs).includes(song.id)
          );
          const currentIndex = filteredSongs.findIndex(song => song.id === songId);
          
          // Ensure both indices are valid
          if (lastSelectedIndex !== -1 && currentIndex !== -1) {
            const start = Math.min(lastSelectedIndex, currentIndex);
            const end = Math.max(lastSelectedIndex, currentIndex);
            
            // Add all songs in range
            for (let i = start; i <= end; i++) {
              const song = filteredSongs[i];
              if (song) {
                newSelected.add(song.id);
              }
            }
          }
        } else {
          if (newSelected.has(songId)) {
            newSelected.delete(songId);
          } else {
            newSelected.add(songId);
          }
        }
        
        setSelectedSongs(newSelected);
      };
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl bg-gray-900 border border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Add Songs to Set {setNumber}</DialogTitle>
          </DialogHeader>
  
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search songs..."
              className="pl-10 bg-gray-800 border-gray-700 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
  
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4 text-gray-400">Loading songs...</div>
            ) : filteredSongs.length === 0 ? (
              <div className="text-center py-4 text-gray-400">No songs found</div>
            ) : (
              filteredSongs.map((song) => (
                <div
                  key={song.id}
                  className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                    selectedSongs.has(song.id)
                      ? 'bg-orange-500/20 border-orange-500'
                      : 'bg-gray-800/80 border-transparent hover:border-gray-700'
                  }`}
                  onClick={(e) => handleSongToggle(song.id, e)}
                >
                  <div className="font-medium text-white">{song.title}</div>
                  <div className="text-sm text-gray-400">{song.artist}</div>
                </div>
              ))
            )}
          </div>
  
          <div className="flex justify-between items-center gap-2">
            <div className="text-sm text-gray-400">
              Hold Shift to select multiple songs
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const songs = Array.from(selectedSongs);
                  onSongSelect(songs.map((id, index) => ({
                    songId: id,
                    setNumber,
                    position: index,
                    isPlayBookActive: false
                  })));
                  onClose();
                }}
                disabled={selectedSongs.size === 0}
                className="bg-orange-500 hover:bg-orange-400"
              >
                Add {selectedSongs.size} Songs
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }