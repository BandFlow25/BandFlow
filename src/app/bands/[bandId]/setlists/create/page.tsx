//src\app\bands\[bandId]\setlists\create\page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useBand } from '@/contexts/BandProvider';
import { createSetlist } from '@/lib/services/firebase/setlists';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function CreateSetlistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeBand } = useBand();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    setDuration: '60',  // Default 45 minutes per set
    numSets: '2',       // Default 2 sets
  });

  // Parse any pre-selected songs from PlayBook
  const songParam = searchParams?.get('songs');
  const selectedSongs = songParam ? JSON.parse(decodeURIComponent(songParam)) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBand?.id) return;

    setIsLoading(true);
    setError('');

    try {
      const setlistData = {
        name: formData.name,
        format: {
          numSets: parseInt(formData.numSets),
          setDuration: parseInt(formData.setDuration),
        }
      };

      // Create setlist with the selected songs
      await createSetlist(
        activeBand.id,
        activeBand.id, // Using band ID as creator ID for now
        formData.name,
        setlistData.format,
        selectedSongs
      );

      toast.success('Setlist created successfully');
      router.push(`/bands/${activeBand.id}/setlists`);
    } catch (error) {
      console.error('Error creating setlist:', error);
      setError('Failed to create setlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <main className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/bands/${activeBand?.id}/setlists`}
            className="inline-flex items-center text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Setlists
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-white mb-8">Create New Setlist</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-1">
              Setlist Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="numSets" className="block text-sm font-medium text-gray-200 mb-1">
                Number of Sets
              </label>
              <input
                type="number"
                id="numSets"
                name="numSets"
                min="1"
                max="5"
                required
                value={formData.numSets}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label htmlFor="setDuration" className="block text-sm font-medium text-gray-200 mb-1">
                Set Duration (minutes)
              </label>
              <input
                type="number"
                id="setDuration"
                name="setDuration"
                min="15"
                max="180"
                required
                value={formData.setDuration}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>

          {selectedSongs.length > 0 && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400">
                {selectedSongs.length} songs selected from Play Book
              </p>
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <Link
              href={`/bands/${activeBand?.id}/setlists`}
              className="flex-1 bg-gray-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Setlist'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}