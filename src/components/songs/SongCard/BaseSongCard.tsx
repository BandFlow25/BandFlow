// components/songs/SongCard/BaseSongCardV2.tsx

import { useState, useMemo } from 'react';
import {
  Music,
  Play,
  Trash2,
  ThumbsDown,
  ListChecks,
  PauseCircle,
  XCircle,
  BookOpen,
  Clock,
  ListMusic,
  Flame,
  MoreVertical,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/constants/colours';
import type { BandSong, SongListType, RAGStatus, SongStatus } from '@/lib/types/song';
import { addVote, updateRagStatus, updateSongStatus, deleteBandSong } from '@/lib/services/firebase/songs';
import { usePlayerContext } from "@/contexts/PlayerContext";

import { useBand } from '@/contexts/BandProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { SongMetadataModal } from '@/components/songs/Modals/SongMetadataModal';
import { SongActionsModal } from '@/components/songs/Modals/SongActionsModal';
import { SONG_STATUS } from '@/lib/types/song';

interface BaseSongCardProps {
  song: BandSong;
  type: SongListType;
  onSongDeleted?: (() => void) | undefined;
  className?: string;
  deleteMode?: boolean;
}

export function BaseSongCard({
  song,
  type,
  className,
  onSongDeleted,
  deleteMode
}: BaseSongCardProps) {
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const { setCurrentSong, setIsPlaying } = usePlayerContext();
  const { user } = useAuth();
  const { activeBand, isAdmin, memberCount } = useBand();
  const voteCount = Object.keys(song.votes || {}).length;
  const hasUserVoted = user ? !!song.votes?.[user.uid] : false;

  const needsUserAction = useMemo(() => {
    if (!user?.uid) return false;

    switch (song.status) {
      case SONG_STATUS.PRACTICE:
        return !song.ragStatus?.[user.uid];
      case SONG_STATUS.SUGGESTED:
        return !hasUserVoted;
      default:
        return false;
    }
  }, [song.status, song.votes, song.ragStatus, user?.uid, hasUserVoted]);

  const handleVote = async (score: number) => {
    if (!user || !activeBand?.id) return;
    try {
      await addVote(activeBand.id, song.id, user.uid, score);
      setIsActionsOpen(false);
    } catch (error) {
      console.error('Error in handleVote:', error);
    }
  };

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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !activeBand?.id) return;
    try {
      await deleteBandSong(activeBand.id, song.id, user.uid);
      onSongDeleted?.();
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  };

  const getCardStyle = () => {
    if (needsUserAction && song.status === SONG_STATUS.SUGGESTED) {
      return `border-t-2 ${STATUS_COLORS.SUGGESTED.border} ${STATUS_COLORS.SUGGESTED.bgFaded}`;
    }
    switch (song.status) {
      case SONG_STATUS.SUGGESTED:
        return `border-t-2 ${STATUS_COLORS.SUGGESTED.border} ${STATUS_COLORS.SUGGESTED.bgFaded}`;
      case SONG_STATUS.REVIEW:
        return `border-t-2 ${STATUS_COLORS.REVIEW.border} ${STATUS_COLORS.REVIEW.bgFaded}`;
      case SONG_STATUS.PRACTICE:
        return `border-t-2 ${STATUS_COLORS.PRACTICE.border} ${STATUS_COLORS.PRACTICE.bgFaded}`;
      case SONG_STATUS.PARKED:
        return `border-t-2 ${STATUS_COLORS.PARKED.border} ${STATUS_COLORS.PARKED.bgFaded} opacity-75`;
      case SONG_STATUS.DISCARDED:
        return `border-t-2 ${STATUS_COLORS.DISCARDED.border} ${STATUS_COLORS.DISCARDED.bgFaded} opacity-75`;
      default:
        return 'bg-gray-800/40';
    }
  };

  const calculateScore = (votes: Record<string, { value: number }> | undefined) => {
    if (!votes || !activeBand) return 0;
    const totalVotes = Object.values(votes).reduce((sum, vote) => sum + vote.value, 0);
    const maxPossibleScore = (song.votingMemberCount || memberCount) * 5;
    return Math.round((totalVotes / maxPossibleScore) * 100);
  };

  const score = calculateScore(song.votes);
  const isHighScore = score >= 85;
  const hasZeroVote = Object.values(song.votes || {}).some(vote => vote.value === 0);

  const renderActionButton = () => {
    if (needsUserAction && song.status === SONG_STATUS.SUGGESTED) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsActionsOpen(true);
          }}
          className="p-1.5 hover:bg-gray-700 rounded-full bg-orange-500/20"
        >
          <AlertCircle className="w-4 h-4 text-orange-400" />
        </button>
      );
    }

    if (song.status === SONG_STATUS.REVIEW) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsActionsOpen(true);
          }}
          className="p-1.5 hover:bg-gray-700 rounded-full bg-green-500/20"
        >
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        </button>
      );
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsActionsOpen(true);
        }}
        className="p-1.5 hover:bg-gray-700 rounded-full"
      >
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </button>
    );
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "relative p-2 rounded-lg",
          getCardStyle(),
          "transition-all duration-200 ease-in-out hover:shadow-lg cursor-pointer",
          className
        )}
        onClick={(e) => {
          // Ignore clicks on the thumbnail area
          if (!(e.target as HTMLElement).closest('.thumbnail-area')) {
            setIsActionsOpen(true);
          }
        }}
      >
        <div className="flex items-center flex-1 h-10">
          {/* Thumbnail */}
          <div className="relative w-10 h-10 flex-shrink-0 thumbnail-area">
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
            <button
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md opacity-0 hover:opacity-100 thumbnail-area"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSong(song);
                setIsPlaying(true);
              }}
            >
              <Play className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Title and Artist */}
          <div className="min-w-0 flex-1 ml-3">
            <h3 className="font-medium truncate leading-tight">{song.title}</h3>
            <p className="text-sm text-gray-400 truncate leading-tight">{song.artist}</p>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
            <div className="flex items-center mr-2">
              {song.status === SONG_STATUS.SUGGESTED ? (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-blue-400 mr-1" />
                  <span className={`text-sm ${needsUserAction ? 'text-orange-400' : 'text-gray-400'}`}>
                    {voteCount}/{memberCount}
                  </span>
                </div>
              ) : song.status === SONG_STATUS.REVIEW ? (
                <div className="flex items-center space-x-1">
                  {isHighScore && <Flame className="w-5 h-5 text-orange-400" />}
                  {hasZeroVote && <ThumbsDown className="w-5 h-5 text-red-400" />}
                  <span className={`text-sm font-medium ${isHighScore ? 'text-orange-400' :
                      hasZeroVote ? 'text-red-400' : 'text-gray-400'
                    }`}>
                    {score}%
                  </span>
                </div>

              ) : song.status === SONG_STATUS.PRACTICE ? (
                <div className="flex items-center gap-1">
                  {Array.from({ length: memberCount }).map((_, index) => {
                    const userIds = Object.keys(song.ragStatus || {});
                    const userId = userIds[index];
                    const ragStatus = userId ? song.ragStatus?.[userId]?.status : null;
                    const isCurrentUser = userId === user?.uid;

                    return (
                      <div
                        key={userId || `empty-${index}`}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-colors duration-200",
                          {
                            'bg-red-500': ragStatus === 'RED',
                            'bg-yellow-500': ragStatus === 'AMBER',
                            'bg-green-500': ragStatus === 'GREEN',
                            'bg-gray-500': !ragStatus,
                            'ring-1 ring-white/20': isCurrentUser
                          }
                        )}
                        title={userId ? `${userId}: ${ragStatus?.toLowerCase() || 'not set'}` : 'Member not voted'}
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* Action Buttons */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMetadataOpen(true);
              }}
              className="p-1.5 hover:bg-gray-700 rounded-full"
            >
              <ListMusic className="w-4 h-4 text-gray-400" />
            </button>
            {/* Conditional render based on delete mode */}
            {deleteMode && isAdmin ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(e);
                }}
                className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-full transition-colors"
                title="Remove song"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            ) : (
              renderActionButton()
            )}
          </div>
        </div>

        {/* Delete Mode Overlay */}
        {deleteMode && isAdmin && (
          <div
            className="absolute inset-0 bg-red-900/80 flex items-center justify-center cursor-pointer rounded-lg"
            onClick={handleDelete}
          >
            <div className="flex flex-col items-center gap-1">
              <Trash2 className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Remove</span>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Modal */}
      <SongMetadataModal
        song={song}
        isOpen={isMetadataOpen}
        onClose={() => setIsMetadataOpen(false)}
        context="songCard"
      />

      {/* Actions Modal */}
      <SongActionsModal
        song={song}
        isOpen={isActionsOpen}
        onClose={() => setIsActionsOpen(false)}
        onVote={handleVote}
        onStatusChange={handleStatusChange}
        onRagStatusUpdate={handleRagStatusUpdate}
        currentVote={song.votes?.[user?.uid ?? '']?.value ?? null}
        currentRagStatus={song.ragStatus?.[user?.uid ?? '']?.status ?? null}
        memberCount={memberCount}
        voteCount={voteCount}
      />
    </div>
  );
}