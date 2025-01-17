// AddSongModal with button feedback and preserved styles
'use client';

import { useModal } from '@/contexts/ModalProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

import { X } from 'react-feather';
import { Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  console.log('baseToSpotifyTrack: Converting BaseSong to ExtendedSpotifyTrack:', song);

  const spotifyId = song.spotifyUid?.split(':').pop() || '';
  console.log(`baseToSpotifyTrack: Extracted Spotify ID: ${spotifyId}`);

  // Log the incoming duration metadata
  if (song.metadata?.duration) {
    console.log('baseToSpotifyTrack: Original metadata duration:', song.metadata.duration);
  } else {
    console.log('baseToSpotifyTrack: No metadata duration found');
  }

  //TODO: Figure out WTF this is here? Its not needed.
  // Convert duration
  const durationMs = song.metadata?.duration
    ? parseInt(song.metadata.duration) * 1000
    : 0;

  console.log(`WHY? AddSongModal : baseToSpotifyTrack: Converted duration_ms: ${durationMs}`);

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
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ExtendedSpotifyTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<ExtendedSpotifyTrack | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<'idle' | 'searching' | 'processing'>('idle');
  const [processingText, setProcessingText] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    console.log('AddSongModal: Modal state changed', {
      isOpen: isAddSongOpen,
      activeBand: activeBand?.id,
      user: user?.uid
    });

    if (isAddSongOpen) {
      setQuery("");
      setSuggestions([]);
      setSelectedTrack(null);
      setError(null);
      setShowSuggestions(false);
    }
  }, [isAddSongOpen]);

  useEffect(() => {
    async function searchTracks() {
      if (!debouncedQuery.trim()) {
        setSuggestions([]);
        return;
      }

      console.log('AddSongModal: Starting track search for:', debouncedQuery);
      setIsLoading(true);
      setError(null);

      try {
        const baseSongs = await searchBaseSongs(debouncedQuery);
        console.log('AddSongModal: Base songs search results:', baseSongs.length);

        if (baseSongs.length > 0) {
          console.log('AddSongModal: Found existing BF songs');
          const suggestions = baseSongs.map(baseToSpotifyTrack);
          setSuggestions(suggestions);
        } else {
          console.log('AddSongModal: No BF songs found, searching Spotify');
          const results = await searchSpotifyTracks(debouncedQuery);
          console.log('AddSongModal: Spotify results:', results.length);
          setSuggestions(results);
        }
      } catch (err) {
        console.error('AddSongModal: Search error:', err);
        setError("Failed to search songs");
      } finally {
        setIsLoading(false);
      }
    }
    searchTracks();
  }, [debouncedQuery]);

  const handleTrackSelect = async (track: ExtendedSpotifyTrack) => {
    console.log('AddSongModal: Track selected:', {
      name: track.name,
      artists: track.artists.map(a => a.name),
      baseSongId: track.baseSongId
    });

    if (!activeBand?.id) {
      console.error('AddSongModal: No active band:', { activeBand });
      setError("No active band selected");
      return;
    }

    try {
      if (track.baseSongId) {
        console.log('AddSongModal: Checking for existing band song');
        const existingBandSong = await findBandSongByBaseSongId(activeBand.id, track.baseSongId);

        console.log('AddSongModal: Existing band song check:', {
          exists: !!existingBandSong,
          songId: existingBandSong?.id
        });

        if (existingBandSong) {
          setError(`This song already exists in your ${existingBandSong.status.toLowerCase()} list`);
          return;
        }
      } else {
        console.log('AddSongModal: Checking for existing base song');
        const existingBaseSong = await findBaseSongByTitleAndArtist(
          track.name,
          track.artists.map(a => a.name).join(", ")
        );

        if (existingBaseSong) {
          console.log('AddSongModal: Found existing base song:', existingBaseSong.id);
          track = baseToSpotifyTrack(existingBaseSong);
        }
      }

      setSelectedTrack(track);
      setShowSuggestions(false);
      setQuery(track.name);
    } catch (err) {
      console.error('AddSongModal: Error selecting track:', err);
      setError("Failed to process track selection");
    }
  };

  const handleAddSong = async (status: SongStatus) => {
    if (!selectedTrack || !activeBand?.id) {
      setError(selectedTrack ? "No active band selected" : "No track selected");
      return;
    }
  
    // Close modal immediately
    closeAddSong();
  
    try {
      let baseSongId = selectedTrack.baseSongId;
      
      if (!baseSongId) {
        // Show AI processing toast - with forced minimum duration
        toast.loading("🤖 BandFlow AI Helper is analyzing your song...", {
          id: "ai-helper",
          duration: 3000 // Minimum display time
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
  
        // Add artificial delay if AI is too fast
        const aiProcessingStart = Date.now();
        baseSongId = await addBaseSong(baseData);
        const processingTime = Date.now() - aiProcessingStart;
        
        // Ensure minimum display time for AI message
        if (processingTime < 3000) {
          await new Promise(resolve => setTimeout(resolve, 3000 - processingTime));
        }
  
        // Update toast to show completion
        toast.success("✨ BandFlow AI has enhanced your song with key and tempo information!", {
          id: "ai-helper",
          duration: 4000
        });
      }
  
      // Show adding to collection toast
      toast.loading("Adding to your collection...", {
        id: "add-song"
      });
  
      await addBandSong(baseSongId, activeBand.id, status);
  
      // Success toast
      toast.success(`Song added to your ${status.toLowerCase()} list!`, {
        id: "add-song"
      });
  
    } catch (err) {
      console.error('AddSongModal: Error adding song:', err);
      toast.error("Failed to add song", {
        id: "add-song"
      });
    }
  };





  return (
    <Dialog open={isAddSongOpen} onOpenChange={closeAddSong}>
      <DialogContent className="bg-gray-900 rounded-lg">
        <DialogHeader>
          <DialogTitle>Add Song</DialogTitle>
          <button onClick={closeAddSong} className="absolute right-3 top-3 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="p-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search songs..."
            className="w-full bg-gray-800 border-gray-700 mb-4"
          />

          {isLoading && <p className="text-sm text-gray-500">Searching...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {query && showSuggestions && suggestions.length > 0 && (
            <div className="overflow-y-auto space-y-2">
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
                    <div className="font-medium truncate">{track.name}</div>
                    <div className="text-sm text-gray-400 truncate">
                      {track.artists.map(a => a.name).join(", ")}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedTrack && (
            <div className="space-y-4">
              <iframe
                src={`https://open.spotify.com/embed/track/${selectedTrack.id}`}
                width="100%"
                height="152"
                style={{ borderRadius: '12px' }}
                allow="encrypted-media"
                loading="lazy"
              />
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button
                  onClick={() => handleAddSong("SUGGESTED")}
                  disabled={loadingState === 'processing'}
                  className={cn(
                    "w-full sm:w-[200px] h-[48px]", // Fixed height prevents jumping
                    loadingState === 'processing'
                      ? "bg-orange-500 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  )}
                >
                  {loadingState === 'processing' ? (
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <span className="text-sm">{processingText}</span>
                    </div>
                  ) : (
                    "Add to Suggestions"
                  )}
                </Button>

                <Button
                  onClick={() => handleAddSong("PLAYBOOK")}
                  disabled={loadingState === 'processing'}
                  className={cn(
                    "w-full sm:w-[200px] h-[48px]", // Fixed height prevents jumping
                    loadingState === 'processing'
                      ? "bg-orange-500 text-white"
                      : "bg-orange-500 hover:bg-orange-600 text-white"
                  )}
                >
                  {loadingState === 'processing' ? (
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <span className="text-sm">{processingText}</span>
                    </div>
                  ) : (
                    "Add to Play Book"
                  )}
                </Button>
              </div>
            </div>
          )}

          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
