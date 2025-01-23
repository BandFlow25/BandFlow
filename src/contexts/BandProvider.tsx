'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { getUserBands, getBandMemberRole, getBand, getBandMembers } from '@/lib/services/firebase/bands';
import type { Band } from '@/lib/types/band';

interface BandState {
  // Selection Phase
  availableBands: Band[];
  isLoadingBands: boolean;
  
  // Active Band Phase
  activeBand: Band | null;
  isActiveBandLoaded: boolean;
  isAdmin: boolean;
  memberCount: number;
  
  // Errors
  error: string | null;
}

interface BandContextType extends BandState {
  selectBand: (bandId: string) => Promise<void>;
  clearActiveBand: () => void;
  refreshBands: () => Promise<void>;
  isReady: boolean;
}

const BandContext = createContext<BandContextType | undefined>(undefined);

const PROTECTED_ROUTES = ['/bands/[bandId]'];

export function BandProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, requireProfile } = useAuth();
  
  const [state, setState] = useState<BandState>({
    availableBands: [],
    isLoadingBands: true,
    activeBand: null,
    isActiveBandLoaded: false,
    isAdmin: false,
    memberCount: 0,
    error: null,
  });

  const isProtectedRoute = pathname ? PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route.replace('[bandId]', ''))
  ) : false;

  // Computed ready state
  const isReady = !state.isLoadingBands && 
    (!isProtectedRoute || (isProtectedRoute && state.isActiveBandLoaded));

  // Load available bands
  const loadBands = useCallback(async () => {
    if (!user) {
      setState(prev => ({
        ...prev,
        availableBands: [],
        isLoadingBands: false,
        activeBand: null,
        isActiveBandLoaded: false,
        memberCount: 0,
        error: null
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoadingBands: true, error: null }));
      const userBands = await getUserBands(user.uid);
      
      setState(prev => ({
        ...prev,
        availableBands: userBands,
        isLoadingBands: false
      }));
    } catch (err) {
      console.error('Error loading bands:', err);
      setState(prev => ({
        ...prev,
        isLoadingBands: false,
        error: 'Failed to load bands'
      }));
    }
  }, [user]);

  // Select active band
  const selectBand = useCallback(async (bandId: string) => {
    if (!user) return;

    if (!requireProfile()) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isActiveBandLoaded: false, error: null }));
      
      const band = await getBand(bandId);
      if (!band) {
        throw new Error('Band not found');
      }

      const role = await getBandMemberRole(bandId, user.uid);
      const members = await getBandMembers(bandId);
      
      setState(prev => ({
        ...prev,
        activeBand: band,
        isActiveBandLoaded: true,
        isAdmin: role === 'admin',
        memberCount: members.length
      }));

      localStorage.setItem('lastActiveBandId', bandId);
      
    } catch (err) {
      console.error('Error selecting band:', err);
      setState(prev => ({
        ...prev,
        activeBand: null,
        isActiveBandLoaded: false,
        memberCount: 0,
        error: 'Failed to select band'
      }));
      throw err;
    }
  }, [user, requireProfile]);

  const clearActiveBand = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeBand: null,
      isActiveBandLoaded: false,
      isAdmin: false,
      memberCount: 0
    }));
    localStorage.removeItem('lastActiveBandId');
  }, []);

  // Initial load of bands
  useEffect(() => {
    if (user) {
      loadBands();
    }
  }, [loadBands, user]);

  // Route protection and band restoration
  useEffect(() => {
    if (!isProtectedRoute || state.isLoadingBands) return;

    const handleProtectedRoute = async () => {
      if (!state.activeBand) {
        const lastActiveBandId = localStorage.getItem('lastActiveBandId');
        if (lastActiveBandId && state.availableBands.some(band => band.id === lastActiveBandId)) {
          try {
            await selectBand(lastActiveBandId);
          } catch (error) {
            console.error('Failed to restore band:', error);
            router.push('/home');
          }
        } else {
          router.push('/home');
        }
      }
    };

    handleProtectedRoute();
  }, [pathname, state.activeBand, state.isLoadingBands, state.availableBands, router, selectBand, isProtectedRoute]);

  const value = {
    ...state,
    selectBand,
    clearActiveBand,
    refreshBands: loadBands,
    isReady
  };

  // Only show loading state for protected routes
  if (!isReady && isProtectedRoute) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <BandContext.Provider value={value}>
      {children}
    </BandContext.Provider>
  );
}

export const useBand = () => {
  const context = useContext(BandContext);
  if (!context) {
    throw new Error('useBand must be used within a BandProvider');
  }
  return context;
};