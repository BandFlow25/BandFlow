'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import { updateBand, isUserBandAdmin } from '@/lib/services/firebase/bands';
import { SettingSection } from '@/components/settings/SettingSection';
import BandMembers from '@/components/auth/BandMembers';
import { BulkSongUpload } from '@/components/songs/BulkUpload/BulkSongUpload';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function BandSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeBand, isReady } = useBand();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'details' | 'members' | 'bulk-upload' | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
  });

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user || !activeBand) return;
      try {
        const adminStatus = await isUserBandAdmin(user.uid, activeBand.id);
        setIsAdmin(adminStatus);
        if (adminStatus) {
          setFormData({
            name: activeBand.name,
            description: activeBand.description || '',
            imageUrl: activeBand.imageUrl || '',
            facebook: activeBand.socialLinks?.facebook || '',
            instagram: activeBand.socialLinks?.instagram || '',
            twitter: activeBand.socialLinks?.twitter || '',
            youtube: activeBand.socialLinks?.youtube || '',
          });
        }
      } catch (error: any) {
        setError(error.message || 'Failed to check permissions');
      }
    };
    checkAdmin();
  }, [user, activeBand]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin || !activeBand) return;

    setIsSaving(true);
    setError('');

    try {
      await updateBand(activeBand.id, {
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
      router.push(`/bands/${activeBand.id}`);
    } catch (error: any) {
      setError(error.message || 'Failed to update band');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">You don't have permission to edit this band.</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-[1.5rem]">
          {error}
        </div>
      )}

      <SettingSection
        title="Band Details"
        isExpanded={expandedSection === 'details'}
        onToggle={() => setExpandedSection(expandedSection === 'details' ? null : 'details')}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground">Band Name *</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
               className="form-input"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
               className="form-input"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Image URL</label>
            <Input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
               className="form-input"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-foreground">Social Links</h3>
            {['facebook', 'instagram', 'twitter', 'youtube'].map((social) => (
              <div key={social}>
                <label className="text-sm font-medium text-foreground capitalize">
                  {social}
                </label>
                <Input
                  type="url"
                  name={social}
                  value={formData[social as keyof typeof formData]}
                  onChange={handleChange}
                   className="form-input"
                />
              </div>
            ))}
          </div>

          <div>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </SettingSection>

      <SettingSection
        title="Band Members"
        isExpanded={expandedSection === 'members'}
        onToggle={() => setExpandedSection(expandedSection === 'members' ? null : 'members')}
      >
        {activeBand && (
          <BandMembers
            bandId={activeBand.id}
            currentUserId={user?.uid || ''}
          />
        )}
      </SettingSection>

      <SettingSection
        title="Bulk Song Upload"
        isExpanded={expandedSection === 'bulk-upload'}
        onToggle={() => setExpandedSection(expandedSection === 'bulk-upload' ? null : 'bulk-upload')}
      >
        <BulkSongUpload />
      </SettingSection>
    </div>
  );
}