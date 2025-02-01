// components/songs/Modals/SongActionsModal.tsx
// TODO: Fully comment this up
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ListChecks,
  PauseCircle,
  XCircle,
  BookOpen,
  Star,
  ThumbsDown,
  X,
  Clock,
  Ban,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
  
} from 'lucide-react';
import type { BandSong, RAGStatus, SongStatus } from '@/lib/types/song';
import { SONG_STATUS } from '@/lib/types/song';
import { STATUS_COLORS } from '@/lib/constants/colours';
import { useBand } from '@/contexts/BandProvider';
import { cn } from '@/lib/utils';
import { getUserProfile } from '@/lib/services/firebase/auth';

interface SongActionsModalProps {
  song: BandSong;
  isOpen: boolean;
  onClose: () => void;
  onVote: (score: number) => void;
  onStatusChange: (status: SongStatus) => void;
  onRagStatusUpdate: (status: RAGStatus) => void;
  currentVote: number | null;
  currentRagStatus: RAGStatus | null;
  memberCount: number;
  voteCount: number;
}

export function SongActionsModal({
  song,
  isOpen,
  onClose,
  onVote,
  onStatusChange,
  onRagStatusUpdate,
  currentVote,
  currentRagStatus,
  memberCount,
  voteCount
}: SongActionsModalProps) {
  // States for voting UI
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  //const user = { uid: 'exampleUserId' }; // Replace this with the actual user object or import

  // Extract Spotify ID from spotifyUid
  const spotifyId = song.spotifyUid?.split(':').pop() || '';

  // Calculate score and status
  const calculateScore = () => {
    if (!song.votes) return 0;
    const totalVotes = Object.values(song.votes).reduce((sum, vote) => sum + vote.value, 0);
    const maxPossibleScore = memberCount * 5;
    return Math.round((totalVotes / maxPossibleScore) * 100);
  };

  const score = calculateScore();
  const { isAdmin } = useBand();
  const isHighScore = score >= 85;
  const zeroVotes = Object.values(song.votes || {}).filter(vote => vote.value === 0);
  const hasZeroVotes = zeroVotes.length > 0;

  const [memberProfiles, setMemberProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadMemberProfiles = async () => {
      const profiles: Record<string, any> = {};
      const userIds = Object.keys(song.ragStatus || {});

      for (const userId of userIds) {
        const profile = await getUserProfile(userId);
        if (profile) {
          profiles[userId] = profile;
        }
      }
      setMemberProfiles(profiles);
    };

    loadMemberProfiles();
  }, [song.ragStatus]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{song.title}</DialogTitle>
          <button onClick={onClose} className="absolute right-3 top-3 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-400">{song.artist}</p>
        </DialogHeader>

        <div className="space-y-6 p-4">
          {/* Spotify Player - Only show for certain statuses */}
          {spotifyId && song.status !== SONG_STATUS.REVIEW && song.status !== SONG_STATUS.PRACTICE && (
            <iframe
              src={`https://open.spotify.com/embed/track/${spotifyId}`}
              width="100%"
              height="152"
              style={{ borderRadius: '12px' }}
              allow="encrypted-media"
              loading="lazy"
            />
          )}

          {/* Voting State */}
          {song.status === SONG_STATUS.SUGGESTED && !currentVote && (
            <div className={cn(
              "space-y-4 border rounded-lg p-4",
              `${STATUS_COLORS.SUGGESTED.border} ${STATUS_COLORS.SUGGESTED.bgFaded}`
            )}>
              <h3 className={cn(
                "text-sm font-medium flex items-center gap-2",
                STATUS_COLORS.SUGGESTED.text
              )}>
                <AlertCircle className="w-4 h-4" />
                Add your vote!
              </h3>

              {/* Voting Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onMouseEnter={() => setHoveredRating(0)}
                  onMouseLeave={() => setHoveredRating(null)}
                  onClick={() => onVote(0)}
                  className={cn(
                    "p-2 rounded-full border-2 transition-all duration-200",
                    hoveredRating === 0
                      ? "border-orange-500 bg-orange-500/10 text-orange-500"
                      : "border-gray-600 text-gray-400 hover:border-orange-500/50"
                  )}
                >
                  <ThumbsDown className="w-6 h-6" />
                </button>

                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onMouseEnter={() => setHoveredRating(rating)}
                    onMouseLeave={() => setHoveredRating(null)}
                    onClick={() => onVote(rating)}
                    className={cn(
                      "p-1 rounded-full transition-all duration-200",
                      hoveredRating !== null && rating <= hoveredRating
                        ? "text-orange-500 scale-110"
                        : "text-gray-400"
                    )}
                  >
                    <Star
                      className="w-6 h-6"
                      fill={hoveredRating !== null && rating <= hoveredRating ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Waiting for Votes State */}
          {song.status === SONG_STATUS.SUGGESTED && currentVote && voteCount < memberCount && (
            <div className={cn(
              "text-center py-6 rounded-lg border animate-fade-in",
              `${STATUS_COLORS.SUGGESTED.border} ${STATUS_COLORS.SUGGESTED.bgFaded}`
            )}>
              <Clock className={cn("w-8 h-8 mx-auto mb-2 animate-spin-slow", STATUS_COLORS.SUGGESTED.text)} />
              <p className="text-blue-200">Waiting for everybody to vote!</p>
              <p className="text-sm text-blue-400 mt-1">{voteCount}/{memberCount} votes in</p>
            </div>
          )}

          {/* Review State */}
          {song.status === SONG_STATUS.REVIEW && (
            <div className="space-y-6 animate-fade-in">
              <div className={cn(
                "text-center py-6 rounded-lg",
                STATUS_COLORS.REVIEW.bgFaded
              )}>
                <h3 className="text-lg font-semibold">
                  {isHighScore ? (
                    <span className="flex items-center justify-center gap-2">
                      Great score!
                      <span className="text-orange-400 text-xl animate-bounce">🔥</span>
                    </span>
                  ) : 'Scores are in!'}
                </h3>
                <p className="text-3xl font-bold text-orange-400 mt-2">{score}%</p>
                {hasZeroVotes && (
                  <p className="text-sm text-red-400 mt-2 flex items-center justify-center gap-1">
                    <ThumbsDown className="w-4 h-4" />
                    {zeroVotes.length} {zeroVotes.length === 1 ? 'member voted' : 'members voted'} against this song
                  </p>
                )}
              </div>

              {isAdmin && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Move to...</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onStatusChange(SONG_STATUS.PRACTICE)}
                      className="flex-1 p-3 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 group"
                    >
                      <ListChecks className="w-5 h-5 mx-auto text-yellow-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs mt-1 text-yellow-400">Practice</span>
                    </button>

                    <button
                      onClick={() => onStatusChange(SONG_STATUS.PARKED)}
                      className="flex-1 p-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 group"
                    >
                      <PauseCircle className="w-5 h-5 mx-auto text-blue-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs mt-1 text-blue-400">Park</span>
                    </button>

                    <button
                      onClick={() => onStatusChange(SONG_STATUS.DISCARDED)}
                      className="flex-1 p-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 group"
                    >
                      <XCircle className="w-5 h-5 mx-auto text-gray-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs mt-1 text-gray-400">Discard</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Practice State */}
          {song.status === SONG_STATUS.PRACTICE && (
            <div className="space-y-6 animate-fade-in">
              {/* Band Progress */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Band Progress</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: memberCount }).map((_, index) => {
                    const userIds = Object.keys(song.ragStatus || {});
                    const userId = userIds[index];
                    const ragStatus = userId ? song.ragStatus?.[userId]?.status : null;
                    const memberProfile = userId ? memberProfiles[userId] : undefined;

                    return (
                      <div key={userId || `empty-${index}`} className="text-center space-y-2">
                        <div className={cn(
                          "w-12 h-12 mx-auto rounded-full flex items-center justify-center text-lg font-medium",
                          {
                            'bg-red-500/20 text-red-400': ragStatus === 'RED',
                            'bg-yellow-500/20 text-yellow-400': ragStatus === 'AMBER',
                            'bg-green-500/20 text-green-400': ragStatus === 'GREEN',
                            'bg-gray-700 text-gray-400': !ragStatus
                          }
                        )}>
                          {memberProfile?.displayName?.charAt(0) || '?'}
                        </div>
                        <div className="text-sm">
                          <div className="font-medium truncate">
                            {memberProfile?.displayName || 'Unknown'}
                          </div>
                          <div className={cn(
                            "text-xs",
                            {
                              'text-red-400': ragStatus === 'RED',
                              'text-yellow-400': ragStatus === 'AMBER',
                              'text-green-400': ragStatus === 'GREEN',
                              'text-gray-400': !ragStatus
                            }
                          )}>
                            {ragStatus ? ragStatus.toLowerCase() : 'not set'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Update Status */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Update Your Status</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onRagStatusUpdate('RED')}
                    className={cn(
                      "p-3 rounded-lg transition-all flex flex-col items-center gap-2",
                      "bg-red-500/20 hover:bg-red-500/30",
                      currentRagStatus === 'RED' && "ring-2 ring-red-500"
                    )}
                  >
                    <Ban className="w-5 h-5 text-red-400" />
                    <span className="text-xs text-red-400">Not Ready</span>
                  </button>
                  <button
                    onClick={() => onRagStatusUpdate('AMBER')}
                    className={cn(
                      "p-3 rounded-lg transition-all flex flex-col items-center gap-2",
                      "bg-yellow-500/20 hover:bg-yellow-500/30",
                      currentRagStatus === 'AMBER' && "ring-2 ring-yellow-500"
                    )}
                  >
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <span className="text-xs text-yellow-400">Getting There</span>
                  </button>
                  <button
                    onClick={() => onRagStatusUpdate('GREEN')}
                    className={cn(
                      "p-3 rounded-lg transition-all flex flex-col items-center gap-2",
                      "bg-green-500/20 hover:bg-green-500/30",
                      currentRagStatus === 'GREEN' && "ring-2 ring-green-500"
                    )}
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-xs text-green-400">Ready!</span>
                  </button>
                </div>
              </div>

              {/* Admin-only Song Actions */}
              {isAdmin && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-400">Song Actions</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onStatusChange(SONG_STATUS.PLAYBOOK)}
                      className={cn(
                        "p-3 rounded-lg transition-all flex flex-col items-center gap-2",
                        STATUS_COLORS.PLAYBOOK.bgFaded,
                        STATUS_COLORS.PLAYBOOK.bgFadedHover
                      )}
                    >
                      <BookOpen className={cn("w-5 h-5", STATUS_COLORS.PLAYBOOK.text)} />
                      <span className={cn("text-xs", STATUS_COLORS.PLAYBOOK.text)}>Play Book</span>
                    </button>
                    <button
                      onClick={() => onStatusChange(SONG_STATUS.PARKED)}
                      className={cn(
                        "p-3 rounded-lg transition-all flex flex-col items-center gap-2",
                        STATUS_COLORS.PARKED.bgFaded,
                        STATUS_COLORS.PARKED.bgFadedHover
                      )}
                    >
                      <PauseCircle className={cn("w-5 h-5", STATUS_COLORS.PARKED.text)} />
                      <span className={cn("text-xs", STATUS_COLORS.PARKED.text)}>Park</span>
                    </button>
                    <button
                      onClick={() => onStatusChange(SONG_STATUS.DISCARDED)}
                      className={cn(
                        "p-3 rounded-lg transition-all flex flex-col items-center gap-2",
                        STATUS_COLORS.DISCARDED.bgFaded,
                        STATUS_COLORS.DISCARDED.bgFadedHover
                      )}
                    >
                      <XCircle className={cn("w-5 h-5", STATUS_COLORS.DISCARDED.text)} />
                      <span className={cn("text-xs", STATUS_COLORS.DISCARDED.text)}>Discard</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parked & Discarded State */}
            {(song.status === SONG_STATUS.PARKED || song.status === SONG_STATUS.DISCARDED) && isAdmin && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-400">Song Actions</h3>
              <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onStatusChange(SONG_STATUS.SUGGESTED)}
                className={cn(
                "p-3 rounded-lg transition-all flex flex-col items-center gap-2",
                STATUS_COLORS.SUGGESTED.bgFaded,
                STATUS_COLORS.SUGGESTED.bgFadedHover
                )}
              >
                <ListChecks className={cn("w-5 h-5", STATUS_COLORS.SUGGESTED.text)} />
                <span className={cn("text-xs", STATUS_COLORS.SUGGESTED.text)}>Suggestions</span>
              </button>
              <button
                onClick={() => onStatusChange(SONG_STATUS.PRACTICE)}
                className={cn(
                "p-3 rounded-lg transition-all flex flex-col items-center gap-2",
                STATUS_COLORS.PRACTICE.bgFaded,
                STATUS_COLORS.PRACTICE.bgFadedHover
                )}
              >
                <ListChecks className={cn("w-5 h-5", STATUS_COLORS.PRACTICE.text)} />
                <span className={cn("text-xs", STATUS_COLORS.PRACTICE.text)}>Practice</span>
              </button>
              </div>
            </div>
            )}
          



          {/* PlayBook State */}
          {song.status === SONG_STATUS.PLAYBOOK && (
            <div className="space-y-6 animate-fade-in">
              {/* Update Your Status */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Update Your Status</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onRagStatusUpdate('RED')}
                    className={cn(
                      "p-3 rounded-lg transition-all flex flex-col items-center gap-2",
                      "bg-red-500/20 hover:bg-red-500/30",
                      currentRagStatus === 'RED' && "ring-2 ring-red-500"
                    )}
                  >
                    <Ban className="w-5 h-5 text-red-400" />
                    <span className="text-xs text-red-400">Not Ready</span>
                  </button>
                  <button
                    onClick={() => onRagStatusUpdate('AMBER')}
                    className={cn(
                      "p-3 rounded-lg transition-all flex flex-col items-center gap-2",
                      "bg-yellow-500/20 hover:bg-yellow-500/30",
                      currentRagStatus === 'AMBER' && "ring-2 ring-yellow-500"
                    )}
                  >
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <span className="text-xs text-yellow-400">Getting There</span>
                  </button>
                  <button
                    onClick={() => onRagStatusUpdate('GREEN')}
                    className={cn(
                      "p-3 rounded-lg transition-all flex flex-col items-center gap-2",
                      "bg-green-500/20 hover:bg-green-500/30",
                      currentRagStatus === 'GREEN' && "ring-2 ring-green-500"
                    )}
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-xs text-green-400">Ready!</span>
                  </button>
                </div>
              </div>

              {/* Admin-only Move Options */}
              {isAdmin && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-400">Move to...</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onStatusChange(SONG_STATUS.PRACTICE)}
                      className="p-3 rounded-lg transition-all flex flex-col items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30"
                    >
                      <ListChecks className="w-5 h-5 text-yellow-400" />
                      <span className="text-xs text-yellow-400">Practice</span>
                    </button>
                    <button
                      onClick={() => onStatusChange(SONG_STATUS.PARKED)}
                      className="p-3 rounded-lg transition-all flex flex-col items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30"
                    >
                      <PauseCircle className="w-5 h-5 text-blue-400" />
                      <span className="text-xs text-blue-400">Park</span>
                    </button>
                    <button
                      onClick={() => onStatusChange(SONG_STATUS.DISCARDED)}
                      className="p-3 rounded-lg transition-all flex flex-col items-center gap-2 bg-gray-600/20 hover:bg-gray-600/30"
                    >
                      <XCircle className="w-5 h-5 text-gray-400" />
                      <span className="text-xs text-gray-400">Discard</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}