//src/components/songs/SetLists/CreateSetlistModal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Music } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import type { BandSong } from '@/lib/types/song';
import { createSetlist, updateSetlist } from '@/lib/services/firebase/setlists';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateSetlistModalProps {
  onClose: () => void;
  selectedSongs?: BandSong[];
  existingSetlist?: {
    id: string;
    name: string;
    format: {
      numSets: number;
      setDuration: number;
    };
  };
  onUpdate?: () => void;
}

export default function CreateSetlistModal({ 
  onClose, 
  selectedSongs = [],
  existingSetlist,
  onUpdate 
}: CreateSetlistModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { currentBandId } = useBand();
  
  const [name, setName] = useState(existingSetlist?.name || '');
  const [numberOfSets, setNumberOfSets] = useState(existingSetlist?.format.numSets || 2);
  const [durationPerSet, setDurationPerSet] = useState(existingSetlist?.format.setDuration || 45);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !currentBandId) {
      console.error("User or band ID is missing.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (existingSetlist) {
        // Update existing setlist
        await updateSetlist(currentBandId, existingSetlist.id, {
          name,
          format: {
            numSets: numberOfSets,
            setDuration: durationPerSet,
          }
        });
        onUpdate?.();
        onClose();
      } else {
        // Create new setlist
        const setlistId = await createSetlist(currentBandId, user.uid, {
          name,
          format: {
            numSets: numberOfSets,
            setDuration: durationPerSet,
          },
          songs: selectedSongs.map((song, index) => ({
            songId: song.id,
            setNumber: 1,
            position: index,
            isPlayBookActive: true,
          })),
        });

        onClose();
        router.push(`/bands/${currentBandId}/setlists/${setlistId}`);
      }
    } catch (error) {
      console.error(existingSetlist ? "Error updating setlist:" : "Error creating setlist:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-800 text-white border-gray-700">
        <DialogTitle>{existingSetlist ? 'Edit Setlist' : 'Create Setlist'}</DialogTitle>

        {!existingSetlist && selectedSongs.length > 0 && (
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                <span>{selectedSongs.length} songs selected</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Setlist Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Friday Night at Joe's"
              className="bg-gray-700 border-gray-600"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Number of Sets
              </label>
              <Input
                type="number"
                value={numberOfSets}
                onChange={(e) => setNumberOfSets(Number(e.target.value))}
                min="1"
                max="5"
                className="bg-gray-700 border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Minutes per Set
              </label>
              <Input
                type="number"
                value={durationPerSet}
                onChange={(e) => setDurationPerSet(Number(e.target.value))}
                min="15"
                max="180"
                className="bg-gray-700 border-gray-600"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-gray-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-400"
            >
              {isSubmitting ? (existingSetlist ? 'Saving...' : 'Creating...') : 
                (existingSetlist ? 'Save Changes' : 'Create Setlist')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}