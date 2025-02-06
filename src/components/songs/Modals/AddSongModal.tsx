'use client';

import { useModal } from '@/contexts/ModalProvider';
import { useBand } from '@/contexts/BandProvider';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

import { X, Search, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { searchSpotifyTracks, type SpotifyTrack } from '@/lib/services/spotify';
import {
  addBaseSong,
  addBandSong,
  searchBaseSongs,
  findBaseSongByTitleAndArtist,
  findBandSongByBaseSongId
} from '@/lib/services/firebase/songs';

import type { BaseSong, SongStatus } from '@/lib/types/song';

interface ExtendedSpotifyTrack extends SpotifyTrack {
  baseSongId?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function baseToSpotifyTrack(song: BaseSong): ExtendedSpotifyTrack {

  const spotifyId = song.spotifyUid?.split(':').pop() || '';
  // Convert duration
  const durationMs = song.metadata?.duration
    ? parseInt(song.metadata.duration) * 1000
    : 0;

  return {
    id: spotifyId,
    name: song.title,
    artists: [{ name: song.artist }],
    preview_url: song.previewUrl,
    external_urls: { spotify: song.previewUrl },
    duration_ms: durationMs,
    album: {
      images: [
        {
          url: song.thumbnail || '',
          height: 300,
          width: 300,
        },
      ],
    },
    baseSongId: song.id,
  };
}

export default function AddSongModal() {
  const { isAddSongOpen, closeAddSong } = useModal();
  const { activeBand } = useBand();
  const searchRef = useRef<HTMLInputElement>(null);

  // Core state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ExtendedSpotifyTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<ExtendedSpotifyTrack | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addMore, setAddMore] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  //For manual song entry
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualSong, setManualSong] = useState({
    title: '',
    artist: '',
    duration: '',
    bpm: '',
    key: ''
  });

  // Reset modal state when opened
  useEffect(() => {
    if (isAddSongOpen) {
      resetModalState();
      // Use requestAnimationFrame for next render cycle
      requestAnimationFrame(() => {
        searchRef.current?.focus();
      });
    }
  }, [isAddSongOpen]);

  // Search effect
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      return;
    }
    searchTracks();
  }, [debouncedQuery]);

  const searchTracks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const baseSongs = await searchBaseSongs(debouncedQuery);
      if (baseSongs.length > 0) {
        setSuggestions(baseSongs.map(baseToSpotifyTrack));
      } else {
        const results = await searchSpotifyTracks(debouncedQuery);
        setSuggestions(results);
      }
    } catch (err) {
      setError("Failed to search songs");
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetModalState = () => {
    setQuery("");
    setSuggestions([]);
    setSelectedTrack(null);
    setError(null);
    setShowSuggestions(false);
  };

  const handleTrackSelect = async (track: ExtendedSpotifyTrack) => {
    if (!activeBand?.id) {
      setError("No active band");
      return;
    }

    try {
      if (track.baseSongId) {
        const existingBandSong = await findBandSongByBaseSongId(activeBand.id, track.baseSongId);
        if (existingBandSong) {
          setError(`Song already exists in your ${existingBandSong.status.toLowerCase()} list`);
          return;
        }
      } else {
        const existingBaseSong = await findBaseSongByTitleAndArtist(
          track.name,
          track.artists.map(a => a.name).join(", ")
        );
        if (existingBaseSong) {
          track = baseToSpotifyTrack(existingBaseSong);
        }
      }

      setSelectedTrack(track);
      setShowSuggestions(false);
      setQuery(track.name);
    } catch (err) {
      console.error('Error selecting track:', err);
      setError("Failed to process track selection");
    }
  };

  const handleAddSong = async (status: SongStatus) => {
    if (!selectedTrack || !activeBand?.id) {
      setError(selectedTrack ? "No active band" : "No track selected");
      return;
    }

    if (!addMore) {
      closeAddSong();
    }

    try {
      let baseSongId = selectedTrack.baseSongId;

      if (!baseSongId) {
        toast.loading("🤖 AI Helper is enhancing song data...", {
          id: "ai-helper",
          duration: 3000
        });

        const baseData = {
          title: selectedTrack.name,
          artist: selectedTrack.artists.map((a) => a.name).join(", "),
          previewUrl: selectedTrack.preview_url || selectedTrack.external_urls?.spotify || "",
          thumbnail: selectedTrack.album?.images[0]?.url || "",
          spotifyUid: `spotify:track:${selectedTrack.id}`,
          metadata: {
            duration: String(Math.floor(selectedTrack.duration_ms / 1000))
          }
        };

        const aiProcessingStart = Date.now();
        baseSongId = await addBaseSong(baseData);
        const processingTime = Date.now() - aiProcessingStart;

        if (processingTime < 3000) {
          await new Promise(resolve => setTimeout(resolve, 3000 - processingTime));
        }

        toast.success("✨ bndy has enhanced your song with key and tempo information!", {
          id: "ai-helper",
          duration: 4000
        });
      }

      toast.loading("Adding to your collection...", {
        id: "add-song"
      });

      await addBandSong(baseSongId, activeBand.id, status);

      toast.success(`Song added to your ${status.toLowerCase()} list!`, {
        id: "add-song"
      });

      if (addMore) {
        resetModalState();
      }

    } catch (err) {
      console.error('Error adding song:', err);
      toast.error("Failed to add song", { id: "add-song" });
      if (addMore) {
        resetModalState();
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSong.title || !manualSong.artist) return;
    handleAddManualSong("SUGGESTED");
  };

  const handleAddManualSong = async (status: SongStatus) => {
    if (!activeBand?.id) return;
  
    if (!addMore) {
      closeAddSong();
    }
  
    try {
      const baseData = {
        title: manualSong.title,
        artist: manualSong.artist,
        previewUrl: '',
        metadata: {} as { bpm?: number; key?: string; duration?: string } 
       };
       
       if (manualSong.bpm) baseData.metadata.bpm = parseInt(manualSong.bpm);
       if (manualSong.key) baseData.metadata.key = manualSong.key; 
       if (manualSong.duration) baseData.metadata.duration = manualSong.duration;
  
      const baseSongId = await addBaseSong(baseData);
      await addBandSong(baseSongId, activeBand.id, status);
  
      toast.success(`Song added to your ${status.toLowerCase()} list!`);
  
      if (addMore) {
        setManualSong({
          title: '',
          artist: '',
          duration: '',
          bpm: '',
          key: ''
        });
      }
  
    } catch (err) {
      console.error('Error adding manual song:', err);
      toast.error("Failed to add song");
    }
  };

  return (
    <Dialog open={isAddSongOpen} onOpenChange={closeAddSong}>
      <DialogContent className="bg-gray-900 rounded-lg flex flex-col max-h-[80vh]">
        <DialogHeader className="flex-none">
          <div className="flex items-center justify-between">
            <DialogTitle>Add Song</DialogTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsManualEntry(!isManualEntry)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isManualEntry ? "bg-orange-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                )}
                title="Manual Entry"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button onClick={closeAddSong} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </DialogHeader>
   
        {isManualEntry ? (
          <form onSubmit={handleManualSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="text-sm text-gray-400">Title *</label>
              <Input
                value={manualSong.title}
                onChange={(e) => setManualSong({...manualSong, title: e.target.value})}
                className="bg-gray-800 border-gray-700"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Artist *</label>
              <Input
                value={manualSong.artist}
                onChange={(e) => setManualSong({...manualSong, artist: e.target.value})}
                className="bg-gray-800 border-gray-700"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-400">Duration (seconds)</label>
                <Input
                  type="number"
                  value={manualSong.duration}
                  onChange={(e) => setManualSong({...manualSong, duration: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">BPM</label>
                <Input
                  type="number"
                  value={manualSong.bpm}
                  onChange={(e) => setManualSong({...manualSong, bpm: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Key</label>
                <Input
                  value={manualSong.key}
                  onChange={(e) => setManualSong({...manualSong, key: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
   
            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                id="addMore"
                checked={addMore}
                onCheckedChange={(checked: boolean) => setAddMore(checked)}
              />
              <label htmlFor="addMore" className="text-sm text-gray-300">
                Add more
              </label>
            </div>
   
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                onClick={() => handleAddManualSong("SUGGESTED")}
                disabled={isLoading}
                className="w-full sm:w-[200px] h-[48px] bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
              >
                Add to Suggestions
              </Button>
              <Button
                onClick={() => handleAddManualSong("PLAYBOOK")}
                disabled={isLoading}
                className="w-full sm:w-[200px] h-[48px] bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
              >
                Add to Play Book
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex-none p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder=""
                  className="w-full pl-10 bg-gray-800 border-gray-700"
                />
              </div>
            </div>
   
            <div className="flex-1 overflow-y-auto px-4">
              {/* Rest of existing search content */}
              {isLoading && <p className="text-sm text-gray-500">Searching...</p>}
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4">
                  {error}
                </div>
              )}
              {/* Search results */}
              {query && showSuggestions && suggestions.length > 0 && (
                <div className="overflow-y-auto max-h-48 space-y-2 mt-4 pr-2">
                  {suggestions.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => handleTrackSelect(track)}
                      className="w-full p-2 flex items-center gap-3 hover:bg-gray-800 rounded-lg"
                    >
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <img
                          src={track.album?.images[0]?.url || "/placeholder.png"}
                          alt={track.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                        {track.baseSongId && (
                          <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-1 rounded">
                            BF
                          </div>
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-medium truncate line-clamp-1">{track.name}</div>
                        <div className="text-sm text-gray-400 truncate line-clamp-1">
                          {track.artists.map(a => a.name).join(", ")}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
   
              {selectedTrack && (
                <div className="space-y-4 mt-4">
                  <iframe
                    src={`https://open.spotify.com/embed/track/${selectedTrack.id}`}
                    width="100%"
                    height="152"
                    style={{ borderRadius: '12px' }}
                    allow="encrypted-media"
                    loading="lazy"
                  />
                  <div className="flex items-center gap-2 mb-4">
                    <Checkbox
                      id="addMore"
                      checked={addMore}
                      onCheckedChange={(checked: boolean) => setAddMore(checked)}
                    />
                    <label htmlFor="addMore" className="text-sm text-gray-300">
                      Add more
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                    <Button
                      onClick={() => handleAddSong("SUGGESTED")}
                      disabled={isLoading}
                      className="w-full sm:w-[200px] h-[48px] bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
                    >
                      Add to Suggestions
                    </Button>
                    <Button
                      onClick={() => handleAddSong("PLAYBOOK")}
                      disabled={isLoading}
                      className="w-full sm:w-[200px] h-[48px] bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                    >
                      Add to Play Book
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
   );
  }