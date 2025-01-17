// components/songs/SongList/index.tsx
import { useMemo, useState } from 'react';
import { useSongs } from '@/contexts/SongProvider';
import { SearchHeader } from 'src/components/songs/Shared/SearchHeader';
import { Filter as FilterIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SongListContent } from './SongListContent';
import { useAuth } from '@/contexts/AuthProvider';
import { 
  SONG_LIST_TYPES,  
  SONG_STATUS,
  SONG_LIST_LABELS,
  type SongListType
} from '@/lib/types/song';

interface SongListProps {
  type: SongListType;
}

export function SongList({ type }: SongListProps) {
  const { songs, isLoading, error, searchQuery, setSearchQuery } = useSongs();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  const filteredAndSortedSongs = useMemo(() => {
    let filtered = songs;

    // First apply type-specific filtering
    switch(type) {
      case SONG_LIST_TYPES.ALL:
        // First, filter out all PLAYBOOK songs
        filtered = songs.filter(song => song.status !== SONG_STATUS.PLAYBOOK);
        
        // Then apply status filter if present
        if (statusFilter) {
          filtered = filtered.filter(song => song.status === statusFilter);
        } else {
          // If no status filter, show all active songs (not parked or discarded)
          filtered = filtered.filter(song => 
            song.status !== SONG_STATUS.DISCARDED && 
            song.status !== SONG_STATUS.PARKED
          );
        }
        break;

      case SONG_LIST_TYPES.SUGGESTIONS:
        filtered = songs
          .filter(song => song.status === SONG_STATUS.SUGGESTED)
          .sort((a, b) => a.createdAt.seconds - b.createdAt.seconds); // Oldest first
        break;

        case SONG_LIST_TYPES.VOTING:
          filtered = songs
            .filter(song => song.status === SONG_STATUS.VOTING)
            .sort((a, b) => {
              // We should always have a user at this point, but let's be safe
              if (!user?.uid) return 0;
              
              const aVoted = Boolean(a.votes?.[user.uid]);
              const bVoted = Boolean(b.votes?.[user.uid]);
              if (!aVoted && bVoted) return -1;
              if (aVoted && !bVoted) return 1;
              return 0;
            });
          break;

      case SONG_LIST_TYPES.REVIEW:
        filtered = songs
          .filter(song => song.status === SONG_STATUS.REVIEW);
        break;

      case SONG_LIST_TYPES.PRACTICE:
        filtered = songs
          .filter(song => song.status === SONG_STATUS.PRACTICE);
        break;

      default:
        filtered = songs.filter(song => 
          song.status === Object.entries(SONG_LIST_TYPES)
            .find(([_, value]) => value === type)?.[0]
        );
        break;
    }
    
    // Then apply search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(song =>
        song.title.toLowerCase().includes(search) ||
        song.artist.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [songs, type, statusFilter, searchQuery, user?.uid]);

  const getPlaceholder = () => {
    return `Search ${SONG_LIST_LABELS[type]}...`;
  };

  return (
    <div className="flex flex-col">
      <SearchHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder={getPlaceholder()}
      >
        {type === SONG_LIST_TYPES.ALL && (
          <div className="flex gap-2 items-center mt-3">
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
                onClick={() => setStatusFilter(SONG_STATUS.PARKED)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm",
                  statusFilter === SONG_STATUS.PARKED
                    ? "bg-orange-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                )}
              >
                Parked
              </button>
              <button
                onClick={() => setStatusFilter(SONG_STATUS.DISCARDED)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm",
                  statusFilter === SONG_STATUS.DISCARDED
                    ? "bg-orange-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                )}
              >
                Discarded
              </button>
            </div>
          </div>
        )}
      </SearchHeader>

      <div className="flex-1 overflow-y-auto">
        <SongListContent
          songs={filteredAndSortedSongs}
          isLoading={isLoading}
          error={error}
          listType={type}
        />
      </div>
    </div>
  );
}