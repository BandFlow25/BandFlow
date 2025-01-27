'use client';

import { useEffect, useState } from 'react';
import GodModeGuard from '@/components/auth/GodModeGuard';
import { collection, getDocs} from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { Button } from '@/components/ui/button';
import { COLLECTIONS } from '@/lib/constants';
import { deleteBaseSongWithCascade } from '@/lib/services/firebase/songs';
import { toast } from 'react-hot-toast';

interface BandStats {
 id: string;
 name: string;
 songCount: number;
 members: Array<{ id: string; email: string; role: string }>;
}

interface BaseSong {
 id: string;
 title: string;
 artist: string;
 metadata?: {
   key?: string;
   bpm?: number;
 };
}

const GodModePage = () => {
 const [activeView, setActiveView] = useState<'bands' | 'songs' | 'metadata'>('bands');
 const [bandStats, setBandStats] = useState<BandStats[]>([]);
 const [baseSongs, setBaseSongs] = useState<BaseSong[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');

 const loadBandStats = async () => {
   const bandsSnapshot = await getDocs(collection(db, COLLECTIONS.BANDS));
   const stats: BandStats[] = [];

   for (const bandDoc of bandsSnapshot.docs) {
     const songsSnapshot = await getDocs(collection(bandDoc.ref, 'songs'));
     const membersSnapshot = await getDocs(collection(bandDoc.ref, 'members'));
     const members = membersSnapshot.docs.map(doc => ({
       id: doc.id,
       email: doc.data().email,
       role: doc.data().role
     }));

     stats.push({
       id: bandDoc.id,
       name: bandDoc.data().name,
       songCount: songsSnapshot.size,
       members
     });
   }

   setBandStats(stats);
   setIsLoading(false);
 };

 const loadBaseSongs = async () => {
   const songsSnapshot = await getDocs(collection(db, COLLECTIONS.BASE_SONGS));
   setBaseSongs(songsSnapshot.docs.map(doc => ({
     id: doc.id,
     ...doc.data()
   })) as BaseSong[]);
   setIsLoading(false);
 };

 const handleDelete = async (songId: string) => {
   try {
     await deleteBaseSongWithCascade(songId);
     setBaseSongs(prev => prev.filter(song => song.id !== songId));
     toast.success('Song deleted successfully');
   } catch (error) {
     console.error('Error deleting song:', error);
     toast.error('Failed to delete song');
   }
 };

 useEffect(() => {
   setIsLoading(true);
   if (activeView === 'bands') loadBandStats();
   if (activeView === 'songs') loadBaseSongs();
 }, [activeView]);

 return (
  <GodModeGuard>
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">GOD Mode</h1>
      
      <div className="flex gap-4 mb-8">
        <Button 
          onClick={() => setActiveView('bands')}
          variant={activeView === 'bands' ? 'default' : 'outline'}
        >
          Bands Overview
        </Button>
        <Button 
          onClick={() => setActiveView('songs')}
          variant={activeView === 'songs' ? 'default' : 'outline'}
        >
          Base Songs
        </Button>
        <Button 
          onClick={() => setActiveView('metadata')}
          variant={activeView === 'metadata' ? 'default' : 'outline'}
        >
          Metadata Worker
        </Button>
      </div>
 
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {activeView === 'bands' && (
            <div className="space-y-6">
              {bandStats.map(band => (
                <div key={band.id} className="bg-gray-800 p-4 rounded-lg">
                  <h2 className="text-xl font-medium mb-2">{band.name}</h2>
                  <div className="text-sm text-gray-400 mb-4">
                    {band.songCount} songs
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {band.members.map(member => (
                      <div key={member.id} className="text-sm">
                        <div className="text-gray-300">{member.email}</div>
                        <div className="text-gray-500">{member.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
 
          {activeView === 'songs' && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder=""
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 rounded-lg px-4 py-2 text-gray-100 border border-gray-700"
              />
              <div className="space-y-2">
                {baseSongs
                  .filter(song => 
                    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .sort((a, b) => a.title.localeCompare(b.title))
                  .map(song => (
                    <div key={song.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-medium">{song.title}</div>
                        <div className="text-sm text-gray-400">{song.artist}</div>
                        <div className="text-xs text-gray-500">
                          Key: {song.metadata?.key || 'N/A'} | 
                          BPM: {song.metadata?.bpm || 'N/A'}
                        </div>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => handleDelete(song.id)}
                        size="sm"
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}
 
          {activeView === 'metadata' && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-xl mb-4">Metadata Improvement Worker</h2>
              <p className="text-gray-400">Worker functionality coming soon...</p>
            </div>
          )}
        </>
      )}
    </div>
  </GodModeGuard>
 );
}

export default GodModePage;