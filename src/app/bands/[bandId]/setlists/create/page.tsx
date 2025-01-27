// src/app/bands/[bandId]/setlists/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBand } from '@/contexts/BandProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createSetlist } from '@/lib/services/firebase/setlists';
import { useAuth } from '@/contexts/AuthProvider';
import { toast } from 'react-hot-toast';

export default function CreateSetlistPage() {
  const router = useRouter();
  const { activeBand } = useBand();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    numSets: 2,
    setDuration: 45
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeBand) return;

    setIsSubmitting(true);
    try {
      const setlistId = await createSetlist(
        activeBand.id,
        user.uid,
        formData.name,
        {
          numSets: formData.numSets,
          setDuration: formData.setDuration
        }
      );

      toast.success('Setlist created');
      router.push(`/bands/${activeBand.id}/setlists/${setlistId}`);
    } catch (error) {
      console.error('Error creating setlist:', error);
      toast.error('Failed to create setlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push(`/bands/${activeBand?.id}/setlists`)}
          className="flex items-center text-gray-400 hover:text-white mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Setlists
        </button>

        <div className="bg-gray-800 rounded-lg p-6">
          <h1 className="text-xl font-semibold mb-6">Create New Setlist</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Setlist Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-gray-700 border-gray-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Number of Sets
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, numSets: Math.max(1, prev.numSets - 1) }))}
                    className="p-2 bg-gray-700 rounded-l hover:bg-gray-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <Input
                    type="number"
                    value={formData.numSets}
                    onChange={(e) => setFormData(prev => ({ ...prev, numSets: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="bg-gray-700 border-gray-600 rounded-none text-center"
                    min="1"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, numSets: prev.numSets + 1 }))}
                    className="p-2 bg-gray-700 rounded-r hover:bg-gray-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Set Duration (minutes)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, setDuration: Math.max(15, prev.setDuration - 5) }))}
                    className="p-2 bg-gray-700 rounded-l hover:bg-gray-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <Input
                    type="number"
                    value={formData.setDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, setDuration: Math.max(15, parseInt(e.target.value) || 15) }))}
                    className="bg-gray-700 border-gray-600 rounded-none text-center"
                    min="15"
                    step="5"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, setDuration: prev.setDuration + 5 }))}
                    className="p-2 bg-gray-700 rounded-r hover:bg-gray-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full bg-orange-500 hover:bg-orange-600",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? "Creating..." : "Create Setlist"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}