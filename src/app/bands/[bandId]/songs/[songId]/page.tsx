//src\app\bands\[bandId]\songs\[songId]\page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useSongs } from '@/contexts/SongProvider';
import { useBand } from '@/contexts/BandProvider';
import { SongFeatures } from '@/components/songs/Features/SongFeatures';
import { SongDocuments } from '@/components/songs/Features/SongDocuments';
import { updateBandSong } from '@/lib/services/firebase/songs';
import type { BandSong } from '@/lib/types/song';
import { toast } from 'react-hot-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SongDetailPage() {
  const params = useParams();
  const { activeBand } = useBand();
  const { songs, isLoading } = useSongs();
  const [activeTab, setActiveTab] = useState('features');
  const [isEditing, setIsEditing] = useState(false);
  
  const song = songs.find((s) => s.id === params?.songId) || null;

  const handleUpdateSong = async (updates: Partial<BandSong>): Promise<boolean> => {
    if (!song?.id || !activeBand?.id) {
      toast.error("Error: Missing required data");
      return false;
    }
    
    try {
      await updateBandSong(activeBand.id, song.id, updates);
      toast.success('Song updated successfully!');
      setIsEditing(false);
      return true;
    } catch (error) {
      console.error('Error updating song:', error);
      toast.error('Failed to update song.');
      return false;
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (!song && !isLoading) {
    return (
      <AppLayout title="Song Details">
        <div className="flex items-center justify-center p-4">
          <div className="text-red-500">Song not found</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title='Song Details'
      action={
        <div className="flex items-center gap-4">
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Edit Details
            </Button>
          )}
        </div>
      }
      footer={
        isEditing && (
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="song-edit-form" // Connect to form ID
              className="bg-orange-500 hover:bg-orange-600"
            >
              Save Changes
            </Button>
          </div>
        )
      }
    >
      <div className="flex flex-col h-full">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full h-full flex flex-col"
        >
          <TabsList className="flex-none border-b border-gray-800">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="flex-1 overflow-y-auto">
            <SongFeatures
              song={song}
              isLoading={isLoading}
              onUpdate={handleUpdateSong}
              isEditing={isEditing}
            />
          </TabsContent>

          <TabsContent value="documents" className="flex-1 overflow-y-auto">
            <SongDocuments song={song} isLoading={isLoading} onUpdate={handleUpdateSong} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}                    
