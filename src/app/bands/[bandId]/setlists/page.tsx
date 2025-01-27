// src/app/bands/[bandId]/setlists/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useBand } from '@/contexts/BandProvider';
import { PageLayout } from '@/components/layout/PageLayout';
import { getBandSetlists, deleteSetlist } from '@/lib/services/firebase/setlists';
import type { Setlist } from '@/lib/types/setlist';
import Link from 'next/link';
import { Plus, Calendar, Clock, MoreVertical, Copy, Trash2 } from 'lucide-react';
import { DurationtoMinSec } from '@/lib/services/bandflowhelpers/SetListHelpers';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'react-hot-toast';

function SetlistsContent() {
  const { activeBand, isReady } = useBand();
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [setlistToDelete, setSetlistToDelete] = useState<Setlist | null>(null);

  useEffect(() => {
    loadSetlists();
  }, [activeBand?.id]);

  const loadSetlists = async () => {
    if (!activeBand?.id) return;
    
    try {
      setIsLoading(true);
      const data = await getBandSetlists(activeBand.id);
      setSetlists(data);
    } catch (err) {
      console.error('Error loading setlists:', err);
      setError('Failed to load setlists');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (setlist: Setlist) => {
    setSetlistToDelete(setlist);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!setlistToDelete || !activeBand?.id) return;

    try {
      await deleteSetlist(activeBand.id, setlistToDelete.id);
      toast.success('Setlist deleted');
      loadSetlists();
    } catch (err) {
      toast.error('Failed to delete setlist');
    } finally {
      setIsDeleteDialogOpen(false);
      setSetlistToDelete(null);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <PageLayout title="Setlists">
      <div className="p-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Create New Card */}
          <Link
            href={`/bands/${activeBand?.id}/setlists/create`}
            className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors"
          >
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-medium">Create New Setlist</span>
              <p className="text-sm text-gray-400 text-center">
                Start with an empty setlist or create from your Play Book
              </p>
            </div>
          </Link>

          {/* Setlist Cards */}
          {setlists.map((setlist) => (
            <div
              key={setlist.id}
              className="bg-gray-800 rounded-lg overflow-hidden group relative"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-white truncate">
                    {setlist.name}
                  </h3>
                  <div className="relative">
                    <button className="p-1 hover:bg-gray-700 rounded">
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                    <div className="absolute right-0 top-8 bg-gray-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="w-full px-4 py-2 text-sm text-left text-white hover:bg-gray-600 flex items-center gap-2"
                        onClick={() => {/* Handle duplicate */}}
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </button>
                      <button 
                        className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-gray-600 flex items-center gap-2"
                        onClick={() => handleDeleteClick(setlist)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <Link href={`/bands/${activeBand?.id}/setlists/${setlist.id}`}>
                <div className="p-4 space-y-4">
                  {/* Set Summary */}
                  <div className="space-y-2">
                    {setlist.sets?.map((set, index) => {
                      if (set.id === 'extras') return null;
                      const totalDuration = set.songs?.reduce((total, song) => {
                        const songDetails = setlist.songDetails?.[song.songId];
                        return total + (songDetails?.metadata?.duration ? parseInt(songDetails.metadata.duration) : 0);
                      }, 0) || 0;
                      
                      return (
                        <div key={set.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{set.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">{set.songs.length} songs</span>
                            <span className="text-gray-400">
                              {DurationtoMinSec(totalDuration)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Info */}
                  <div className="pt-4 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(setlist.createdAt.toDate()).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{setlist.format.setDuration} mins/set</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Setlist</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{setlistToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageLayout>
  );
}

export default function SetlistsPage() {
  return (
      <SetlistsContent />
  );
}