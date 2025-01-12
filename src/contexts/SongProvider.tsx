// contexts/songs/SongProvider.tsx
'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
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

  const fetchSongs = useCallback(() => {
    if (!activeBand?.id) {
      setIsLoading(false);
      return () => {}; // Return empty cleanup function
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const songsRef = collection(db, COLLECTIONS.BAND_SONGS);
      const songQuery = query(
        songsRef,
        where('bandId', '==', activeBand.id),
        orderBy('createdAt', 'desc')
      );
      
      // Set up real-time listener and return unsubscribe function directly
      return onSnapshot(
        songQuery, 
        (snapshot) => {
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
          console.error('Error fetching songs:', error);
          setError(error as Error);
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.error('Error setting up songs listener:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch songs'));
      setIsLoading(false);
      return () => {}; // Return empty cleanup function in case of error
    }
  }, [activeBand?.id]);

  useEffect(() => {
    const unsubscribe = fetchSongs();
    return () => unsubscribe();
  }, [fetchSongs]);

  const refreshSongs = useCallback(async () => {
    await fetchSongs();
  }, [fetchSongs]);

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