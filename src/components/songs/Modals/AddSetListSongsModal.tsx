//src\components\songs\Modals\AddSetListSongsModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, GripVertical } from "lucide-react";
import { useSongs } from "@/contexts/SongProvider";
import { DurationtoMinSec } from '@/lib/services/bandflowhelpers/SetListHelpers';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import _ from 'lodash';
import type { BandSong } from '@/lib/types/song';

interface AddSetlistSongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSongs: (songIds: string[]) => void;
  currentSetNumber: number;
  setlist: {
    songs: Array<{
      songId: string;
      setNumber: number;
      position: number;
    }>;
    format: {
      setDuration: number;
    };
  };
}

export function AddSetlistSongsModal({
  isOpen,
  onClose,
  onAddSongs,
  currentSetNumber,
  setlist,
}: AddSetlistSongsModalProps) {
  const { songs } = useSongs();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);

  // Get current set's songs with full details
  const currentSetSongs = useMemo(() => {
    const setSongs = setlist.songs
      .filter(song => song.setNumber === currentSetNumber)
      .sort((a, b) => a.position - b.position);

    return setSongs.map(setSong => ({
      ...setSong,
      details: songs.find(s => s.id === setSong.songId)
    }));
  }, [setlist.songs, currentSetNumber, songs]);

  // Group available songs (excluding all setlist songs)
  const groupedSongs = useMemo(() => {
    // Get all songs in the setlist to exclude
    const existingSetlistSongIds = new Set(setlist.songs.map(s => s.songId));

    const playBookSongs = songs.filter(song =>
      song.status === "PLAYBOOK" &&
      !existingSetlistSongIds.has(song.id)
    );

    const filtered = playBookSongs.filter(song =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return _.groupBy(filtered, song => song.title[0]?.toUpperCase() || '#');
  }, [songs, searchQuery, setlist.songs]);

  const sortedGroups = useMemo(() =>
    Object.entries(groupedSongs)
      .sort(([a], [b]) => a.localeCompare(b))
    , [groupedSongs]);

  const handleSelectSong = (songId: string) => {
    setSelectedSongs(prev =>
      prev.includes(songId)
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
     <DialogContent 
  className={cn(
    "fixed inset-x-0",
    "top-[360px]", // Keep the top where it was
    "h-[600px]",   // Fixed height
    "bg-[#1f2937] border border-gray-700",
    "flex flex-col",
    "p-0 m-0 rounded-none max-w-none",
    "overflow-hidden",
    "z-50"
  )}
>
        {/* Header */}
        <DialogHeader className="flex-none px-4 py-3 border-b border-gray-700 bg-[#374151]">
          <DialogTitle className="text-lg font-medium">
            Add Songs to Set {currentSetNumber}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-300">
            <span>{currentSetSongs.length} songs</span>
            <span>•</span>
            <span>{setlist.format.setDuration}min target</span>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="grid grid-cols-2 h-full">
            {/* Left Panel - Current Set */}
            <div className="border-r border-gray-700 flex flex-col bg-[#1f2937]">
              <div className="flex-none px-4 py-3 border-b border-gray-700 bg-[#2d3748]">
                <h3 className="font-medium">Set {currentSetNumber}</h3>
                <p className="text-sm text-gray-300">
                  {currentSetSongs.length} songs
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {currentSetSongs.map((setSong, index) => {
                  const song = setSong.details;
                  if (!song) return null;

                  return (
                    <div
                      key={setSong.songId}
                      className="flex items-center gap-2 p-2 mx-2 my-1 rounded-md bg-[#374151] hover:bg-[#4b5563]"
                    >
                      <span className="w-6 text-center text-sm text-gray-300">
                        {index + 1}
                      </span>
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="truncate text-gray-100">{song.title}</span>
                        <span className="text-sm text-gray-300 ml-2">
                          {DurationtoMinSec(parseInt(song.metadata?.duration || "0"))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel - Play Book Songs */}
            <div className="flex flex-col bg-[#1f2937]">
              <div className="flex-none px-4 py-3 border-b border-gray-700 bg-[#2d3748]">
                <h3 className="font-medium">Play Book Songs</h3>
                <div className="mt-2">
                  <Input
                    type="search"
                    placeholder="Search songs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#374151] border-gray-600 text-gray-100 placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {sortedGroups.map(([letter, songs]) => (
                  <div key={letter}>
                    <div className="sticky top-0 bg-[#2d3748] px-4 py-1 text-sm font-medium text-gray-400">
                      {letter}
                    </div>
                    <div className="px-2">
                      {songs.map(song => (
                        <div
                          key={song.id}
                          onClick={() => handleSelectSong(song.id)}
                          className={cn(
                            "flex items-center justify-between p-2 my-1 rounded-md cursor-pointer",
                            selectedSongs.includes(song.id)
                              ? "bg-orange-500/20 text-orange-100"
                              : "bg-[#374151] hover:bg-[#4b5563] text-gray-100"
                          )}
                        >
                          <span className="truncate">{song.title}</span>
                          <span className="text-sm text-gray-300 ml-2">
                            {DurationtoMinSec(parseInt(song.metadata?.duration || "0"))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none px-4 py-3 border-t border-gray-700 bg-[#374151]">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-200 hover:bg-[#374151]"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onAddSongs(selectedSongs);
                onClose();
              }}
              disabled={selectedSongs.length === 0}
              className="bg-orange-500 hover:bg-orange-400 disabled:bg-gray-600"
            >
              Add {selectedSongs.length} Songs
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />
    </Dialog>
  );
}