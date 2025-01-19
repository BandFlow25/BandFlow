//src/components/songs/Features/RagPlayBookStrip.tsx
import { cn } from '@/lib/utils';
import type { BandSong } from '@/lib/types/song';
import { useBand } from '@/contexts/BandProvider';
import { useAuth } from '@/contexts/AuthProvider';

interface RagPlayBookStripProps {
  song: BandSong;
  className?: string;
}

export function RagPlayBookStrip({ song, className }: RagPlayBookStripProps) {
  const { memberCount } = useBand();
  const { user } = useAuth();
  const userIds = Object.keys(song.ragStatus || {});

  // Calculate strip height based on card height
  const stripHeight = 48; // Matches the thumbnail height
  const sectionHeight = stripHeight / memberCount;

  //"w-1.5 flex flex-col",  // Made strip slightly wider
  return (
    <div 
      className={cn(
        "w-1.5 flex flex-col rounded-l-md overflow-hidden",
        className
      )}
      style={{ height: `${stripHeight}px` }}
    >
      {Array.from({ length: memberCount }).map((_, index) => {
        const userId = userIds[index];
        const ragStatus = userId ? song.ragStatus?.[userId]?.status : null;
        const isCurrentUser = userId === user?.uid;
        
        return (
          <div
            key={userId || `empty-${index}`}
            style={{ height: `${sectionHeight}px` }}
            className={cn(
              "w-full transition-colors duration-200",
              {
                'bg-red-500': ragStatus === 'RED',
                'bg-yellow-500': ragStatus === 'AMBER',
                'bg-green-500': ragStatus === 'GREEN',
                'bg-gray-700': !ragStatus,
                'ring-1 ring-white/20': isCurrentUser
              }
            )}
            title={userId ? `${userId}: ${ragStatus?.toLowerCase() || 'not set'}` : 'Member not voted'}
          />
        );
      })}
    </div>
  );
}