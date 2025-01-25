import type { SpotifyTrack } from '@/lib/services/spotify';

export interface SongMatch {
  title: string;
  artist: string;
  confidence: number;
  spotifyMatches: SpotifyTrack[];
  selected: SpotifyTrack | null;
}