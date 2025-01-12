// components/songs/SetLists/EditableSetlistDetails.tsx
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock, ListMusic, Edit2, Check, X } from 'lucide-react';
import type { Setlist } from '@/lib/types/setlist';
import { updateSetlist } from '@/lib/services/firebase/setlists';

interface EditableSetlistDetailsProps {
  setlist: Setlist;
  bandId: string;
  onUpdate: () => void;
}

export function EditableSetlistDetails({
  setlist,
  bandId,
  onUpdate
}: EditableSetlistDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(setlist.name);
  const [numSets, setNumSets] = useState(setlist.format.numSets.toString());
  const [setDuration, setSetDuration] = useState(setlist.format.setDuration.toString());
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    try {
      await updateSetlist(bandId, setlist.id, {
        name,
        format: {
          numSets: parseInt(numSets),
          setDuration: parseInt(setDuration)
        }
      });
      onUpdate();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating setlist:', error);
    }
  };

  const handleCancel = () => {
    setName(setlist.name);
    setNumSets(setlist.format.numSets.toString());
    setSetDuration(setlist.format.setDuration.toString());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="space-y-4">
          <div>
            <Input
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xl font-semibold bg-gray-700 text-white border-orange-500"
              placeholder="Setlist name"
            />
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="flex-1 space-y-2">
              <label className="text-sm text-gray-400">Number of Sets</label>
              <Input
                type="number"
                min="1"
                value={numSets}
                onChange={(e) => setNumSets(e.target.value)}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm text-gray-400">Set Duration (minutes)</label>
              <Input
                type="number"
                min="1"
                value={setDuration}
                onChange={(e) => setSetDuration(e.target.value)}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="text-gray-400"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-orange-500 hover:bg-orange-400"
            >
              <Check className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white group-hover:text-orange-500">
            {setlist.name}
          </h2>
          <div className="flex items-center gap-4 mt-2 text-gray-400">
            <div className="flex items-center gap-1">
              <ListMusic className="w-4 h-4" />
              <span>{setlist.songs.length} songs</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>
                {setlist.format.numSets} sets, {setlist.format.setDuration}min each
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="text-gray-400 hover:text-white"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}