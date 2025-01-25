// components/songs/Modals/SongMetadataModal.tsx
import { X, Clock, Activity, Music2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { BandSong } from '@/lib/types/song';
import { cn } from '@/lib/utils';
import { DurationtoMinSec } from '@/lib/services/bandflowhelpers/SetListHelpers';

interface SongMetadataModalProps {
  song: BandSong;
  isOpen: boolean;
  onClose: () => void;
  context?: 'songCard' | 'playlist' | 'playbook';
  className?: string;
}

export function SongMetadataModal({ 
  song, 
  isOpen, 
  onClose, 
  context = 'songCard',
  className 
}: SongMetadataModalProps) {
  // Helper to render basic metadata section
  const renderBasicMetadata = () => (
    
    <div className="space-y-3">
                <button onClick={onClose} className="absolute right-3 top-3 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
      <div className="flex items-center justify-between py-2 border-b border-gray-800">
        <span className="text-gray-400 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Duration
        </span>
        <span>
          {song.metadata?.duration 
            ? DurationtoMinSec(parseInt(song.metadata.duration, 10))
            : '-'}
        </span>
      </div>
      <div className="flex items-center justify-between py-2 border-b border-gray-800">
        <span className="text-gray-400 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          BPM
        </span>
        <span>{song.metadata?.bpm ? `${song.metadata.bpm} bpm` : '-'}</span>
      </div>
      <div className="flex items-center justify-between py-2 border-b border-gray-800">
        <span className="text-gray-400 flex items-center gap-2">
          <Music2 className="w-4 h-4" />
          Key
        </span>
        <span>{song.metadata?.key || '-'}</span>
      </div>
    </div>
  );

  // Additional metadata for playlist context
  const renderPlaylistMetadata = () => (
    <div className="mt-4 space-y-3">
      <h3 className="text-sm font-medium text-gray-300">Playlist Information</h3>
      {/* Add playlist-specific metadata here */}
    </div>
  );

  // Additional metadata for playbook context
  const renderPlaybookMetadata = () => (
    <div className="mt-4 space-y-3">
      <h3 className="text-sm font-medium text-gray-300">Play Book Details</h3>
      {/* Add playbook-specific metadata here */}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
     <DialogContent className="bg-gray-900 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {song.title}
          </DialogTitle>
          <p className="text-sm text-gray-400"><span>{song.artist}</span></p>
        </DialogHeader>

        {/* Basic metadata always shown */}
        {renderBasicMetadata()}

        {/* Context-specific additional metadata */}
        {context === 'playlist' && renderPlaylistMetadata()}
        {context === 'playbook' && renderPlaybookMetadata()}

      </DialogContent>
    </Dialog>
  );
}