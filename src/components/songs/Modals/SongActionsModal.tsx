// components/songs/Modals/SongActionsModal.tsx
import { useState } from 'react';
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
  AlertCircle,
  Flame
} from 'lucide-react';
import type { BandSong, RAGStatus, SongStatus } from '@/lib/types/song';
import { SONG_STATUS } from '@/lib/types/song';
import { STATUS_COLORS } from '@/lib/constants/colours';
import { cn } from '@/lib/utils';

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
  const isHighScore = score >= 85;
  const zeroVotes = Object.values(song.votes || {}).filter(vote => vote.value === 0);
  const hasZeroVotes = zeroVotes.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 text-gray-100 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{song.title}</DialogTitle>
          <button onClick={onClose} className="absolute right-3 top-3 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-400">{song.artist}</p>
        </DialogHeader>

        <div className="space-y-6 p-4">
          {/* Spotify Player */}
          {spotifyId && (
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

              {/* Embedded Voting Controls */}
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
                      <Flame className="w-6 h-6 text-orange-400 animate-bounce" />
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

              <div>
                <p className="text-sm text-gray-400 mb-3">Move to...</p>
                <div className="flex gap-2">
                  {/* Practice Button */}
                  <button
                    onClick={() => onStatusChange(SONG_STATUS.PRACTICE)}
                    className={cn(
                      "flex-1 p-3 rounded-lg transition-colors group",
                      STATUS_COLORS.PRACTICE.bgFaded, 
                      STATUS_COLORS.PRACTICE.bgFadedHover
                    )}
                  >
                    <ListChecks className={cn(
                      "w-5 h-5 mx-auto group-hover:scale-110 transition-transform",
                      STATUS_COLORS.PRACTICE.text
                    )} />
                    <span className={cn("text-xs mt-1", STATUS_COLORS.PRACTICE.text)}>Practice</span>
                  </button>

                  {/* Park Button */}
                  <button
                    onClick={() => onStatusChange(SONG_STATUS.PARKED)}
                    className={cn(
                      "flex-1 p-3 rounded-lg transition-colors group",
                      STATUS_COLORS.PARKED.bgFaded,
                      STATUS_COLORS.PARKED.bgFadedHover  // Make sure this is correct in the constants
                    )}
                  >
                    <PauseCircle className={cn(
                      "w-5 h-5 mx-auto group-hover:scale-110 transition-transform",
                      STATUS_COLORS.PARKED.text
                    )} />
                    <span className={cn("text-xs mt-1", STATUS_COLORS.PARKED.text)}>Park</span>
                  </button>

                  {/* Discard Button */}
                  <button
                    onClick={() => onStatusChange(SONG_STATUS.DISCARDED)}
                    className={cn(
                      "flex-1 p-3 rounded-lg transition-colors group",
                      STATUS_COLORS.DISCARDED.bgFaded,
                      STATUS_COLORS.DISCARDED.bgFadedHover
                    )}
                  >
                    <XCircle className={cn(
                      "w-5 h-5 mx-auto group-hover:scale-110 transition-transform",
                      STATUS_COLORS.DISCARDED.text
                    )} />
                    <span className={cn("text-xs mt-1", STATUS_COLORS.DISCARDED.text)}>Discard</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Practice State */}
          {song.status === SONG_STATUS.PRACTICE && (
            <div className="space-y-6 animate-fade-in">
              <div className={cn(
                "border rounded-lg p-6",
                `${STATUS_COLORS.PRACTICE.border} ${STATUS_COLORS.PRACTICE.bgFaded}`
              )}>
                <h3 className={cn(
                  "text-sm font-medium mb-4 flex items-center gap-2",
                  STATUS_COLORS.PRACTICE.text
                )}>
                  <CheckCircle2 className="w-4 h-4" />
                  How well do you know this song?
                </h3>

                {/* RAG Controls */}
                <div className="flex items-center justify-center gap-4">
                  {[
                    { status: 'RED' as const, icon: Ban, label: "Not Ready" },
                    { status: 'AMBER' as const, icon: AlertTriangle, label: "Getting There" },
                    { status: 'GREEN' as const, icon: CheckCircle2, label: "Ready!" }
                  ].map(({ status, icon: Icon, label }) => (
                    <button
                      key={status}
                      onClick={() => onRagStatusUpdate(status)}
                      className={cn(
                        "p-3 rounded-lg transition-all flex flex-col items-center gap-1 group",
                        {
                          'bg-red-500/20 text-red-400 hover:bg-red-500/30': status === 'RED',
                          'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30': status === 'AMBER',
                          'bg-green-500/20 text-green-400 hover:bg-green-500/30': status === 'GREEN',
                        },
                        currentRagStatus === status && "ring-2 ring-white/20"
                      )}
                    >
                      <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span className="text-xs">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-3">Move to...</p>
                <div className="flex gap-2">
                  {/* Play Book Button */}
                  <button
                    onClick={() => onStatusChange(SONG_STATUS.PLAYBOOK)}
                    className={cn(
                      "flex-1 p-3 rounded-lg transition-colors group",
                      STATUS_COLORS.PLAYBOOK.bgFaded,
                      STATUS_COLORS.PLAYBOOK.bgFadedHover
                    )}
                  >
                    <BookOpen className={cn(
                      "w-5 h-5 mx-auto group-hover:scale-110 transition-transform",
                      STATUS_COLORS.PLAYBOOK.text
                    )} />
                    <span className={cn("text-xs mt-1", STATUS_COLORS.PLAYBOOK.text)}>Play Book</span>
                  </button>

                  {/* Park Button */}
                  <button
                    onClick={() => onStatusChange(SONG_STATUS.PARKED)}
                    className={cn(
                      "flex-1 p-3 rounded-lg transition-colors group",
                      STATUS_COLORS.PARKED.bgFaded,
                      STATUS_COLORS.PARKED.bgFadedHover
                    )}
                  >
                    <PauseCircle className={cn(
                      "w-5 h-5 mx-auto group-hover:scale-110 transition-transform",
                      STATUS_COLORS.PARKED.text
                    )} />
                    <span className={cn("text-xs mt-1", STATUS_COLORS.PARKED.text)}>Park</span>
                  </button>

                  {/* Discard Button */}
                  <button
                    onClick={() => onStatusChange(SONG_STATUS.DISCARDED)}
                    className={cn(
                      "flex-1 p-3 rounded-lg transition-colors group",
                      STATUS_COLORS.DISCARDED.bgFaded,
                      STATUS_COLORS.DISCARDED.bgFadedHover
                    )}
                  >
                    <XCircle className={cn(
                      "w-5 h-5 mx-auto group-hover:scale-110 transition-transform",
                      STATUS_COLORS.DISCARDED.text
                    )} />
                    <span className={cn("text-xs mt-1", STATUS_COLORS.DISCARDED.text)}>Discard</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}