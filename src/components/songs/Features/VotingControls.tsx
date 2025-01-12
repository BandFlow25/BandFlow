// components/songs/SongCard/VotingControls.tsx
import { useState } from 'react';
import { Star, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VotingControlsProps {
  currentVote: number | null;
  onVote: (score: number) => void;
}

export function VotingControls({ currentVote, onVote }: VotingControlsProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Poo vote (0) */}
      <button
        onMouseEnter={() => setHoveredRating(0)}
        onMouseLeave={() => setHoveredRating(null)}
        onClick={() => onVote(0)}
        className={cn(
          "p-2 rounded-full border-2 transition-all duration-200",
          hoveredRating === 0 || currentVote === 0
            ? "border-orange-500 bg-orange-500/10 text-orange-500"
            : "border-gray-600 text-gray-400 hover:border-orange-500/50"
        )}
      >
        <ThumbsDown className="w-6 h-6" />
      </button>

      {/* Star ratings (1-5) */}
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          onMouseEnter={() => setHoveredRating(rating)}
          onMouseLeave={() => setHoveredRating(null)}
          onClick={() => onVote(rating)}
          className={cn(
            "p-1 rounded-full transition-all duration-200",
            (hoveredRating !== null && rating <= hoveredRating) || 
            (currentVote !== null && rating <= currentVote)
              ? "text-orange-500"
              : "text-gray-400"
          )}
        >
          <Star 
            className="w-6 h-6"
            fill={(hoveredRating !== null && rating <= hoveredRating) || 
                 (currentVote !== null && rating <= currentVote)
              ? "currentColor"
              : "none"}
          />
        </button>
      ))}
    </div>
  );
}