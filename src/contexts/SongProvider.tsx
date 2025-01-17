'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { useBand } from '@/contexts/BandProvider';
import type { BandSong } from '@/lib/types/song';
import { COLLECTIONS } from '@/lib/constants';

interface SongsContextType {
  songs: BandSong[];
  isLoading: boolean;
  error: Error | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refreshSongs: () => Promise<void>;
  filteredSongs: BandSong[];
}

const SongsContext = createContext<SongsContextType | undefined>(undefined);

interface SongsProviderProps {
  children: React.ReactNode;
}

export function SongsProvider({ children }: SongsProviderProps) {
  const { activeBand } = useBand();
  const [songs, setSongs] = useState<BandSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    let isMounted = true;

    const setupSongsListener = async () => {
      if (!activeBand?.id) {
        if (isMounted) {
          setIsLoading(false);
          setSongs([]);
        }
        return;
      }

      try {
        if (isMounted) {
          setIsLoading(true);
          setError(null);
        }

        const songsRef = collection(
          db, 
          COLLECTIONS.BANDS, 
          activeBand.id, 
          COLLECTIONS.BAND_SONGS
        );

        const songQuery = query(
          songsRef,
          orderBy('createdAt', 'desc')
        );
        
        unsubscribe = onSnapshot(
          songQuery, 
          (snapshot) => {
            if (!isMounted) return;
            
            const fetchedSongs = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate(),
              updatedAt: doc.data().updatedAt?.toDate()
            })) as BandSong[];
            
            setSongs(fetchedSongs);
            setIsLoading(false);
          },
          (error) => {
            if (!isMounted) return;
            console.error('Error fetching songs:', error);
            setError(error as Error);
            setIsLoading(false);
          }
        );
      } catch (err) {
        if (!isMounted) return;
        console.error('Error setting up songs listener:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch songs'));
        setIsLoading(false);
      }
    };

    setupSongsListener();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeBand?.id]);

  const refreshSongs = useCallback(async () => {
    // The refresh is now handled by the real-time listener
    // This is kept for API consistency
    setIsLoading(true);
    setError(null);
    // The listener will automatically update when data changes
    setIsLoading(false);
  }, []);

  // Filtered songs computation
  const filteredSongs = songs.filter(song => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      song.title.toLowerCase().includes(search) ||
      song.artist.toLowerCase().includes(search)
    );
  });

  const value = {
    songs,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    refreshSongs,
    filteredSongs
  };

  return (
    <SongsContext.Provider value={value}>
      {children}
    </SongsContext.Provider>
  );
}

export const useSongs = () => {
  const context = useContext(SongsContext);
  if (!context) {
    throw new Error('useSongs must be used within a SongsProvider');
  }
  return context;
};