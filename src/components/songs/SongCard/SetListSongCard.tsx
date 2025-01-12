// components/songs/SetLists/SetlistSongCard.tsx
import { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import type { BandSong } from '@/lib/types/song';
import { formatDuration, parseDuration } from '@/lib/utils/duration';
import { Button } from '@/components/ui/button';

interface SetlistSongCardProps {
  songDetails: BandSong | undefined;
  position: number;
  setNumber: number;
  onRemove: () => void;
}

export function SetlistSongCard({
  songDetails,
  position,
  onRemove
}: SetlistSongCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const touchStart = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches?.[0]) {
      touchStart.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || !e.touches?.[0]) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStart.current;
    
    if (diff > 0 && diff < 200) {
      setSwipeOffset(diff * 0.5); // Add resistance
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 75) {
      setShowConfirm(true);
    }
    setSwipeOffset(0);
    touchStart.current = null;
  };

  return (
    <div className="relative overflow-hidden">
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset ? 'none' : 'transform 0.2s ease'
        }}
        className="bg-gray-800/50 p-2 rounded flex items-center justify-between"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-gray-500 w-6 flex-shrink-0">{position}</span>
          <span className="text-white truncate">{songDetails?.title}</span>
        </div>
        <span className="text-gray-500 flex-shrink-0">
          {songDetails?.metadata?.duration
            ? formatDuration(parseDuration(songDetails.metadata.duration))
            : '--:--'}
        </span>
      </div>

      {showConfirm && (
        <div className="absolute inset-0 flex items-center justify-end bg-red-500/90 rounded px-2">
          <div className="flex items-center gap-2">
            <span className="text-white">Remove from set?</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="text-white hover:bg-red-600"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onRemove();
                setShowConfirm(false);
              }}
              className="text-white hover:bg-red-600"
            >
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}