// src/lib/services/spotify/index.ts

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  preview_url: string | null;
  external_urls?: { spotify: string };
  duration_ms: number;
  album: {
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    
  };
 }
  
  const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? '';
  const SPOTIFY_CLIENT_SECRET = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET ?? '';
  let accessToken: string | null = null;
  
  const getAccessToken = async (): Promise<string> => {
    if (accessToken) return accessToken;
  
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
  
    const data = await response.json();
    if (!response.ok || !data.access_token) {
      throw new Error("Failed to get Spotify token");
    }
  
    accessToken = data.access_token;
    setTimeout(() => { accessToken = null; }, 3600 * 1000);
    return accessToken as string;
  };
  
  export const searchSpotifyTracks = async (query: string): Promise<SpotifyTrack[]> => {
    const token = await getAccessToken();
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  
    const data = await response.json();
    if (!response.ok) throw new Error("Spotify search failed");
  
    return data.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist: any) => ({ name: artist.name })),
      preview_url: track.preview_url || track.external_urls?.spotify || null,
      duration_ms: track.duration_ms,
      thumbnail: track.album?.images[1]?.url || track.album?.images[0]?.url || null,
      album: track.album
    }));
  };