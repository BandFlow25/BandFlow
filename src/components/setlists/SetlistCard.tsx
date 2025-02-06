// src/components/Setlists/SetlistCard.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MoreVertical, Copy, Trash2, Settings, AlertCircle, Plus, Minus } from 'lucide-react';
import { DurationtoMinSec, getSetDurationInfo } from '@/lib/services/bndyhelpers/SetListHelpers';
import type { Setlist, SetlistSet } from '@/lib/types/setlist';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { duplicateSetlist, updateSetlistMetadata } from '@/lib/services/firebase/setlists';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface SetlistCardProps {
  setlist: Setlist;
  bandId: string;
  onDelete: (setlist: Setlist) => void;
  onUpdate: () => void;
}

interface EditSetData {
  id: string;
  name: string;
  targetDuration: number;
}

interface EditFormData {
  name: string;
  sets: EditSetData[];
}

export function SetlistCard({ setlist, bandId, onDelete, onUpdate }: SetlistCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: setlist.name,
    sets: setlist.sets
      .filter(set => set.id !== 'extras')
      .map(set => ({
        id: set.id,
        name: set.name,
        targetDuration: set.targetDuration
      }))
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [nonPlaybookSongs, setStats] = useMemo(() => {
    const stats = setlist.sets.map(set => {
      const totalDuration = set.songs.reduce((total, song) => {
        const songDetails = setlist.songDetails?.[song.songId];
        if (!songDetails?.metadata?.duration) return total;
        return total + parseInt(songDetails.metadata.duration, 10);
      }, 0);

      const nonPlaybookCount = set.songs.filter(song => {
        const songDetails = setlist.songDetails?.[song.songId];
        return songDetails && songDetails.status !== 'PLAYBOOK';
      }).length;

      return {
        id: set.id,
        name: set.name,
        songCount: set.songs.length,
        duration: totalDuration,
        durationInfo: getSetDurationInfo(totalDuration, set.targetDuration),
        nonPlaybookCount
      };
    });

    const totalNonPlaybook = stats.reduce((total, set) => total + set.nonPlaybookCount, 0);
    return [totalNonPlaybook, stats] as const;
  }, [setlist.sets, setlist.songDetails]);

  const handleDuplicate = async () => {
    try {
      await duplicateSetlist(
        bandId, 
        setlist.id, 
        `${setlist.name} (Copy)`, 
        true
      );
      toast.success('Setlist duplicated');
      onUpdate();
    } catch (error) {
      console.error('Error duplicating setlist:', error);
      toast.error('Failed to duplicate setlist');
    }
    setShowMenu(false);
  };

  const addSet = () => {
    const newSetNumber = editFormData.sets.length + 1;
    setEditFormData(prev => ({
      ...prev,
      sets: [
        ...prev.sets,
        {
          id: `set-${newSetNumber}`,
          name: `Set ${newSetNumber}`,
          targetDuration: setlist.format.setDuration
        }
      ]
    }));
  };

  const removeSet = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      sets: prev.sets.filter((_, i) => i !== index)
    }));
  };

  const handleEditSubmit = async () => {
    try {
      // First update the basic metadata
      await updateSetlistMetadata(bandId, setlist.id, {
        name: editFormData.name,
        format: {
          ...setlist.format,
          numSets: editFormData.sets.length,
          setDuration: setlist.format.setDuration
        }
      });

      // Then update each set's duration
      for (const set of editFormData.sets) {
        await updateSetlistMetadata(bandId, setlist.id, {
          format: {
            ...setlist.format,
            setDuration: set.targetDuration
          }
        });
      }

      toast.success('Setlist updated');
      onUpdate();
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating setlist:', error);
      toast.error('Failed to update setlist');
    }
  };

  return (
    <div className={cn(
      "bg-gray-800 rounded-lg overflow-hidden relative",
      nonPlaybookSongs > 0 && "ring-1 ring-orange-500/50"
    )}>
      {/* Card Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-white truncate">{setlist.name}</h3>
            {nonPlaybookSongs > 0 && (
              <div className="flex items-center gap-1 text-orange-400 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>{nonPlaybookSongs} songs no longer in Play Book</span>
              </div>
            )}
          </div>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-gray-700 rounded-lg shadow-lg z-10">
                <button 
                  className="w-full px-4 py-2 text-sm text-left text-white hover:bg-gray-600 flex items-center gap-2"
                  onClick={() => {
                    setShowEditModal(true);
                    setShowMenu(false);
                  }}
                >
                  <Settings className="w-4 h-4" />
                  Edit Details
                </button>
                <button 
                  className="w-full px-4 py-2 text-sm text-left text-white hover:bg-gray-600 flex items-center gap-2"
                  onClick={handleDuplicate}
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button 
                  className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-gray-600 flex items-center gap-2"
                  onClick={() => {
                    onDelete(setlist);
                    setShowMenu(false);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <Link href={`/bands/${bandId}/setlists/${setlist.id}`}>
        <div className="p-4 space-y-4">
          {/* Set Summary */}
          <div className="space-y-2">
            {setStats.map((set) => {
              if (set.id === 'extras') return null;
              return (
                <div key={set.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    {set.name}
                    {set.nonPlaybookCount > 0 && (
                      <span className="text-orange-400 text-xs">
                        ({set.nonPlaybookCount} non-PB)
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{set.songCount} songs</span>
                    <span className={cn("text-sm", set.durationInfo.color)}>
                      {DurationtoMinSec(set.duration)}
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

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-gray-900 border border-gray-800">
          <DialogHeader>
            <DialogTitle>Edit Setlist Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Setlist Name
              </label>
              <Input 
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-200">Sets</label>
                <Button
                  onClick={addSet}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Set
                </Button>
              </div>
              
              <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                {editFormData.sets.map((set, index) => (
                  <div key={set.id} className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg">
                    <Input 
                      value={set.name}
                      onChange={(e) => {
                        const newSets = [...editFormData.sets];
                        newSets[index] = {
                          ...set,
                          name: e.target.value
                        };
                        setEditFormData(prev => ({
                          ...prev,
                          sets: newSets
                        }));
                      }}
                      className="bg-gray-700 border-gray-600 flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        value={set.targetDuration}
                        onChange={(e) => {
                          const newSets = [...editFormData.sets];
                          newSets[index] = {
                            ...set,
                            targetDuration: parseInt(e.target.value) || 0
                          };
                          setEditFormData(prev => ({
                            ...prev,
                            sets: newSets
                          }));
                        }}
                        className="bg-gray-700 border-gray-600 w-24"
                      />
                      <span className="text-sm text-gray-400 w-12">mins</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSet(index)}
                        className="text-red-400 hover:bg-red-500/20"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              className="bg-gray-800 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}