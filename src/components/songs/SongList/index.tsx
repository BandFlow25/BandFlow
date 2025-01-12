// components/songs/SongList/index.tsx
import { useMemo, useState } from 'react';
import { useSongs } from '@/contexts/SongProvider';
import { 
  SONG_LIST_TYPES, 
  SONG_LIST_LABELS,
  STATUS_TO_LIST_TYPE,  // Add this import
  type SongListType,    // Change this from SongListTypeValue
  type BandSong 
} from '@/lib/types/song';
import { SongListContent } from './SongListContent';
import { SongListHeader } from './SongListHeader';
import { Filter as FilterIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';

// Move this outside the component
const calculateSongScore = (song: BandSong, memberCount: number): number => {
  if (!song.votes) return 0;
  const totalVotes = Object.values(song.votes).reduce((sum, vote) => sum + vote.value, 0);
  // Use votingMemberCount if available (for Review status), otherwise use current memberCount
  const maxPossibleScore = (song.votingMemberCount || memberCount) * 5;
  return (totalVotes / maxPossibleScore) * 100;
};

interface SongListProps {
  type: SongListType;
  showCount?: boolean;
}

export function SongList({ type, showCount = true }: SongListProps) {
  const { songs, isLoading, error, searchQuery, setSearchQuery } = useSongs();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { user } = useAuth();
  const { memberCount } = useBand();
  
  const filteredAndSortedSongs = useMemo(() => {
    let filtered = songs;

    // Apply status filters first
    if (type === 'all') {
      if (statusFilter) {
        filtered = songs.filter(song => song.status === statusFilter);
      } else {
        // For ALL type without status filter, exclude DISCARDED and PARKED
        filtered = songs.filter(song => 
          song.status !== 'DISCARDED' && song.status !== 'PARKED'
        );
      }
    } else {
      // For specific views, find the matching status using our mapping
      const statusForType = Object.entries(STATUS_TO_LIST_TYPE)
        .find(([_, listType]) => listType === type)?.[0];
      if (statusForType) {
        filtered = songs.filter(song => song.status === statusForType);
      }
    }
    
    // Apply search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(song =>
        song.title.toLowerCase().includes(search) ||
        song.artist.toLowerCase().includes(search)
      );
    }

    // Sort based on view type
    if (type === 'voting' && user) {
      return filtered.sort((a, b) => {
        const aVoted = !!a.votes?.[user.uid];
        const bVoted = !!b.votes?.[user.uid];
        
        if (aVoted === bVoted) {
          return 0;
        }
        return aVoted ? 1 : -1;
      });
    } else if (type === 'review') {
      return filtered.sort((a, b) => {
        const scoreA = calculateSongScore(a, memberCount);
        const scoreB = calculateSongScore(b, memberCount);
        return scoreB - scoreA; // Highest scores first
      });
    }

    return filtered;
  }, [songs, searchQuery, type, statusFilter, user, memberCount]);

  const handleSongDeleted = () => {
    // The SongsProvider will automatically refresh the list
    // through the Firestore realtime subscription
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-900 px-2 sm:px-4 pt-4">
      <div className="flex flex-col gap-4">
        <SongListHeader
          title={SONG_LIST_LABELS[type]}
          count={filteredAndSortedSongs.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        {/* Status filter for All Songs view */}
        {type === 'all' && (
          <div className="flex gap-2 items-center">
            <FilterIcon className="w-4 h-4 text-gray-400" />
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter(null)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm",
                  !statusFilter
                    ? "bg-orange-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                )}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('PARKED')}
                className={cn(
                  "px-3 py-1 rounded-full text-sm",
                  statusFilter === 'PARKED'
                    ? "bg-orange-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                )}
              >
                Parked
              </button>
              <button
                onClick={() => setStatusFilter('DISCARDED')}
                className={cn(
                  "px-3 py-1 rounded-full text-sm",
                  statusFilter === 'DISCARDED'
                    ? "bg-orange-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                )}
              >
                Discarded
              </button>
            </div>
          </div>
        )}
      </div>
  
      <div className="flex-1 overflow-y-auto min-h-0 mt-4">
        <SongListContent
          songs={filteredAndSortedSongs}
          isLoading={isLoading}
          error={error}
          listType={type}
          onSongDeleted={handleSongDeleted}
        />
      </div>
    </div>
  );
}