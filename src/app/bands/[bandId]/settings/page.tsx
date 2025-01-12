//src/app/bands/[bandId]/settings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { getBand, updateBand, isUserBandAdmin } from '@/lib/services/firebase/bands';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BandMembers from '@/components/auth/BandMembers';

export default function BandSettingsPage({ params }: { params: Promise<{ bandId: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const unwrappedParams = React.use(params);
  const bandId = unwrappedParams.bandId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
  });
  const [expandedSection, setExpandedSection] = useState<'details' | 'members' | null>('details');

  useEffect(() => {
    const loadBand = async () => {
      if (!user || !bandId) return;

      try {
        const [band, adminStatus] = await Promise.all([
          getBand(bandId),
          isUserBandAdmin(user.uid, bandId),
        ]);

        if (!band) {
          router.push('/home');
          return;
        }

        setIsAdmin(adminStatus);
        setFormData({
          name: band.name,
          description: band.description || '',
          imageUrl: band.imageUrl || '',
          facebook: band.socialLinks?.facebook || '',
          instagram: band.socialLinks?.instagram || '',
          twitter: band.socialLinks?.twitter || '',
          youtube: band.socialLinks?.youtube || '',
        });
      } catch (error: any) {
        console.error('Error loading band:', error);
        setError(error.message || 'Failed to load band');
      } finally {
        setIsLoading(false);
      }
    };

    loadBand();
  }, [user, bandId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin || !bandId) return;

    setIsSaving(true);
    setError('');

    try {
      await updateBand(bandId, {
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl,
        socialLinks: {
          facebook: formData.facebook,
          instagram: formData.instagram,
          twitter: formData.twitter,
          youtube: formData.youtube,
        },
      });
      router.push(`/bands/${bandId}`);
    } catch (error: any) {
      console.error('Error updating band:', error);
      setError(error.message || 'Failed to update band');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading band settings...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">You don't have permission to edit this band.</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href={`/bands/${bandId}`} className="inline-flex items-center text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Band
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Band Details Section */}
          <div>
            <button
              className={`w-full text-left py-2 px-4 text-lg font-semibold ${
                expandedSection === 'details' ? 'text-white bg-gray-700' : 'text-gray-400 bg-gray-800'
              } rounded-lg`}
              onClick={() => setExpandedSection(expandedSection === 'details' ? null : 'details')}
            >
              Band Details
            </button>
            {expandedSection === 'details' && (
              <div className="bg-gray-800 p-4 rounded-lg mt-2">
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
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-200 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      id="imageUrl"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-gray-200">Social Links</h3>
                    <div>
                      <label htmlFor="facebook" className="block text-sm font-medium text-gray-200 mb-1">
                        Facebook
                      </label>
                      <input
                        type="url"
                        id="facebook"
                        name="facebook"
                        value={formData.facebook}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="instagram" className="block text-sm font-medium text-gray-200 mb-1">
                        Instagram
                      </label>
                      <input
                        type="url"
                        id="instagram"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="twitter" className="block text-sm font-medium text-gray-200 mb-1">
                        Twitter
                      </label>
                      <input
                        type="url"
                        id="twitter"
                        name="twitter"
                        value={formData.twitter}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="youtube" className="block text-sm font-medium text-gray-200 mb-1">
                        YouTube
                      </label>
                      <input
                        type="url"
                        id="youtube"
                        name="youtube"
                        value={formData.youtube}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Band Members Section */}
          <div>
            <button
              className={`w-full text-left py-2 px-4 text-lg font-semibold ${
                expandedSection === 'members' ? 'text-white bg-gray-700' : 'text-gray-400 bg-gray-800'
              } rounded-lg`}
              onClick={() => setExpandedSection(expandedSection === 'members' ? null : 'members')}
            >
              Band Members
            </button>
            {expandedSection === 'members' && (
              <div className="bg-gray-800 p-4 rounded-lg mt-2">
                <BandMembers bandId={bandId} currentUserId={user?.uid || ''} />
              </div>
            )}
          </div>

          
        </div>

        
      </div>
    </main>
  );
}