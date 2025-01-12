// components/songs/PlayBook/PlayBookSongCard/index.tsx
import { useState } from 'react';
import { Music, Play, ArrowLeftCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BandSong } from '@/lib/types/song';
import { usePlayerContext } from "@/contexts/PlayerContext";
import { MetadataDisplay } from '@/components/songs/Features/MetadataDisplay';
import { RagPlayBookStrip } from '@/components/songs/Features/RagPlayBookStrip';
import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import { updateSongStatus } from '@/lib/services/firebase/songs';

interface PlayBookSongCardProps {
  song: BandSong;
  className?: string;
  isSelected?: boolean;
  onSelect?: (song: BandSong) => void;
  isSelectionMode?: boolean;
  onStatusChange?: () => void;
}

export function PlayBookSongCard({
  song,
  className,
  isSelected = false,
  onSelect,
  isSelectionMode = false,
  onStatusChange
}: PlayBookSongCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { setCurrentSong, setIsPlaying } = usePlayerContext();
  const { user } = useAuth();
  const { isAdmin } = useBand();

  const handleMoveBack = async () => {
    if (!user || !isAdmin) return;
    
    try {
      await updateSongStatus(song.id, user.uid, 'PRACTICE');
      onStatusChange?.();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error moving song back to practice:', error);
    }
  };

  return (
    <div
      onClick={() => isSelectionMode && onSelect?.(song)}
      className={cn(
        "group relative flex items-center gap-2 p-2 rounded-md",
        isSelected ? "bg-orange-500/20" : "bg-gray-800/40 hover:bg-gray-800/60",
        isSelectionMode && "cursor-pointer",
        "transition-all duration-300 ease-in-out transform hover:shadow-lg",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsMenuOpen(false);
      }}
    >
      {/* Selection Indicator */}
      {isSelectionMode && (
        <div className={cn(
          "absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center",
          isSelected 
            ? "border-orange-500 bg-orange-500"
            : "border-gray-600"
        )}>
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      )}

      {/* RAG Status Strip */}
      <RagPlayBookStrip song={song} />

      {/* Thumbnail with Play Overlay */}
      <div className={cn(
        "relative min-w-[48px] h-[48px] transition-transform duration-200 ease-in-out group-hover:scale-105",
        isSelectionMode && "ml-6" // Add margin when in selection mode
      )}>
        {song.thumbnail ? (
          <img
            src={song.thumbnail}
            alt={song.title}
            className="w-12 h-12 rounded-md object-cover transition-opacity duration-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-md bg-gray-700/50 flex items-center justify-center transition-colors duration-200">
            <Music className="w-6 h-6 text-gray-400" />
          </div>
        )}

        {!isSelectionMode && (
          <button
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out transform hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentSong(song);
              setIsPlaying(true);
            }}
          >
            <Play className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Title and Artist Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white truncate text-sm">{song.title}</h3>
        <p className="text-xs text-gray-400 truncate">{song.artist}</p>
      </div>

      {/* Right Side Content */}
      {!isSelectionMode && (
        <div className="flex items-center gap-4">
          <MetadataDisplay song={song} className="text-xs" />
          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors"
              title="Move back to Practice"
            >
              <ArrowLeftCircle className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      )}

      {/* Menu Overlay */}
      {isMenuOpen && isAdmin && !isSelectionMode && (
        <div className={cn(
          "absolute inset-0 bg-gray-800/95 rounded-md p-4",
          "flex items-center justify-center",
          "transform transition-all duration-200 ease-in-out",
          "animate-in fade-in zoom-in-95 duration-200"
        )}>
          <button
            onClick={handleMoveBack}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg"
          >
            <ArrowLeftCircle className="w-5 h-5" />
            Move Back to Practice
          </button>
        </div>
      )}
    </div>
  );
}