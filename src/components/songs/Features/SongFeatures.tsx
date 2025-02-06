//src/components/songs/Features/SongFeatures.tsx
'use client';

import { useState } from 'react';
import { Clock, Activity, Music2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DurationInput } from '@/components/ui/DurationInput';
import type { BandSong } from '@/lib/types/song';

interface SongFeaturesProps {
  song: BandSong | null;
  isLoading: boolean;
  onUpdate: (updates: Partial<BandSong>) => Promise<boolean>;
  isEditing: boolean;
}

export function SongFeatures({ song, isLoading, onUpdate, isEditing }: SongFeaturesProps) {
  const [formData, setFormData] = useState({
    localTitle: song?.localTitle !== undefined ? song.localTitle : song?.title || '',
    bpm: song?.metadata?.bpm?.toString() || '',
    key: song?.metadata?.key || '',
    duration: song?.metadata?.duration || '00:00',
    songStructure: song?.songStructure || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!song) return;

    const updates: Partial<BandSong> = {
      localTitle: formData.localTitle !== '' ? formData.localTitle : undefined,
      songStructure: formData.songStructure,
      metadata: {
        ...(song.metadata || {}),
        ...(formData.bpm ? { bpm: parseInt(formData.bpm) } : {}),
        ...(formData.key ? { key: formData.key } : {}),
        duration: formData.duration
      }
    };

    await onUpdate(updates);
  };

  if (isLoading || !song) {
    return <div className="p-4 text-gray-400">Loading...</div>;
  }

  return (
    <form 
      id="song-edit-form"
      onSubmit={handleSubmit}
      className="space-y-6 p-4"
    >
      {/* Title Section */}
      <section className="bg-card border-4 border-border rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-medium text-foreground">Title</h3>
        {isEditing ? (
          <Input
            value={formData.localTitle}
            onChange={(e) => setFormData(prev => ({ ...prev, localTitle: e.target.value }))}
            className="bg-gray-700 border-gray-600"
            placeholder={song.title}
          />
        ) : (
          <div className="text-lg font-medium text-white">
            {song.localTitle || song.title}
          </div>
        )}
      </section>

      {/* Metadata Section */}
      <section className="bg-card border border-border rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-medium text-foreground">Song Features</h3>
        <div className="space-y-4">
          {/* BPM */}
          <div className="flex items-center justify-between">
            <span className="text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              BPM
            </span>
            {isEditing ? (
              <Input
                type="number"
                value={formData.bpm}
                onChange={(e) => setFormData(prev => ({ ...prev, bpm: e.target.value }))}
                className="bg-gray-700 border-gray-600 w-32"
              />
            ) : (
              <span className="text-foreground">{song.metadata?.bpm || '-'}</span>
            )}
          </div>

          {/* Key */}
          <div className="flex items-center justify-between">
            <span className="text-foreground flex items-center gap-2">
              <Music2 className="w-4 h-4" />
              Key
            </span>
            {isEditing ? (
              <Input
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                className="bg-gray-700 border-gray-600 w-32"
              />
            ) : (
              <span className="text-foreground">{song.metadata?.key || '-'}</span>
            )}
          </div>

          {/* Duration */}
          <div className="flex items-center justify-between">
            <span className="text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duration
            </span>
            {isEditing ? (
              <DurationInput
                value={formData.duration}
                onChange={(newDuration) => setFormData(prev => ({ ...prev, duration: newDuration }))}
              />
            ) : (
              <span className="text-foreground">{song.metadata?.duration || '-'}</span>
            )}
          </div>
        </div>
      </section>

      {/* Song Structure Section */}
      <section className="bg-card border border-border rounded-lg p-4 space-y-4">
        <h3 className="text-foreground font-medium text-gray-300">Song Structure</h3>
        {isEditing ? (
          <Textarea
            value={formData.songStructure}
            onChange={(e) => setFormData(prev => ({ ...prev, songStructure: e.target.value }))}
            className="bg-gray-700 text-white border-gray-600 w-full h-48 p-2 rounded"
            rows={8}
          />
        ) : (
          <pre className="bg-card border border-border rounded whitespace-pre-wrap">
            {song.songStructure || 'No structure available'}
          </pre>
        )}
      </section>
    </form>
  );
}