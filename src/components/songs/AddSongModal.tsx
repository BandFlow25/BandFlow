// AddSongModal with button feedback and preserved styles
'use client';

import { useModal } from '@/contexts/ModalProvider';
import React, { useState, useEffect } from 'react';
import { X } from 'react-feather';
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
import { useBand } from '@/contexts/BandProvider';
import { Sparkles } from 'lucide-react';
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
  const { currentBandId } = useBand();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ExtendedSpotifyTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<ExtendedSpotifyTrack | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
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
      setIsLoading(true);
      setError(null);

      try {
        const baseSongs = await searchBaseSongs(debouncedQuery);
        if (baseSongs.length > 0) {
          const suggestions = baseSongs.map(baseToSpotifyTrack);
          setSuggestions(suggestions);
        } else {
          const results = await searchSpotifyTracks(debouncedQuery);

             setSuggestions(results);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to search songs");
      } finally {
        setIsLoading(false);
      }
    }
    searchTracks();
  }, [debouncedQuery]);

  const handleTrackSelect = async (track: ExtendedSpotifyTrack) => {
    if (!currentBandId) {
      setError("No active band selected");
      return;
    }

    const existingBandSong = track.baseSongId ?
      await findBandSongByBaseSongId(currentBandId, track.baseSongId) :
      null;

    if (existingBandSong) {
      setError("This song is already in your band's songs");
      return;
    }

    if (!track.baseSongId) {
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
  };

  const handleAddSong = async (status: SongStatus) => {
    if (!selectedTrack || !currentBandId) {
      setError(selectedTrack ? "No active band selected" : "No track selected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let baseSongId = selectedTrack.baseSongId;

      if (!baseSongId) {
        const existingBaseSong = await findBaseSongByTitleAndArtist(
          selectedTrack.name,
          selectedTrack.artists.map((a) => a.name).join(", ")
        );

        if (existingBaseSong) {
          baseSongId = existingBaseSong.id;
        } else {
          
          baseSongId = await addBaseSong({
            title: selectedTrack.name,
            artist: selectedTrack.artists.map((a) => a.name).join(", "),
            previewUrl: selectedTrack.preview_url || selectedTrack.external_urls?.spotify || "",
            thumbnail: selectedTrack.album?.images[0]?.url || "",
            spotifyUid: `spotify:track:${selectedTrack.id}`,
            metadata: {
              duration: String(Math.floor(selectedTrack.duration_ms / 1000))
            }
          });
        }
      }

      await addBandSong(baseSongId, currentBandId, status);
      closeAddSong();
    } catch (err) {
      console.error(err);
      setError("Failed to add song");
    } finally {
      setIsLoading(false);
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
                  disabled={isLoading}
                  className={
                    isLoading
                      ? "bg-orange-500 text-white animate-pulse w-full sm:w-auto"
                      : "bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto"
                  }
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      BandFlow AI Helper gathering info...
                    </div>
                  ) : (
                    "Add to Suggestions"
                  )}
                </Button>

                <Button
                  onClick={() => handleAddSong("PLAYBOOK")}
                  disabled={isLoading}
                  className={
                    isLoading
                      ? "bg-orange-500 text-white animate-pulse w-full sm:w-auto"
                      : "bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto"
                  }
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      BandFlow AI Helper gathering info...
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
