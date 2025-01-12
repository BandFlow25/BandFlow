//src/contexts/band/BandProvider.tsx
'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getBand, isUserBandAdmin, getBandMembers } from '@/lib/services/firebase/bands';
import type { Band } from '@/lib/types/band';
import { useAuth } from '@/contexts/AuthProvider';
import { usePathname } from 'next/navigation';

interface BandContextType {
  activeBand: Band | null;
  currentBandId: string | null;
  isAdmin: boolean;
  memberCount: number;
  setActiveBandId: (bandId: string | null) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const BandContext = createContext<BandContextType | undefined>(undefined);

export function BandProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [activeBand, setActiveBand] = useState<Band | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBandId, setCurrentBandId] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);

  const setActiveBandId = useCallback(async (bandId: string | null) => {
    setIsLoading(true);
    setError(null);

    if (!bandId || !user) {
      setActiveBand(null);
      setIsAdmin(false);
      setCurrentBandId(null);
      setMemberCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const band = await getBand(bandId);
      if (!band) {
        throw new Error('Band not found');
      }

      const adminStatus = await isUserBandAdmin(user.uid, bandId);
      
      // Get band members count
      const members = await getBandMembers(bandId);
      setMemberCount(members.length);
      
      setActiveBand(band);
      setIsAdmin(adminStatus);
      setCurrentBandId(bandId);
    } catch (err: any) {
      console.error('Error loading band:', err);
      setError(err.message || 'Failed to load band');
      setActiveBand(null);
      setIsAdmin(false);
      setCurrentBandId(null);
      setMemberCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const bandIdMatch = pathname?.match(/\/bands\/([^\/]+)/);
    const bandId = bandIdMatch ? bandIdMatch[1] : null;
    
    if (bandId && bandId !== currentBandId) {
      setActiveBandId(bandId);
    }
  }, [pathname, currentBandId, setActiveBandId]);

  return (
    <BandContext.Provider value={{
      activeBand,
      currentBandId,
      isAdmin,
      memberCount,
      setActiveBandId,
      isLoading,
      error
    }}>
      {children}
    </BandContext.Provider>
  );
}

export const useBand = () => {
  const context = useContext(BandContext);
  if (context === undefined) {
    throw new Error('useBand must be used within a BandProvider');
  }
  return context;
};