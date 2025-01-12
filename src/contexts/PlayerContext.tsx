//src\contexts\player\PlayerContext.tsx
'use client'
import React, { createContext, useContext, useState } from "react";
import type { BandSong } from "@/lib/types/song";

interface PlayerContextType {
  currentSong: BandSong | null;
  setCurrentSong: (song: BandSong | null) => void;  // Updated to allow null
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerContextProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<BandSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <PlayerContext.Provider value={{ currentSong, setCurrentSong, isPlaying, setIsPlaying }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayerContext() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayerContext must be used within a PlayerContextProvider");
  }
  return context;
}