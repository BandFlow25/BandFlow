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
  
  const setlistId = Array.isArray(params?.setlistId) ? params.setlistId[0] : params?.setlistId;
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize the page check to prevent unnecessary re-renders
  const isSetlistPage = useMemo(() => {
    return Boolean(setlistId && setlistId !== 'setlists');
  }, [setlistId]);

  // Single fetch effect
  useEffect(() => {
    let mounted = true;

    const loadSetlist = async () => {
      if (!activeBand?.id || !setlistId || !isSetlistPage) {
        if (mounted) {
          setIsLoading(false);
          setSetlist(null);
        }
        return;
      }

      if (mounted) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const data = await getSetlist(activeBand.id, setlistId);
        if (!data || !mounted) return;
        
        setSetlist(data);
      } catch (err) {
        if (!mounted) return;
        console.error('Error fetching setlist:', err);
        setError(err instanceof Error ? err.message : 'Failed to load setlist');
        setSetlist(null);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSetlist();

    return () => {
      mounted = false;
    };
  }, [activeBand?.id, setlistId, isSetlistPage]);

  // Memoize refresh function separately
  const refreshSetlist = useCallback(async () => {
    if (!activeBand?.id || !setlistId) return;
    
    setIsLoading(true);
    try {
      const data = await getSetlist(activeBand.id, setlistId);
      if (!data) return;
      setSetlist(data);
    } catch (err) {
      console.error('Error refreshing setlist:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeBand?.id, setlistId]);

  const value = useMemo(() => ({
    setlist,
    isLoading,
    error,
    refreshSetlist
  }), [setlist, isLoading, error, refreshSetlist]);

  return (
    <SetlistContext.Provider value={value}>
      {children}
    </SetlistContext.Provider>
  );
}