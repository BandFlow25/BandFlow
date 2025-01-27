//src/components/setlists/AddSongsModal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BandSong } from '@/lib/types/song';
import { DurationtoMinSec } from '@/lib/services/bandflowhelpers/SetListHelpers';

interface AddSongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSongs: (songIds: string[]) => void;
  playbookSongs: BandSong[];
  existingSongIds: Set<string>;
}

export function AddSongsModal({
  isOpen,
  onClose,
  onAddSongs,
  playbookSongs,
  existingSongIds
}: AddSongsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [showExisting, setShowExisting] = useState(false);

  const filteredSongs = playbookSongs.filter(song => {
    if (!showExisting && existingSongIds.has(song.id)) return false;
    
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      song.title.toLowerCase().includes(search) ||
      song.artist.toLowerCase().includes(search)
    );
  });

  const handleToggleSong = (songId: string) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedSongs(newSelected);
  };

  const handleAddSelected = () => {
    onAddSongs(Array.from(selectedSongs));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 rounded-lg max-w-2xl w-full">
      <DialogTitle className="sr-only">Add Songs from Play Book</DialogTitle>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Songs from Play Book</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder=""
                className="pl-10 bg-gray-800 border-gray-700"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={showExisting}
                onChange={(e) => setShowExisting(e.target.checked)}
                className="rounded border-gray-700 bg-gray-800"
              />
              Show songs already in setlist
            </label>
          </div>

          {/* Song List */}
          <div className="h-[400px] overflow-y-auto">
            <div className="space-y-2 p-1">
              {filteredSongs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => handleToggleSong(song.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    selectedSongs.has(song.id)
                      ? "bg-orange-500/20 ring-1 ring-orange-500"
                      : "bg-gray-800 hover:bg-gray-700",
                    existingSongIds.has(song.id) && "opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{song.title}</div>
                      <div className="text-sm text-gray-400">{song.artist}</div>
                    </div>
                    {song.metadata?.duration && (
                      <div className="text-sm text-gray-400">
                        {DurationtoMinSec(parseInt(song.metadata.duration))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={onClose}
              className="bg-gray-800 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSelected}
              disabled={selectedSongs.size === 0}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
            >
              Add {selectedSongs.size} {selectedSongs.size === 1 ? 'Song' : 'Songs'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}