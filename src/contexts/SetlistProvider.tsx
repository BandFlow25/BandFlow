// contexts/SetlistProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useBand } from '@/contexts/BandProvider';
import { getSetlist } from '@/lib/services/firebase/setlists';
import type { Setlist } from '@/lib/types/setlist';

interface SetlistContextType {
  setlist: Setlist | null;
  isLoading: boolean;
  error: string | null;
  refreshSetlist: () => Promise<void>;
}

const SetlistContext = createContext<SetlistContextType | undefined>(undefined);

export function useSetlist() {
  const context = useContext(SetlistContext);
  if (!context) {
    throw new Error('useSetlist must be used within a SetlistProvider');
  }
  return context;
}

interface SetlistProviderProps {
  children: React.ReactNode;
}

export function SetlistProvider({ children }: SetlistProviderProps) {
  const { activeBand } = useBand();
  const params = useParams();
  const pathname = usePathname();
  
  // Extract setlistId only from params if it exists
  const setlistId = Array.isArray(params?.setlistId) ? params.setlistId[0] : params?.setlistId;
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize the page check to prevent unnecessary re-renders
  const isSetlistPage = useMemo(() => {
    // Only true if we have a specific setlistId param
    return Boolean(setlistId && setlistId !== 'setlists');
  }, [setlistId]);

  const fetchSetlist = useCallback(async () => {
    if (!activeBand?.id || !setlistId || !isSetlistPage) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getSetlist(activeBand.id, setlistId);
          
      if (!data) {
        throw new Error('Setlist not found');
      }
      
      setSetlist(data);
    } catch (err) {
      console.error('Error fetching setlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to load setlist');
      setSetlist(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeBand?.id, setlistId, isSetlistPage]);

  useEffect(() => {
    if (isSetlistPage) {
      fetchSetlist();
    } else {
      // Only clear state if we were previously on a setlist page
      if (setlist !== null) {
        setSetlist(null);
        setError(null);
        setIsLoading(false);
      }
    }
  }, [fetchSetlist, isSetlistPage, setlist]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    setlist,
    isLoading,
    error,
    refreshSetlist: fetchSetlist
  }), [setlist, isLoading, error, fetchSetlist]);

  return (
    <SetlistContext.Provider value={value}>
      {children}
    </SetlistContext.Provider>
  );
}