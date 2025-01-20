import { useState } from 'react';
import { Music, Play, MoreVertical, ListMusic } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BandSong, SongStatus, RAGStatus } from '@/lib/types/song';
import { usePlayerContext } from "@/contexts/PlayerContext";
import { RagPlayBookStrip } from '@/components/songs/Features/RagPlayBookStrip';
import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import { SongMetadataModal } from '@/components/songs/Modals/SongMetadataModal';
import { SongActionsModal } from '@/components/songs/Modals/SongActionsModal';
import { updateSongStatus, updateRagStatus } from '@/lib/services/firebase/songs';

interface PlayBookSongCardProps {
  song: BandSong;
  isSelected?: boolean;
  onSelect?: (song: BandSong) => void;
  selectionOrder?: number;
  isSelectionMode?: boolean;
  className?: string;
}

export function PlayBookSongCard({
  song,
  className,
  isSelected = false,
  onSelect,
  selectionOrder,
  isSelectionMode = false,
}: PlayBookSongCardProps) {
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const { setCurrentSong, setIsPlaying } = usePlayerContext();
  const { user } = useAuth();
  const { activeBand, isAdmin, memberCount } = useBand();

  const handleStatusChange = async (newStatus: SongStatus) => {
    if (!user || !activeBand?.id) return;
    try {
      await updateSongStatus(activeBand.id, song.id, user.uid, newStatus);
      setIsActionsOpen(false);
    } catch (error) {
      console.error('Error updating song status:', error);
    }
  };

  const handleRagStatusUpdate = async (status: RAGStatus) => {
    if (!user || !activeBand?.id) return;
    try {
      await updateRagStatus(activeBand.id, song.id, user.uid, status);
      setIsActionsOpen(false);
    } catch (error) {
      console.error('Error updating RAG status:', error);
    }
  };

  return (
    <div className="relative">
      <div
        onClick={(e) => {
          // Ignore clicks on the thumbnail area or metadata button
          if (!(e.target as HTMLElement).closest('.thumbnail-area') && 
              !(e.target as HTMLElement).closest('.metadata-button')) {
            if (isSelectionMode) {
              onSelect?.(song);
            } else {
              setIsActionsOpen(true);
            }
          }
        }}
        className={cn(
          "group relative flex items-center gap-2 p-2 rounded-md",
          isSelected 
            ? "bg-orange-500/20 ring-1 ring-orange-500/50" 
            : "bg-gray-800/40 hover:bg-gray-800/60",
          isSelectionMode && "cursor-pointer active:scale-[0.98]",
          "transition-all duration-300 ease-in-out transform hover:shadow-lg",
          className
        )}
      >
        {/* Selection Indicator - Moved inside to avoid overflow issues */}
        {isSelectionMode && (
          <div className={cn(
            "min-w-[24px] h-6 rounded-full border-2 flex items-center justify-center transition-all",
            isSelected 
              ? "bg-orange-500 border-orange-500" 
              : "border-gray-600"
          )}>
            {isSelected && (
              <span className="text-xs font-medium text-white">
                {selectionOrder !== undefined ? selectionOrder + 1 : '✓'}
              </span>
            )}
          </div>
        )}

        {/* RAG Status Strip */}
        <RagPlayBookStrip song={song} />

        {/* Thumbnail with Play Overlay */}
        <div className="relative min-w-[40px] h-[40px] thumbnail-area">
          {song.thumbnail ? (
            <img
              src={song.thumbnail}
              alt={song.title}
              className="w-10 h-10 rounded-md object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-md bg-gray-700/50 flex items-center justify-center">
              <Music className="w-5 h-5 text-gray-400" />
            </div>
          )}
          {!isSelectionMode && (
            <button
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSong(song);
                setIsPlaying(true);
              }}
            >
              <Play className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Title and Artist Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{song.title}</h3>
          <p className="text-sm text-gray-400 truncate">{song.artist}</p>
        </div>

        {/* Action Buttons */}
        {!isSelectionMode && (
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMetadataOpen(true);
              }}
              className="p-1.5 hover:bg-gray-700 rounded-full metadata-button"
            >
              <ListMusic className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsActionsOpen(true);
              }}
              className="p-1.5 hover:bg-gray-700 rounded-full"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <SongMetadataModal
        song={song}
        isOpen={isMetadataOpen}
        onClose={() => setIsMetadataOpen(false)}
        context="playbook"
      />

      <SongActionsModal
        song={song}
        isOpen={isActionsOpen}
        onClose={() => setIsActionsOpen(false)}
        onStatusChange={handleStatusChange}
        onRagStatusUpdate={handleRagStatusUpdate}
        onVote={() => {}} // No voting in PlayBook mode
        currentRagStatus={song.ragStatus?.[user?.uid ?? '']?.status ?? null}
        currentVote={null} // No votes in PlayBook mode
        memberCount={memberCount}
        voteCount={0} // No votes in PlayBook mode
      />
    </div>
  );
}