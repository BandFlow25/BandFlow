//src\app\home\page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeProvider';
import Link from 'next/link';
import { BndyLogo } from '@/components/ui/bndylogo';
import { Settings, Plus, Music } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import type { Band } from '@/lib/types/band';

export default function HomePage() {
  const router = useRouter();
  const { user, profile, validateProfile, logout } = useAuth();
  const { availableBands, isLoadingBands, selectBand, error, clearActiveBand } = useBand();
  const { theme } = useTheme();

  useEffect(() => {
    if (!validateProfile()) return;
  }, [validateProfile]);

  useEffect(() => {
    if (!user && !isLoadingBands) {
      router.push('/login');
    }
  }, [user, isLoadingBands, router]);

  useEffect(() => {
    clearActiveBand();
  }, [clearActiveBand]);

  const handleBandSelect = async (bandId: string) => {
    await selectBand(bandId);
    router.push(`/bands/${bandId}`);
  };

  const handleLogout = async () => {
    try {
      clearActiveBand();
      await logout();
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (isLoadingBands) {
    return (
      <div className="min-h-screen bg-background text-foreground px-6 py-8">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading bands...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl text-white">Welcome to</h1>
          <div className="text-orange-500 w-24 md:w-32">
            <BndyLogo />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <span className="text-secondary-foreground">
            {profile?.displayName || user.email}
          </span>
          <Link
            href="/profile-setup"
            className="text-secondary-foreground hover:text-foreground transition-colors"
          >
            <Settings className="settings-icon w-5 h-5 text-blue-500" />
          </Link>
          <button
            onClick={handleLogout}
            className="button-primary !w-auto"
          >
            Logout
          </button>
        </div>
      </div>

      <h2 className="text-xl mb-8">Select a Band</h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-2xl mb-8">
          {error}
        </div>
      )}

      {availableBands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mb-6">
            <Music className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-2xl font-normal text-foreground mb-2">No bands yet</h3>
          <p className="text-secondary-foreground mb-8">Create your first band to get started</p>
          <Link
            href="/bands/create"
            className="band-tile h-[242px] flex items-center justify-center group"
          >
            <div className="text-center">
              <Plus className="w-8 h-8 mb-2 text-secondary-foreground group-hover:text-primary transition-colors" />
              <span className="text-secondary-foreground group-hover:text-foreground transition-colors">
                Create New Band
              </span>
            </div>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          {availableBands.map((band: Band & { userRole?: string }) => (
            <div
              key={band.id}
              onClick={() => handleBandSelect(band.id)}
              className="band-tile cursor-pointer"
            >
              <div className="relative">
                <img
                  src={band.imageUrl || '/images/band-placeholder.png'}
                  alt={band.name}
                  className="rounded-xl w-full aspect-square object-cover mb-3"
                />
                {band.userRole === 'admin' && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBandSelect(band.id).then(() => {
                        router.push(`/bands/${band.id}/settings`);
                      });
                    }}
                    className="absolute top-0 right-0 p-0 rounded-lg bg-transparent "
                  >
                    <Settings className="settings-icon w-8 h-8 text-blue-500" />
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-foreground">{band.name}</h3>
            </div>
          ))}

          <Link
            href="/bands/create"
            className="band-tile flex items-center justify-center group"
          >
            <div className="text-center">
              <Plus className="w-8 h-8 mb-2 text-secondary-foreground group-hover:text-primary transition-colors" />
              <span className="text-secondary-foreground group-hover:text-foreground transition-colors">
                Create New Band
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}