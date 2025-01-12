// components/songs/SetLists/AddSongsView.tsx
'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { SetlistSplitView } from './SetlistSplitView';
import type { Setlist, SetlistSong } from '@/lib/types/setlist';
import type { BandSong } from '@/lib/types/song';

interface AddSongsViewProps {
  isOpen: boolean;
  onClose: () => void;
  setlist: Setlist;
  songDetails: Record<string, BandSong>;
  selectedSetNumber: number;
  onSongAdd: (newSongs: SetlistSong[]) => Promise<void>;
}

export function AddSongsView({
  isOpen,
  onClose,
  setlist,
  songDetails,
  selectedSetNumber,
  onSongAdd
}: AddSongsViewProps) {
  const handleSongDrop = async (songId: string, dropSetNumber: number) => {
    if (dropSetNumber !== selectedSetNumber) return;

    const currentSetSongs = setlist.songs.filter(s => s.setNumber === selectedSetNumber);
    const newPosition = currentSetSongs.length;

    const newSong: SetlistSong = {
      songId,
      setNumber: selectedSetNumber,
      position: newPosition,
      isPlayBookActive: false
    };

    await onSongAdd([newSong]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] p-0 bg-gray-900">
        <DialogTitle className="p-4 text-xl font-semibold text-white border-b border-gray-800">
          Add Songs to Set {selectedSetNumber}
        </DialogTitle>
        <SetlistSplitView
          setlist={setlist}
          songDetails={songDetails}
          selectedSetNumber={selectedSetNumber}
          onSongDrop={handleSongDrop}
          onSongRemove={() => undefined}
          availableSongs={Object.values(songDetails).filter(
            song => !setlist.songs.some(s => s.songId === song.id)
          )}
        />
      </DialogContent>
    </Dialog>
  );
}