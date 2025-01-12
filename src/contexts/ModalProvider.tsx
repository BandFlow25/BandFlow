// src/contexts/ui/ModalProvider.tsx
'use client';

import { createContext, useContext, useState } from 'react';

interface ModalContextType {
  isAddSongOpen: boolean;
  openAddSong: () => void;
  closeAddSong: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);

  const openAddSong = () => setIsAddSongOpen(true);
  const closeAddSong = () => setIsAddSongOpen(false);

  return (
    <ModalContext.Provider value={{ isAddSongOpen, openAddSong, closeAddSong }}>
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};