//src\components\ui\Player.tsx
"use client";

import React, { useEffect } from 'react';
import { usePlayerContext } from "@/contexts/PlayerContext";
import { usePathname } from 'next/navigation';

export default function Player({ className = "" }: { className?: string }) {
  const { currentSong, setCurrentSong } = usePlayerContext();
  const pathname = usePathname();

  // Check if we're on a song-related page
  const isSongPage = pathname?.includes('/songs') || 
                    pathname?.endsWith(`/bands/${currentSong?.bandId}`);

  // Clear song if not on a song page
  useEffect(() => {
    if (!isSongPage && currentSong) {
      setCurrentSong(null);
    }
  }, [pathname, isSongPage, currentSong, setCurrentSong]);

  const getSpotifyEmbedUrl = (url: string): string => {
    if (!url) return "";
    if (url.includes("spotify.com/track")) {
      const trackId = url.split("/track/")[1]?.split("?")[0];
      return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0&autoplay=1&play=1`;
    }
    return "";
  };

  // Don't render if no song or not on song page
  if (!currentSong?.previewUrl || !isSongPage) {
    return null;
  }

  const embedUrl = getSpotifyEmbedUrl(currentSong.previewUrl);

  return (
    <div
      className={`fixed bottom-16 md:bottom-0 left-0 right-0 h-24 bg-black border-t border-gray-800 md:left-60 ${className || "z-20"}`}
    >
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}