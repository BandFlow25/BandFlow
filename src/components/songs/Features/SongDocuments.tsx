'use client';

import { useState, useRef } from 'react';
import { useBand } from '@/contexts/BandProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Mic2, Guitar, Drum, Keyboard, Upload, File, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { BandSong, SongDocument, DocumentType } from '@/lib/types/song';
import { serverTimestamp, Timestamp } from 'firebase/firestore';

interface SongDocumentsProps {
    song: BandSong | null;
    isLoading: boolean;
    onUpdate: (updates: Partial<BandSong>) => Promise<boolean>;
}

const documentTypes = [
    { id: 'lyrics' as DocumentType, icon: Mic2, label: 'Lyrics' },
    { id: 'guitar' as DocumentType, icon: Guitar, label: 'Guitar' },
    { id: 'drums' as DocumentType, icon: Drum, label: 'Drums' },
    { id: 'keys' as DocumentType, icon: Keyboard, label: 'Keys' }
] as const;

export function SongDocuments({ song, isLoading, onUpdate }: SongDocumentsProps) {
    const { activeBand } = useBand();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedType, setSelectedType] = useState<DocumentType>('lyrics');
    const [isPersonal, setIsPersonal] = useState(false);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !activeBand?.id || !user?.uid || !song) return;

        setIsUploading(true);
        try {
            // TODO: Implement file upload to Firebase Storage
            const uploadUrl = 'placeholder-url';

            const newDoc: SongDocument = {
                type: selectedType,
                url: uploadUrl,
                isPersonal,
                lastUpdated: serverTimestamp() as unknown as Timestamp
            };

            const updatedDocuments = {
                ...song.documents,
                [user.uid]: [...(song.documents?.[user.uid] || []), newDoc]
            };

            await onUpdate({ documents: updatedDocuments });

            toast.success('Document uploaded');
        } catch (error) {
            console.error('Error uploading document:', error);
            toast.error('Failed to upload document');
        } finally {
            setIsUploading(false);
            setSelectedType('lyrics');
            setIsPersonal(false);
        }
    };

    const handleRemoveDocument = async (userId: string, docIndex: number) => {
        if (!song || !activeBand?.id || !user?.uid) return;

        try {
            const updatedDocuments = { ...song.documents };
            if (updatedDocuments[userId]) {
                updatedDocuments[userId] = updatedDocuments[userId].filter((_, i) => i !== docIndex);
            }

            await onUpdate({ documents: updatedDocuments });

            toast.success('Document removed');
        } catch (error) {
            console.error('Error removing document:', error);
            toast.error('Failed to remove document');
        }
    };

    if (isLoading || !song) {
        return <div className="text-white">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-300 mb-4">Upload Document</h3>

                <div className="grid grid-cols-2 gap-2 mb-4">
                    {documentTypes.map(({ id, icon: Icon, label }) => (
                        <button
                            key={id}
                            onClick={() => setSelectedType(id)}
                            className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                                selectedType === id
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">{label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <Checkbox
                        id="isPersonal"
                        checked={isPersonal}
                        onCheckedChange={(checked) => setIsPersonal(!!checked)}
                    />
                    <label htmlFor="isPersonal" className="text-sm text-gray-300">
                        Personal Document
                    </label>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.txt,.doc,.docx,.jpg,.png"
                    className="hidden"
                />

                <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!selectedType || isUploading}
                    className="w-full bg-gray-700 hover:bg-gray-600"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload Document'}
                </Button>
            </div>

            {/* Documents List */}
            <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-300 mb-4">Your Documents</h3>

                {song.documents && Object.keys(song.documents).length > 0 ? (
                    <div className="space-y-2">
                        {Object.entries(song.documents).map(([userId, docs]) =>
                            docs.map((doc, index) => (
                                <div
                                    key={`${userId}-${index}`}
                                    className="flex items-center justify-between p-2 bg-gray-700 rounded-lg"
                                >
                                    <div className="flex items-center gap-2">
                                        <File className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-white">{doc.type}</span>
                                        {doc.isPersonal && (
                                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                                Personal
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveDocument(userId, index)}
                                        className="p-1 hover:bg-gray-600 rounded"
                                    >
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400">No documents uploaded</p>
                )}
            </div>
        </div>
    );
}
