import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DurationtoMinSec } from '@/lib/services/bandflowhelpers/SetListHelpers';
import type { BandSong } from '@/lib/types/song';
import { SONG_STATUS } from '@/lib/types/song';
import { useSwipeable } from 'react-swipeable';

interface SetlistSongCardProps {
  id: string;
  songDetails: BandSong | undefined;
  position: number;
  setNumber: number;
  isLoading?: boolean;
  onRemove?: () => void;
}

export function SetlistSongCard({
  id,
  songDetails,
  position,
  setNumber,
 // isLoading,
  onRemove
}: SetlistSongCardProps) {

  const [showConfirm, setShowConfirm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [swipeAmount, setSwipeAmount] = useState(0);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, data: { setNumber } });

  // const style = {
  //   transform: CSS.Transform.toString(transform),
  //   transition,
  //   ...swipeAmount ? {
  //     transform: `translateX(${swipeAmount}px)`,
  //     transition: swipeAmount ? 'none' : 'transform 0.2s ease'
  //   } : {}
  // };

  const isNotPlaybook = songDetails?.status !== SONG_STATUS.PLAYBOOK;

  const swipeHandlers = useSwipeable({
    onSwiping: ({ deltaX }) => {
      if (deltaX < 0) { // Only allow left swipe
        setSwipeAmount(Math.max(deltaX, -75));
      }
    },
    onSwipedLeft: ({ deltaX }) => {
      if (Math.abs(deltaX) > 50) {
        setShowConfirm(true);
      }
      setSwipeAmount(0);
    },
    onSwipedRight: () => {
      setSwipeAmount(0);
    },
    trackMouse: true,
    preventScrollOnSwipe: true
  });

  const combinedRef = (node: HTMLElement | null) => {
    setNodeRef(node);
    swipeHandlers.ref(node);
  };

  return (
    <div
      ref={combinedRef}
      {...attributes}
      {...listeners}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        ...swipeAmount ? {
          transform: `translateX(${swipeAmount}px)`,
          transition: swipeAmount ? 'none' : 'transform 0.2s ease'
        } : {}
      }}
    >
     <div
  className={`
    group
    relative
    bg-gray-800
    py-2 
    px-3
    rounded-lg
    flex 
    items-center 
    justify-between
    border
    border-gray-700
    transition-all
    duration-200
    ease-in-out
    ${isNotPlaybook ? 'border-yellow-500/30' : ''}
    ${isDragging ? 'opacity-50 z-10 scale-105 shadow-xl' : ''}
    hover:bg-gray-700/90
    hover:border-gray-600
    hover:scale-[1.01]
    select-none
    cursor-grab active:cursor-grabbing
    touch-manipulation
    ${Math.abs(swipeAmount) > 0 ? 'bg-red-500/10' : ''}
    shadow-sm
  `}
      >



        {isNotPlaybook && (
          <div className="absolute -left-1 top-1/2 -translate-y-1/2">
            <div className="bg-yellow-500/20 text-yellow-500 p-1 rounded-full">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        )}

        {(isHovered || Math.abs(swipeAmount) > 0) && onRemove && (
          <button
            onClick={() => setShowConfirm(true)}
            className="absolute -right-2 -top-2 p-1 bg-red-500 rounded-full 
              text-white opacity-100 hover:bg-red-600 focus:outline-none 
              focus:ring-2 ring-offset-2 ring-red-500 transform 
              hover:scale-110 z-10"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        <div className="flex items-center justify-between gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className={`
              text-gray-400 w-6 flex-shrink-0 font-medium
              ${isNotPlaybook ? 'text-yellow-500/70' : ''}
            `}>
              {position}
            </span>
            <div className="text-white truncate font-medium">
              {songDetails?.title || 'Loading...'}
            </div>
          </div>
          <span className="text-gray-400 flex-shrink-0 ml-auto font-mono">
            {songDetails?.metadata?.duration
              ? DurationtoMinSec(parseInt(songDetails.metadata.duration))
              : '-'}
          </span>
        </div>
      </div>

  
      {showConfirm && (
        <div className="absolute inset-0 flex items-center justify-end bg-red-500/90 rounded-lg px-2 z-50">
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
                if (onRemove) onRemove();
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