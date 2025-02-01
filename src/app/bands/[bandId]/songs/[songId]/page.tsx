//src\app\bands\[bandId]\songs\[songId]\page.tsx
'use client';

import { useAuth } from '@/contexts/AuthProvider';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useBand } from '@/contexts/BandProvider';
import { useSongs } from '@/contexts/SongProvider';
import { PageLayout } from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SongFeatures } from '@/components/songs/Features/SongFeatures';
import { SongDocuments } from '@/components/songs/Features/SongDocuments';
import { updateBandSong } from '@/lib/services/firebase/songs';
import type { BandSong } from '@/lib/types/song';
import { toast } from 'react-hot-toast';

export default function SongDetailPage() {
    const params = useParams();
    const { activeBand } = useBand();
    const { user } = useAuth();
    const { songs, isLoading } = useSongs();
    const song = songs.find((s) => s.id === params?.songId) || null;
    const [activeTab, setActiveTab] = useState('features');

    // ✅ Ensure `handleUpdateSong` matches expected signature
    const handleUpdateSong = async (updates: Partial<BandSong>): Promise<boolean> => {
        if (!song?.id || !activeBand?.id) {
          console.error("Missing required IDs");
          toast.error("Error: Missing required data");
          return false;
        }
      
        try {
          await updateBandSong(activeBand.id, song.id, updates); // Add bandId
          toast.success('Song updated successfully!');
          return true;
        } catch (error) {
          console.error('Error updating song:', error);
          toast.error('Failed to update song.');
          return false;
        }
      };

    if (!song && !isLoading) {
        return (
            <PageLayout title="Song Details">
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                    <div className="text-red-500">Song not found</div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title={song?.title || 'Song Details'}>
            <div className="min-h-screen bg-gray-900">
                <div className="px-4 py-4 border-b border-gray-800">
                    <Link
                        href={`/bands/${activeBand?.id}/songs`}
                        className="inline-flex items-center text-gray-400 hover:text-white mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Songs
                    </Link>
                </div>

                <div className="p-4">
                    <Tabs
                        defaultValue="features"
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="features">Features</TabsTrigger>
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                        </TabsList>

                        <TabsContent value="features" className="mt-4">
                            <SongFeatures song={song} isLoading={isLoading} onUpdate={handleUpdateSong} />
                        </TabsContent>

                        <TabsContent value="documents" className="mt-4">
                            <SongDocuments song={song} isLoading={isLoading} onUpdate={handleUpdateSong} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </PageLayout>
    );
}
