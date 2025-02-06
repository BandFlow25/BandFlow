//src\components\songs\Modals\SongMetadataModal.tsx
import { useRouter } from 'next/navigation';
import { 
  Clock, X, Activity, Music2, 
  Mic2, Guitar, Drum, Keyboard,
  ChevronRight, StickyNote
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BandSong } from '@/lib/types/song';
import { DurationtoMinSec } from '@/lib/services/bndyhelpers/SetListHelpers';
import { useBand } from '@/contexts/BandProvider';

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
}: SongMetadataModalProps) {
  const router = useRouter();
  const { activeBand } = useBand();

  // Will be driven by actual data in full implementation
  const documentTypes = {
    lyrics: true,
    guitar: false,
    drums: true,
    keys: false
  };

  const hasNotes = true; // Will be from actual data
  const hasBandNotes = true; // Will be from actual data

  const goToSongDetails = () => {
    router.push(`/bands/${activeBand?.id}/songs/${song.id}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900">
        {/* Close Button (X) in Top Right */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{song.title}</DialogTitle>
          <p className="text-sm text-gray-400">{song.artist}</p>
        </DialogHeader>

        {/* Song Features Section */}
        <div className="space-y-4 py-4">
          <h3 className="text-sm font-medium text-gray-300">Song Features</h3>
          <div className="space-y-2">
            {/* Duration */}
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

            {/* BPM */}
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                BPM
              </span>
              <span>{song.metadata?.bpm ? `${song.metadata.bpm} bpm` : '-'}</span>
            </div>

            {/* Key */}
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400 flex items-center gap-2">
                <Music2 className="w-4 h-4" />
                Key
              </span>
              <span>{song.metadata?.key || '-'}</span>
            </div>
          </div>
        </div>

        {/* Available Documents Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300">Available Resources</h3>
          <div className="flex flex-wrap gap-2">
            {documentTypes.lyrics && (
              <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-lg">
                <Mic2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">Lyrics</span>
              </div>
            )}
            {documentTypes.guitar && (
              <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-lg">
                <Guitar className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Guitar</span>
              </div>
            )}
            {documentTypes.drums && (
              <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-lg">
                <Drum className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-300">Drums</span>
              </div>
            )}
            {documentTypes.keys && (
              <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-lg">
                <Keyboard className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">Keys</span>
              </div>
            )}
            {hasNotes && (
              <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-lg">
                <StickyNote className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-gray-300">Notes</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes Preview  TODO - Implement these*/}
        {(hasNotes || hasBandNotes) && (
          <div className="space-y-4 mt-4">
            <h3 className="text-sm font-medium text-gray-300">Notes</h3>
            {hasBandNotes && (
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-xs text-orange-400 mb-1">Band Note</div>
                <p className="text-sm text-gray-300">NULL</p>
              </div>
            )}
            {hasNotes && (
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-xs text-blue-400 mb-1">Personal Note</div>
                <p className="text-sm text-gray-300">NULL</p>
              </div>
            )}
          </div>
        )}

        {/* View Full Details Button */}
        <Button 
          onClick={goToSongDetails}
          className="w-full mt-4 bg-orange-500 hover:bg-orange-600"
        >
          <span>View Full Details</span>
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}