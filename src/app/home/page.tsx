//src\app\home\page.tsx
'use client';

import { useAuth } from '@/contexts/AuthProvider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Plus, Music } from 'lucide-react';
import Link from 'next/link';
import { getUserBands, isUserBandAdmin } from '@/lib/services/firebase/bands';
import type { Band } from '@/lib/types/band';

export default function HomePage() {
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const [bands, setBands] = useState<Band[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminStatuses, setAdminStatuses] = useState<{ [key: string]: boolean }>({});


  // Load bands only when we have a user
  useEffect(() => {
    const loadBands = async () => {
      if (!user) return;

      try {
        const userBands = await getUserBands(user.uid);
        setBands(userBands);

        // Check admin status for each band
        const statuses = await Promise.all(
          userBands.map(async (band) => ({
            bandId: band.id,
            isAdmin: await isUserBandAdmin(user.uid, band.id)
          }))
        );

        // Convert to object for easy lookup
        const statusObject = statuses.reduce((acc, status) => ({
          ...acc,
          [status.bandId]: status.isAdmin
        }), {});

        setAdminStatuses(statusObject);
        setError(null);
      } catch (err) {
        console.error('Failed to load bands:', err);
        setError('Failed to load bands');
      } finally {
        setIsLoading(false);
      }
    };

    loadBands();
  }, [user]);

  // If no user is logged in, redirect to login
  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };


  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white px-6 py-8">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-8">
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


      <h2 className="text-xl mb-8">Your Bands</h2>

      {bands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <Music className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-2xl font-normal text-white mb-2">No bands yet</h3>
          <p className="text-gray-400 mb-8">Create your first band to get started</p>
          <Link
            href="/bands/create"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center text-lg font-normal"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Band
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bands.map((band) => (
            <div
              key={band.id}
              className="bg-gray-800 rounded-lg p-4 text-center relative group"
            >
              <Link href={`/bands/${band.id}`}>
                <img
                  src={band.imageUrl || '/images/band-placeholder.png'}
                  alt={band.name}
                  className="rounded-md mb-3 w-full h-48 object-cover"
                />
                <h3 className="font-semibold">{band.name}</h3>
              </Link>
              {adminStatuses[band.id] && (
                <Link
                  href={`/bands/${band.id}/settings`}
                  className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-600 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </Link>
              )}
            </div>
          ))}



          <Link
            href="/bands/create"
            className="bg-gray-800 rounded-lg flex items-center justify-center h-[242px] group hover:bg-gray-700 transition-colors"
          >
            <div className="text-center">
              <Plus className="w-8 h-8 mb-2 text-gray-400 group-hover:text-orange-500 transition-colors" />
              <span className="text-gray-400 group-hover:text-white transition-colors">Create New Band</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}