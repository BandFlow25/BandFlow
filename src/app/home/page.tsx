//src\app\home\page.tsx
'use client';

import { useAuth } from '@/contexts/AuthProvider';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Plus, Music } from 'lucide-react';
import Link from 'next/link';
import { useBand } from '@/contexts/BandProvider';
import type { Band } from '@/lib/types/band';

export default function HomePage() {
  const router = useRouter();
  const { user, profile, validateProfile, logout } = useAuth();
  const {
    availableBands,
    isLoadingBands,
    selectBand,
    error,
    clearActiveBand
  } = useBand();

  // Check profile first
  useEffect(() => {
    if (!validateProfile()) return;
  }, [validateProfile]);

  // If no user is logged in, redirect to login
  useEffect(() => {
    if (!user && !isLoadingBands) {
      router.push('/login');
    }
  }, [user, isLoadingBands, router]);

  useEffect(() => {
    // Clear any active band when arriving at home page
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

  // Show loading state
  if (isLoadingBands) {
    return (
      <div className="min-h-screen bg-gray-900 text-white px-6 py-8">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading bands...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-2xl font-bold">Welcome to BandFlow25</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">
            {profile?.displayName || user.email}
          </span>
          <Link
            href="/profile-setup"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <button
            onClick={handleLogout}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Bands Grid */}
      <h2 className="text-xl mb-8">Select a Band</h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-8">
          {error}
        </div>
      )}

      {availableBands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <Music className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-2xl font-normal text-white mb-2">No bands yet</h3>
          <p className="text-gray-400 mb-8">Create your first band to get started</p>
          <Link
            href="/bands/create"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg inline-flex items-center text-lg font-normal"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Band
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableBands.map((band: Band & { userRole?: string }) => (
            <div
              key={band.id}
              onClick={() => handleBandSelect(band.id)}
              className="bg-gray-800 rounded-lg p-2 text-left hover:bg-gray-700 transition-colors relative group cursor-pointer"
            >
              <div className="relative">
                <img
                  src={band.imageUrl || '/images/band-placeholder.png'}
                  alt={band.name}
                  className="rounded-md mb-3 w-full h-48 object-cover"
                />
                {band.userRole === 'admin' && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBandSelect(band.id).then(() => {
                        router.push(`/bands/${band.id}/settings`);
                      });
                    }}
                    className="absolute top-2 right-2 p-2 rounded-lg transition-colors hover:bg-gray-900/50 cursor-pointer"
                  >
                    <Settings className="w-10 h-10 text-blue-500" />
                  </div>
                )}
              </div>
              <h3 className="font-semibold">{band.name}</h3>
            </div>
          ))}

          <Link
            href="/bands/create"
            className="bg-gray-800 rounded-lg flex items-center justify-center h-[242px] group hover:bg-gray-700 transition-colors"
          >
            <div className="text-center">
              <Plus className="w-8 h-8 mb-2 text-gray-400 group-hover:text-orange-500 transition-colors" />
              <span className="text-gray-400 group-hover:text-white transition-colors">
                Create New Band
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}