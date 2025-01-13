// components/songs/SongCard/BaseSongCard.tsx
import { useState } from 'react';
import { Music, Play, Trash2, ThumbsDown, ListChecks, PauseCircle, XCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BandSong, SongListType } from '@/lib/types/song';
import { SongCardActions } from './SongCardActions';
import { addVote } from '@/lib/services/firebase/songs';
import { usePlayerContext } from "@/contexts/PlayerContext";
import { VotingControls } from '@/components/songs/Features/VotingControls';
import { useBand } from '@/contexts/BandProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { updateSongStatus, updateRagStatus } from '@/lib/services/firebase/songs';
import { MetadataDisplay } from '@/components/songs/Features/MetadataDisplay';
import { deleteBandSong } from '@/lib/services/firebase/songs';
import { RAGStatus } from '@/lib/types/song';
import { RAGStatusControls } from '@/components/songs/Features/RagStatusControls';
import { SongStatus } from '@/lib/types/song';

interface BaseSongCardProps {
  song: BandSong;
  type: SongListType;
  className?: string;
  onSongDeleted: (() => void) | undefined;
}

export function BaseSongCard({
  song,
  type,
  className,
  onSongDeleted
}: BaseSongCardProps) {

  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { setCurrentSong, setIsPlaying } = usePlayerContext();
  const { currentBandId, memberCount, isAdmin } = useBand();
  const { user } = useAuth();
  const voteCount = Object.keys(song.votes || {}).length;
  const hasUserVoted = user ? !!song.votes?.[user.uid] : false;
  //const needsVote = song.status === 'VOTING' && !hasUserVoted;

  // All your existing handler functions remain the same
  const handleStatusChange = async (newStatus: SongStatus) => {
    if (!user) return;

    try {
      await updateSongStatus(song.id, user.uid, newStatus);
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error updating song status:', error);
    }
  };
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'PARKED':
        return 'bg-blue-900/20 hover:bg-blue-900/30';
      case 'DISCARDED':
        return 'bg-red-900/20 hover:bg-red-900/30';
      default:
        return 'bg-gray-800/40 hover:bg-gray-800/60';
    }
  };
  const getDynamicStyles = (status: string) => {
    if (status === 'VOTING' && !hasUserVoted) {
      return 'border border-orange-500/50';
    }
    return '';
  };
  const handleVote = async (score: number) => {
    if (!user) return;

    try {
      await addVote(song.id, user.uid, score);
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error saving vote:', error);
    }
  };
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !currentBandId) return;

    try {
      await deleteBandSong(song.id, user.uid, currentBandId);
      setIsMenuOpen(false);
      onSongDeleted?.();
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  };
  const calculateScore = (votes: Record<string, { value: number }> | undefined, totalMembers: number) => {
    if (!votes) return 0;
    const totalVotes = Object.values(votes).reduce((sum, vote) => sum + vote.value, 0);
    const maxPossibleScore = totalMembers * 5;
    return Math.round((totalVotes / maxPossibleScore) * 100);
  };
  const getDownVoters = (votes: Record<string, { value: number }> | undefined) => {
    if (!votes) return [];
    return Object.entries(votes)
      .filter(([_, vote]) => vote.value === 0)
      .map(([userId]) => userId);
  };
  const handleRagStatusUpdate = async (status: RAGStatus) => {
    if (!user) return;

    try {
      await updateRagStatus(song.id, user.uid, status);
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error updating RAG status:', error);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 p-3 rounded-md",
        getStatusStyles(song.status),
        getDynamicStyles(song.status),
        "transition-all duration-300 ease-in-out transform hover:shadow-lg", // Enhanced transition
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsMenuOpen(false);
      }}
    >
      {/* Thumbnail with Play Overlay */}
      <div className="relative min-w-[48px] h-[48px] transition-transform duration-200 ease-in-out group-hover:scale-105">
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
      </div>

      {/* Title and Artist Info */}
      <div className="flex-1 min-w-0 transition-all duration-200">
        <h3 className="font-medium text-white truncate">{song.title}</h3>
        <p className="text-sm text-gray-400 truncate">{song.artist}</p>
        {song.status === 'VOTING' && (
          <p className="text-xs text-gray-400 transition-all duration-200">
            Votes: {voteCount}/{memberCount}
            {hasUserVoted && (
              <span className="ml-2 text-green-400 transition-colors duration-200">(Voted)</span>
            )}
          </p>
        )}
        {song.status === 'REVIEW' && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Score: {calculateScore(song.votes, memberCount)}%</span>
            {getDownVoters(song.votes).length > 0 && (
              <div className="group relative">
                <ThumbsDown className="w-4 h-4 text-red-400 transition-colors duration-200" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200">
                  {getDownVoters(song.votes).join(', ')}
                </div>
              </div>
            )}
            {calculateScore(song.votes, memberCount) >= 85 && (
              <span className="animate-bounce">🔥</span>
            )}
          </div>
        )}
        {song.status === 'PRACTICE' && (
          <div className="flex items-center gap-1">
            {Array.from({ length: memberCount }).map((_, index) => {
              const userIds = Object.keys(song.ragStatus || {});
              const userId = userIds[index];
              const vote = userId ? song.ragStatus?.[userId] : null;
              const isCurrentUser = userId === user?.uid;

              return (
                <div
                  key={userId || `empty-${index}`}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    "transform transition-all duration-300 ease-in-out",
                    "hover:scale-125",
                    {
                      'bg-red-500': vote?.status === 'RED',
                      'bg-yellow-500': vote?.status === 'AMBER',
                      'bg-green-500': vote?.status === 'GREEN',
                      'bg-gray-500': !vote,
                      'ring-2 ring-white/50 ring-offset-1 ring-offset-gray-800': isCurrentUser
                    }
                  )}
                  title={userId ? `${userId}: ${vote?.status.toLowerCase() || 'not set'}` : 'Member not voted'}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Right Side Content */}
      <div className="flex items-center gap-4 transition-opacity duration-200">
        <MetadataDisplay song={song} />
        <SongCardActions
          onOpenMenu={() => setIsMenuOpen(!isMenuOpen)}
        />
      </div>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div 
          className={cn(
            "absolute inset-0 bg-gray-800/95 rounded-md p-4",
            "flex items-center justify-center",
            "transform transition-all duration-200 ease-in-out",
            "animate-in fade-in zoom-in-95 duration-200"
          )}
        >
          {type === 'all' && isAdmin ? (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Trash2 className="w-5 h-5" />
                Delete Song
              </button>
            </div>
          ) : type === 'review' ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleStatusChange('PRACTICE')}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                title="Move to Practice List"
              >
                <ListChecks className="w-5 h-5" />
                Practice
              </button>
              <button
                onClick={() => handleStatusChange('PARKED')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                title="Park this song for later"
              >
                <PauseCircle className="w-5 h-5" />
                Park
              </button>
              <button
                onClick={() => handleStatusChange('DISCARDED')}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                title="Discard this song"
              >
                <XCircle className="w-5 h-5" />
                Discard
              </button>
            </div>
          ) : type === 'practice' ? (
            <div className="flex flex-col items-center gap-3">
              <RAGStatusControls
                currentStatus={song.ragStatus?.[user?.uid ?? '']?.status || 'GREY'}
                onChange={handleRagStatusUpdate}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusChange('PLAYBOOK')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <BookOpen className="w-4 h-4" />
                  Playbook
                </button>
                <button
                  onClick={() => handleStatusChange('PARKED')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <PauseCircle className="w-4 h-4" />
                  Park
                </button>
                <button
                  onClick={() => handleStatusChange('DISCARDED')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <XCircle className="w-4 h-4" />
                  Discard
                </button>
              </div>
            </div>
          ) : (type === 'suggestions' || type === 'voting') && (
            <VotingControls
              currentVote={song.votes?.[user?.uid ?? '']?.value ?? null}
              onVote={handleVote}
            />
          )}
        </div>
      )}
    </div>
  );
}