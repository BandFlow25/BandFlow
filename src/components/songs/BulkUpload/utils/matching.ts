import { searchSpotifyTracks, type SpotifyTrack } from '@/lib/services/spotify';
import type { SongMatch } from '@/lib/types/bulkUpload';
import { Dispatch, SetStateAction } from 'react';
import {
  addBaseSong,
  addBandSong,
  findBandSongByBaseSongId,
  findBaseSongByTitleAndArtist
} from '@/lib/services/firebase/songs';

export const processSpotifyMatches = async (songTitles: string[]): Promise<SongMatch[]> => {
  const matches: SongMatch[] = [];

  for (const title of songTitles) {
    try {
      const spotifyResults = await searchSpotifyTracks(title);
      if (spotifyResults && spotifyResults.length > 0) {
        matches.push({
          title,
          artist: spotifyResults[0]?.artists[0]?.name ?? '',
          confidence: calculateConfidence(title, spotifyResults[0]),
          spotifyMatches: spotifyResults.slice(0, 3),
          selected: null
        });
      }
    } catch (error) {
      console.error(`Error matching ${title}:`, error);
    }
  }

  return matches;
};

const calculateConfidence = (title: string, track: SpotifyTrack | undefined): number => {
  if (!track?.name) return 0;
  
  // Remove common words and special characters
  const cleanString = (str: string) => {
    return str.toLowerCase()
      .replace(/\([^)]*\)/g, '') // Remove parentheses content
      .replace(/\[[^\]]*\]/g, '') // Remove bracket content
      .trim();
  };

  const cleanTitle = cleanString(title);
  const cleanTrackName = cleanString(track.name);
  
  const similarity = stringSimilarity(cleanTitle, cleanTrackName);
  return Math.round(similarity * 100);
};

const stringSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  return (longer.length - editDistance(longer, shorter)) / longer.length;
};

const editDistance = (str1: string, str2: string): number => {
    if (!str1 || !str2) return 0;
    
    const matrix: number[][] = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(0)
    );
  
    for (let i = 0; i <= str1.length; i++) matrix[0]![i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j]![0] = j;
  
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j]![i] = Math.min(
          matrix[j]![i - 1]!,
          matrix[j - 1]![i]!,
          matrix[j - 1]![i - 1]!
        ) + (substitutionCost);
      }
    }
    return matrix[str2.length]![str1.length]!;
  };

  export const updateMatch = (
    index: number, 
    track: SpotifyTrack, 
    results: SongMatch[], 
    setResults: Dispatch<SetStateAction<SongMatch[]>>
  ): void => {
    if (!track || index < 0 || index >= results.length) return;
    
    const current = results[index];
    if (!current) return;
    const updated = [...results];
    updated[index] = {
      title: current.title,
      artist: current.artist, 
      confidence: current.confidence,
      spotifyMatches: current.spotifyMatches,
      selected: track
    };
    setResults(updated);
  };

  export const approveSong = async (
    index: number, 
    results: SongMatch[], 
    bandId: string
  ): Promise<boolean> => {
    const match = results[index];
    if (!match?.selected) return false;
  
    try {
      // Check for existing base song
      const existingBaseSong = await findBaseSongByTitleAndArtist(
        match.selected.name,
        match.selected.artists[0]?.name || ''
      );
  
      let baseSongId: string;
      
      if (existingBaseSong) {
        baseSongId = existingBaseSong.id;
        // Check for existing band song
        const existingBandSong = await findBandSongByBaseSongId(bandId, baseSongId);
        if (existingBandSong) {
          console.log('Song already exists in band');
          return false;
        }
      } else {
        // Create new base song
        const baseData = {
          title: match.selected.name,
          artist: match.selected.artists[0]?.name || '',
          previewUrl: match.selected.preview_url || '',
          thumbnail: match.selected.album?.images[0]?.url || '',
          spotifyUid: `spotify:track:${match.selected.id}`,
          metadata: {}
        };
        baseSongId = await addBaseSong(baseData);
      }
  
      await addBandSong(baseSongId, bandId, 'SUGGESTED');
      return true;
    } catch (error) {
      console.error('Error approving song:', error);
      return false;
    }
  };
