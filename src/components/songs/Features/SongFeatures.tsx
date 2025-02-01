'use client';

import { useState } from 'react';
import { useBand } from '@/contexts/BandProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Clock, Activity, Music2 } from 'lucide-react';
import type { BandSong } from '@/lib/types/song';
import { toast } from 'react-hot-toast';
import { serverTimestamp, Timestamp } from 'firebase/firestore';
import { DurationInput } from '@/components/ui/DurationInput';

interface SongFeaturesProps {
    song: BandSong | null;
    isLoading: boolean;
    onUpdate: (updates: Partial<BandSong>) => Promise<boolean>;
}

export function SongFeatures({ song, isLoading, onUpdate }: SongFeaturesProps) {
    const { activeBand } = useBand();
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);

    const [editForm, setEditForm] = useState({
        localTitle: song?.localTitle !== undefined ? song.localTitle : song?.title || '',
        bpm: song?.metadata?.bpm?.toString() || '',
        key: song?.metadata?.key || '',
        duration: song?.metadata?.duration || '00:00',
        personalNote: song?.songNotes?.[user?.uid || '']?.personal || '',
        bandNote: song?.songNotes?.[user?.uid || '']?.band || '',
        songStructure: song?.songStructure || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBand?.id || !song || !user?.uid) return;

        try {
            const updates: Partial<BandSong> = {
                localTitle: editForm.localTitle !== '' ? editForm.localTitle : undefined,
                songStructure: editForm.songStructure,
                metadata: {
                    bpm: editForm.bpm !== '' ? parseInt(editForm.bpm) : song.metadata?.bpm ?? 0,
                    key: editForm.key !== '' ? editForm.key : song.metadata?.key ?? '',
                    duration: editForm.duration,
                },
            };

            console.log('🔥 Firebase Update Payload:', { songId: song.id, updates });

            const success = await onUpdate(updates);
            if (success) {
                toast.success('Song details updated');
                setIsEditing(false);
            } else {
                toast.error('Update failed.');
            }
        } catch (error) {
            console.error('❌ Error updating song:', error);
            toast.error('Failed to update song details');
        }
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Fixed Header */}
            <div className="bg-gray-900 p-4">
                <h2 className="text-lg font-bold text-white">Song Features</h2>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title Section */}
                    <div className="bg-gray-800 p-4 rounded-lg space-y-4">
                        <h3 className="text-sm font-medium text-gray-300">Title</h3>
                        {isEditing ? (
                            <Input
                                value={editForm.localTitle}
                                onChange={(e) => setEditForm(prev => ({ ...prev, localTitle: e.target.value }))}
                                className="bg-gray-700 border-gray-600"
                                placeholder={song?.title}
                            />
                        ) : (
                            <div className="text-lg font-medium text-white">
                                {song?.localTitle || song?.title}
                            </div>
                        )}
                    </div>

                    {/* Metadata Section */}
                    <div className="bg-gray-800 p-4 rounded-lg space-y-4">
                        <h3 className="text-sm font-medium text-gray-300">Song Features</h3>
                        <div className="space-y-4">
                            {/* BPM */}
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    BPM
                                </span>
                                {isEditing ? (
                                    <Input
                                        value={editForm.bpm}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, bpm: e.target.value }))}
                                        className="bg-gray-700 border-gray-600 w-32"
                                    />
                                ) : (
                                    <span>{song?.metadata?.bpm || '-'}</span>
                                )}
                            </div>

                            {/* Key */}
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 flex items-center gap-2">
                                    <Music2 className="w-4 h-4" />
                                    Key
                                </span>
                                {isEditing ? (
                                    <Input
                                        value={editForm.key}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, key: e.target.value }))}
                                        className="bg-gray-700 border-gray-600 w-32"
                                    />
                                ) : (
                                    <span>{song?.metadata?.key || '-'}</span>
                                )}
                            </div>

                            {/* Duration */}
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Duration
                                </span>
                                {isEditing ? (
                                    <DurationInput
                                        value={editForm.duration}
                                        onChange={(newDuration) =>
                                            setEditForm((prev) => ({ ...prev, duration: newDuration }))
                                        }
                                        
                                    />
                                ) : (
                                    <span>{song?.metadata?.duration || '-'}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Song Structure Section */}
                    <div className="bg-gray-800 p-4 rounded-lg space-y-4">
                        <h3 className="text-sm font-medium text-gray-300">Song Structure</h3>
                        {isEditing ? (
                            <Textarea
                                value={editForm.songStructure}
                                onChange={(e) => setEditForm(prev => ({ ...prev, songStructure: e.target.value }))}
                                className="bg-gray-700 text-white border-gray-600 w-full h-48 p-2 rounded"
                                rows={8}
                            />
                        ) : (
                            <pre className="bg-gray-800 text-white p-4 rounded whitespace-pre-wrap">{song?.songStructure || 'No structure available'}</pre>
                        )}
                    </div>
                </form>
            </div>

            {/* Fixed Footer Buttons */}
            <div className="bg-gray-900 p-4 fixed bottom-0 left-0 right-0 z-50">
                <div className="flex justify-end gap-2">
                    {isEditing ? (
                        <>
                            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-orange-500 hover:bg-orange-600" onClick={handleSubmit}>
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <Button type="button" onClick={() => setIsEditing(true)} className="bg-orange-500 hover:bg-orange-600">
                            Edit Details
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}