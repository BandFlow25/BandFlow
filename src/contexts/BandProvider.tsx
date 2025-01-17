// src/contexts/BandProvider.tsx
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
  // Actions
  selectBand: (bandId: string) => Promise<void>;
  clearActiveBand: () => void;
  refreshBands: () => Promise<void>;
}

const BandContext = createContext<BandContextType | undefined>(undefined);

const PROTECTED_ROUTES = ['/bands/[bandId]'];

export function BandProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  
  // State
  const [state, setState] = useState<BandState>({
    availableBands: [],
    isLoadingBands: true,
    activeBand: null,
    isActiveBandLoaded: false,
    isAdmin: false,
    memberCount: 0,
    error: null,
  });

  // Load available bands
  const loadBands = useCallback(async () => {
    if (!user) {
      console.log('No user, clearing band state');
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
      console.log('Loading bands for user:', user.uid);
      setState(prev => ({ ...prev, isLoadingBands: true, error: null }));
      
      const userBands = await getUserBands(user.uid);
      console.log('Loaded bands:', userBands.length);
      
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
    console.log('Selecting band:', bandId);
    if (!user) return;

    try {
      setState(prev => ({ ...prev, isActiveBandLoaded: false, error: null }));
      
      const band = await getBand(bandId);
      if (!band) {
        throw new Error('Band not found');
      }

      const role = await getBandMemberRole(bandId, user.uid);
      const members = await getBandMembers(bandId);
      console.log('Got band and role:', { bandId: band.id, role, memberCount: members.length });
      
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
    }
  }, [user]);

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
    loadBands();
  }, [loadBands]);

  // Route protection
  useEffect(() => {
    if (!pathname) return;

    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    if (!isProtectedRoute) return;

    // If on a protected route but no active band
    if (isProtectedRoute && !state.activeBand && !state.isLoadingBands) {
      console.log('Protected route accessed without active band, redirecting');
      router.push('/home');
    }
  }, [pathname, state.activeBand, state.isLoadingBands, router]);

  // Restore last active band
  useEffect(() => {
    const lastActiveBandId = localStorage.getItem('lastActiveBandId');
    if (lastActiveBandId && !state.activeBand && !state.isLoadingBands) {
      // Verify the band exists in available bands before selecting
      const bandExists = state.availableBands.some(band => band.id === lastActiveBandId);
      if (bandExists) {
        selectBand(lastActiveBandId);
      } else {
        localStorage.removeItem('lastActiveBandId');
      }
    }
  }, [state.availableBands, state.activeBand, state.isLoadingBands, selectBand]);

  const value = {
    ...state,
    selectBand,
    clearActiveBand,
    refreshBands: loadBands
  };

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