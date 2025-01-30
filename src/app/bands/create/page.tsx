'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { createBand } from '@/lib/services/firebase/bands';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

console.log('Create band page component loading');

export default function CreateBandPage() {
  const router = useRouter();
  const { user, requireProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: ''
  });

  // Debug renders and auth state
  console.log('CreateBandPage render:', { 
    user: !!user, 
    isLoading,
    hasError: !!error 
  });

  useEffect(() => {
    console.log('Profile check effect running', {
      hasUser: !!user,
      requireProfileExists: !!requireProfile
    });

    if (!user) {
      console.log('No user found, redirecting to login');
      router.push('/login');
      return;
    }

    const profileCheckResult = requireProfile();
    console.log('Profile check result:', profileCheckResult);

  }, [user, requireProfile, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.log('Submit attempted without user');
      return;
    }
  
    setIsLoading(true);
    setError('');
  
    try {
      console.log('Attempting band creation with data:', {
        name: formData.name,
        hasDescription: !!formData.description,
        hasImage: !!formData.imageUrl,
        hasSocialLinks: !!(formData.facebook || formData.instagram || formData.twitter || formData.youtube)
      });

      const bandData = {
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl,
        socialLinks: {
          facebook: formData.facebook,
          instagram: formData.instagram,
          twitter: formData.twitter,
          youtube: formData.youtube
        }
      };
  
      await createBand(user.uid, bandData);
      console.log('Band created successfully');
      router.push('/home');
    } catch (error) {
      console.error('Band creation error:', error);
      if (error instanceof Error) {
        setError(error.message || 'Failed to create band');
      } else {
        setError('Failed to create band');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Loading state check
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/home"
            className="inline-flex items-center text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-white mb-8">Create New Band</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-1">
              Band Name *
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

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-200 mb-1">
              Band Image URL
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h2 className="text-lg font-semibold text-white mb-4">Social Media Links</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="facebook" className="block text-sm font-medium text-gray-200 mb-1">
                  Facebook URL
                </label>
                <input
                  type="url"
                  id="facebook"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-gray-200 mb-1">
                  Instagram URL
                </label>
                <input
                  type="url"
                  id="instagram"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <label htmlFor="twitter" className="block text-sm font-medium text-gray-200 mb-1">
                  Twitter URL
                </label>
                <input
                  type="url"
                  id="twitter"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div>
                <label htmlFor="youtube" className="block text-sm font-medium text-gray-200 mb-1">
                  YouTube URL
                </label>
                <input
                  type="url"
                  id="youtube"
                  name="youtube"
                  value={formData.youtube}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Link
              href="/home"
              className="flex-1 bg-gray-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Band'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}