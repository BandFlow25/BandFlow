// src/contexts/SetlistProvider.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useBand } from './BandProvider';
import { getSetlist, updateSetlistSets } from '@/lib/services/firebase/setlists';
import type { Setlist } from '@/lib/types/setlist';
import type { BandSong } from '@/lib/types/song';
import { nanoid } from 'nanoid';

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

  // Get setlistId from pathname with improved handling
  const getSetlistId = () => {
    console.log('🎵 GetSetlistId Check:', {
      pathname,
      segments: pathname?.split('/'),
      isListView: pathname?.endsWith('/setlists')
    });
  
    // Early returns for special cases
    if (!pathname) return null;
    if (pathname.endsWith('/setlists')) {
      console.log('🎵 On setlist list view - should not try to load individual setlist');
      return null;
    }
    if (pathname.endsWith('/create')) {
      console.log('🎵 On create view - no setlist to load');
      return null;
    }
  
    // Extract setlist ID from path
    if (pathname.includes('/setlists/')) {
      const segments = pathname.split('/setlists/')[1]?.split('/');
      console.log('🎵 Found setlist segments:', segments);
      return segments ? segments[0] : null;
    }
    return null;
  };

  // Load or refresh setlist with improved error handling
  const loadSetlist = async () => {
    const setlistId = getSetlistId();
  
    console.log('🎵 LoadSetlist:', {
      setlistId,
      activeBandId: activeBand?.id,
      pathname,
      isListView: pathname?.endsWith('/setlists')
    });
  
    // Handle special cases where we don't need to load a setlist
    if (!setlistId || !activeBand?.id || 
        pathname?.endsWith('/setlists') || 
        pathname?.endsWith('/create')) {
      console.log('🎵 No setlist to load:', { 
        setlistId, 
        activeBandId: activeBand?.id,
        pathname
      });
      setIsLoading(false);
      return;
    }
  
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSetlist(activeBand.id, setlistId);
      console.log('🎵 Loaded setlist data:', data);
      
      if (!data) {
        setError(new Error('Setlist not found'));
        setSetlist(null);
      } else {
        setSetlist(data);
      }
    } catch (err) {
      console.error('🎵 Error loading setlist:', err);
      setError(err instanceof Error ? err : new Error('Failed to load setlist'));
      setSetlist(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadSetlist();
  }, [activeBand?.id, pathname]);

  const updateSetlist = (newSetlist: Setlist) => {
    setSetlist(newSetlist);
  };

  const refreshSetlist = async () => {
    await loadSetlist();
  };

  const addSongToSet = async (song: BandSong, targetSetId: string) => {
    if (!setlist || !activeBand?.id) {
      throw new Error('No active setlist or band');
    }

    const targetSet = setlist.sets.find(set => set.id === targetSetId);
    if (!targetSet) {
      throw new Error('Target set not found');
    }

    const newSetlistSong = {
      id: nanoid(),
      songId: song.id,
      setNumber: parseInt(targetSet.id.split('-')[1] || '1', 10),
      position: targetSet.songs.length,
      isPlayBookActive: true,
      transitionNote: ''
    };

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
      await updateSetlistSets(activeBand.id, setlist.id, newSets);
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

  const value = {
    setlist,
    isLoading,
    error,
    updateSetlist,
    addSongToSet,
    refreshSetlist
  };

  return (
    <SetlistContext.Provider value={value}>
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