// components/songs/SongList/index.tsx
import { useMemo, useState } from 'react';
import { useSongs } from '@/contexts/SongProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { cn } from '@/lib/utils';
import { useBand } from '@/contexts/BandProvider';
import {
  ListFilter,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle2,
  Trash2, AlertCircle
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import {
  SONG_STATUS,
  SONG_LIST_TYPES,
  type SongListType
} from '@/lib/types/song';
import { BaseSongCard } from '../SongCard/BaseSongCard';

interface CollapsibleSectionProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, count, isExpanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-800/50 rounded-lg group"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-300" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-300" />
        )}
        <span className="text-sm text-gray-300 group-hover:text-gray-200">{title}</span>
        <span className="text-xs text-gray-500 group-hover:text-gray-400">({count})</span>
      </button>
      <div
        className={cn(
          "space-y-1 overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function SongList({ type }: { type: SongListType }) {
  const { songs, isLoading, error, searchQuery, setSearchQuery } = useSongs();
  const { user } = useAuth();
  const [deleteMode, setDeleteMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { isAdmin, memberCount } = useBand();

  const [isPipelineExpanded, setIsPipelineExpanded] = useState(true);
  const [isParkedExpanded, setIsParkedExpanded] = useState(false);
  const [isDiscardedExpanded, setIsDiscardedExpanded] = useState(false);

  const { filteredSongs, parkedSongs, discardedSongs } = useMemo(() => {
    let filtered = songs;
    let parked: typeof songs = [];
    let discarded: typeof songs = [];

    switch (type) {
      case SONG_LIST_TYPES.SUGGESTIONS:
        // First get all suggested/review songs
        filtered = songs.filter(song =>
          song.status === SONG_STATUS.SUGGESTED ||
          song.status === SONG_STATUS.REVIEW
        );

        // Then apply filter
        if (statusFilter === 'NEEDS_VOTE') {
          filtered = filtered.filter(song =>
            song.status === SONG_STATUS.SUGGESTED &&
            user?.uid && !song.votes?.[user.uid]
          );
        } else if (statusFilter === SONG_STATUS.SUGGESTED) {
          filtered = filtered.filter(song =>
            song.status === SONG_STATUS.SUGGESTED &&
            user?.uid && song.votes?.[user.uid] && // User has voted
            Object.keys(song.votes || {}).length < memberCount // Not all votes in
          );
        } else if (statusFilter === SONG_STATUS.REVIEW) {
          filtered = filtered.filter(song => song.status === SONG_STATUS.REVIEW);
        }

        // Sort: unvoted suggested songs first
        filtered.sort((a, b) => {
          if (a.status === SONG_STATUS.SUGGESTED && user?.uid) {
            const aVoted = Boolean(a.votes?.[user.uid]);
            const bVoted = Boolean(b.votes?.[user.uid]);
            if (!aVoted && bVoted) return -1;
            if (aVoted && !bVoted) return 1;
          }
          return 0;
        });
        break;

      case SONG_LIST_TYPES.PRACTICE:
        filtered = songs.filter(song => song.status === SONG_STATUS.PRACTICE);
        break;

      case SONG_LIST_TYPES.ALL:
        parked = songs.filter(song => song.status === SONG_STATUS.PARKED);
        discarded = songs.filter(song => song.status === SONG_STATUS.DISCARDED);

        if (statusFilter === 'PARKED') {
          filtered = parked;
          parked = [];
          discarded = [];
        } else if (statusFilter === 'DISCARDED') {
          filtered = discarded;
          parked = [];
          discarded = [];
        } else {
          filtered = songs.filter(song =>
            song.status !== SONG_STATUS.PARKED &&
            song.status !== SONG_STATUS.DISCARDED &&
            song.status !== SONG_STATUS.PLAYBOOK
          );
        }
        break;
    }

    // Apply search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const filterBySearch = (song: any) =>
        song.title.toLowerCase().includes(search) ||
        song.artist.toLowerCase().includes(search);

      filtered = filtered.filter(filterBySearch);
      if (parked.length > 0) parked = parked.filter(filterBySearch);
      if (discarded.length > 0) discarded = discarded.filter(filterBySearch);
    }

    return { filteredSongs: filtered, parkedSongs: parked, discardedSongs: discarded };
  }, [songs, type, statusFilter, searchQuery, user?.uid, memberCount]);

  if (isLoading) return <div className="flex items-center justify-center py-12">Loading...</div>;
  if (error) return <div className="text-red-400 py-12">{error.message}</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none space-y-4 p-4">
        <input
          type="text"
          placeholder=""
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-800 rounded-lg px-4 py-2 text-gray-100 border-gray-700"
        />

        {type === SONG_LIST_TYPES.SUGGESTIONS && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStatusFilter(null)}
              className={cn(
                "p-2 rounded-lg flex items-center gap-2",
                !statusFilter ? "bg-orange-500" : "bg-gray-800 hover:bg-gray-700"
              )}
            >
              <ListFilter className="w-5 h-5 text-white" />
              <span className="text-sm"></span>
            </button>
            <button
              onClick={() => setStatusFilter('NEEDS_VOTE')}
              className={cn(
                "p-2 rounded-lg flex items-center gap-2",
                statusFilter === 'NEEDS_VOTE' ? "bg-orange-500" : "bg-orange-500/20 hover:bg-orange-500/30"
              )}
            >
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">Vote!</span>
            </button>
            <button
              onClick={() => setStatusFilter(SONG_STATUS.SUGGESTED)}
              className={cn(
                "p-2 rounded-lg flex items-center gap-2",
                statusFilter === SONG_STATUS.SUGGESTED ? "bg-blue-500" : "bg-blue-500/20 hover:bg-blue-500/30"
              )}
            >
              <Clock className="w-5 h-5" />
              <span className="text-sm">Voting</span>
            </button>
            <button
              onClick={() => setStatusFilter(SONG_STATUS.REVIEW)}
              className={cn(
                "p-2 rounded-lg flex items-center gap-2",
                statusFilter === SONG_STATUS.REVIEW ? "bg-green-500" : "bg-green-500/20 hover:bg-green-500/30"
              )}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm">Review</span>
            </button>
          </div>
        )}

        {type === SONG_LIST_TYPES.ALL && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStatusFilter(null)}
              className={cn(
                "p-2 rounded-lg",
                !statusFilter ? "bg-orange-500" : "bg-gray-800 hover:bg-gray-700"
              )}
            >
              <ListFilter className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setStatusFilter('PARKED')}
              className={cn(
                "p-2 rounded-lg flex items-center gap-2",
                statusFilter === 'PARKED' ? "bg-blue-500" : "bg-blue-500/20 hover:bg-blue-500/30"
              )}
            >
              <div className="w-5 h-5 rounded-full bg-blue-500/50 flex items-center justify-center text-blue-100 font-medium">P</div>
              <span className="text-sm">Parked</span>
            </button>
            <button
              onClick={() => setStatusFilter('DISCARDED')}
              className={cn(
                "p-2 rounded-lg flex items-center gap-2",
                statusFilter === 'DISCARDED' ? "bg-gray-600" : "bg-gray-800 hover:bg-gray-700"
              )}
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-sm">Discarded</span>
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteMode}
                    onChange={(e) => e.preventDefault()}  // Prevent native change, handled by dialog
                    className="rounded border-gray-700 bg-gray-800"
                  />
                  Delete Mode
                </label>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-800 border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle>Enable Delete Mode?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Consider using "Discard" instead of Delete. BandFlow AI uses discarded songs to improve
                    song suggestions and avoid recommending similar tracks. Deleted songs may be suggested again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteMode(false)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setDeleteMode(true)}>Enable Delete Mode</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-4">
        {type === SONG_LIST_TYPES.ALL ? (
          <>
            <CollapsibleSection
              title="Pipeline Songs"
              count={filteredSongs.length}
              isExpanded={isPipelineExpanded}
              onToggle={() => setIsPipelineExpanded(!isPipelineExpanded)}
            >
              {filteredSongs.map((song) => (
                <BaseSongCard
                  key={song.id}
                  song={song}
                  type={type}
                  deleteMode={deleteMode}
                />
              ))}
            </CollapsibleSection>

            {(parkedSongs.length > 0 || searchQuery) && (
              <CollapsibleSection
                title="Parked Songs"
                count={parkedSongs.length}
                isExpanded={isParkedExpanded}
                onToggle={() => setIsParkedExpanded(!isParkedExpanded)}
              >
                {parkedSongs.map((song) => (
                  <BaseSongCard
                    key={song.id}
                    song={song}
                    type={type}
                    deleteMode={deleteMode}
                  />
                ))}
              </CollapsibleSection>
            )}

            {(discardedSongs.length > 0 || searchQuery) && (
              <CollapsibleSection
                title="Discarded Songs"
                count={discardedSongs.length}
                isExpanded={isDiscardedExpanded}
                onToggle={() => setIsDiscardedExpanded(!isDiscardedExpanded)}
              >
                {discardedSongs.map((song) => (
                  <BaseSongCard
                    key={song.id}
                    song={song}
                    type={type}
                    deleteMode={deleteMode}
                  />
                ))}
              </CollapsibleSection>
            )}
          </>
        ) : (
          <div className="space-y-1">
            {filteredSongs.map((song) => (
              <BaseSongCard
                key={song.id}
                song={song}
                type={type}
                deleteMode={deleteMode}
              />
            ))}
          </div>
        )}

        {filteredSongs.length === 0 &&
          ((type === SONG_LIST_TYPES.ALL && parkedSongs.length === 0 && discardedSongs.length === 0) ||
            type !== SONG_LIST_TYPES.ALL) && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              No songs found
            </div>
          )}
      </div>


    </div>
  );
}