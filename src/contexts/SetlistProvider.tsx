// src/contexts/SetlistProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useBand } from './BandProvider';
import { getSetlist, updateSetlistSets } from '@/lib/services/firebase/setlists';
import type { Setlist } from '@/lib/types/setlist';
import type { BandSong } from '@/lib/types/song';

interface SetlistContextType {
  setlist: Setlist | null;
  isLoading: boolean;
  error: Error | null;
  updateSetlist: (newSetlist: Setlist) => void;
  addSongToSet: (song: BandSong, setId: string) => Promise<void>;
  refreshSetlist: () => Promise<void>;
}

const SetlistContext = createContext<SetlistContextType | undefined>(undefined);

export function SetlistProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const { activeBand } = useBand();
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get setlistId from pathname
  const getSetlistId = () => {
    if (pathname?.includes('/setlists/')) {
      return pathname.split('/setlists/')[1]?.split('/')[0];
    }
    return null;
  };

  // Load or refresh setlist
  const loadSetlist = async () => {
    const setlistId = getSetlistId();
    if (!setlistId || !activeBand?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getSetlist(activeBand.id, setlistId);
      if (!data) throw new Error('Setlist not found');
      setSetlist(data);
    } catch (err) {
      console.error('Error loading setlist:', err);
      setError(err instanceof Error ? err : new Error('Failed to load setlist'));
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadSetlist();
  }, [activeBand?.id, pathname]);

  // Update local setlist state
  const updateSetlist = (newSetlist: Setlist) => {
    setSetlist(newSetlist);
  };

  // Refresh setlist data
  const refreshSetlist = async () => {
    await loadSetlist();
  };

  // Add a song to a specific set
  const addSongToSet = async (song: BandSong, targetSetId: string) => {
    if (!setlist || !activeBand?.id) {
      throw new Error('No active setlist or band');
    }

    const targetSet = setlist.sets.find(set => set.id === targetSetId);
    if (!targetSet) {
      throw new Error('Target set not found');
    }

    // Create new setlist song entry
    const newSetlistSong = {
      songId: song.id,
      setNumber: parseInt(targetSet.id.split('-')[1] || '1', 10),
      position: targetSet.songs.length,
      isPlayBookActive: true,
      transitionNote: ''
    };

    // Update sets with new song
    const newSets = setlist.sets.map(set => {
      if (set.id === targetSetId) {
        return {
          ...set,
          songs: [...set.songs, newSetlistSong]
        };
      }
      return set;
    });

    try {
      // Update Firebase
      await updateSetlistSets(activeBand.id, setlist.id, newSets);

      // Update local state
      const updatedSetlist = {
        ...setlist,
        sets: newSets,
        songDetails: {
          ...setlist.songDetails,
          [song.id]: song
        }
      };

      setSetlist(updatedSetlist);
    } catch (error) {
      console.error('Error adding song to set:', error);
      throw error;
    }
  };

  const contextValue: SetlistContextType = {
    setlist,
    isLoading,
    error,
    updateSetlist,
    addSongToSet,
    refreshSetlist
  };

  return (
    <SetlistContext.Provider value={contextValue}>
      {children}
    </SetlistContext.Provider>
  );
}

export const useSetlist = () => {
  const context = useContext(SetlistContext);
  if (!context) {
    throw new Error('useSetlist must be used within a SetlistProvider');
  }
  return context;
};