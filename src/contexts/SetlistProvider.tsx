// SetlistProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useBand } from '@/contexts/BandProvider';
import { getSetlist } from '@/lib/services/firebase/setlists';
import type { Setlist } from '@/lib/types/setlist';

type SetlistContextType = {
  setlist: Setlist | null;
  isLoading: boolean;
  error: string | null;
  refreshSetlist: () => void;
} | undefined;

const SetlistContext = createContext<SetlistContextType>(undefined);

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
  const bandId = params?.bandId as string;
  
  // Extract setlistId from pathname if not in params
  const setlistId = pathname?.split('/').pop();
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we're on a setlist detail page
  const isSetlistPage = pathname?.includes('/setlists/') && !pathname?.endsWith('/setlists');
   const fetchSetlist = useCallback(async () => {
    
    if (!bandId || !setlistId || !isSetlistPage || setlistId === 'setlists') {
      console.log('SetlistProvider Debug - Early return due to missing params or not on setlist page');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getSetlist(bandId, setlistId);
          
      if (!data) {
        throw new Error('Setlist not found in SetlistProvider');
      }
      
      setSetlist(data);
      
    } catch (err: any) {
      console.error('SetlistProvider Debug - Error:', err);
      setError(err.message || 'Failed to load setlist.');
      setSetlist(null);
    } finally {
      setIsLoading(false);
    }
  }, [bandId, setlistId, isSetlistPage]);

  useEffect(() => {
    if (isSetlistPage) {
      fetchSetlist();
    } else {
      setSetlist(null);
      setError(null);
      setIsLoading(false);
    }
  }, [fetchSetlist, isSetlistPage]);

  return (
    <SetlistContext.Provider value={{ setlist, isLoading, error, refreshSetlist: fetchSetlist }}>
      {children}
    </SetlistContext.Provider>
  );
}