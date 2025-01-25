// components/songs/BulkUpload/SongMatchCard.tsx
import { SongMatch } from '@/lib/types/bulkUpload';
import type { SpotifyTrack } from '@/lib/services/spotify';
import { cn } from '@/lib/utils';


interface SongMatchCardProps {
  match: SongMatch;
  onSelectMatch: (track: SpotifyTrack) => void;
  onApprove: () => void;
  isApproved?: boolean;
}
   
export function SongMatchCard({ match, onSelectMatch, onApprove, isApproved }: SongMatchCardProps) {
  return (
    <div className={cn(
      "bg-gray-800 p-4 rounded-lg transition-all",
      isApproved && "bg-green-500/20 opacity-75"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium text-white">{match.title}</h3>
          {match.artist && (
            <p className="text-sm text-gray-400">{match.artist}</p>
          )}
        </div>
        <div className="flex items-center">
          <span className={cn(
            "px-2 py-1 rounded-full text-xs",
            match.confidence > 80 
              ? "bg-green-500/20 text-green-400"
              : match.confidence > 50
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-red-500/20 text-red-400"
          )}>
            {Math.round(match.confidence)}% match
          </span>
        </div>
      </div>

      {!isApproved && (
        <div className="space-y-2">
          {match.spotifyMatches.map((track) => (
            <button
              key={track.id}
              onClick={() => onSelectMatch(track)}
              className={cn(
                "w-full p-2 flex items-center gap-3 rounded-lg transition-colors",
                match.selected?.id === track.id
                  ? "bg-orange-500/20 border border-orange-500"
                  : "hover:bg-gray-700"
              )}
            >
              <img
                src={track.album?.images[0]?.url || "/placeholder.png"}
                alt={track.name}
                className="w-10 h-10 rounded"
              />
              <div className="text-left flex-1">
                <div className="font-medium text-white">{track.name}</div>
                <div className="text-sm text-gray-400">
                {track.artists.map((a: { name: string }) => a.name).join(", ")}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onApprove}
        disabled={!match.selected || isApproved}
        className={cn(
          "mt-4 w-full py-2 rounded-lg transition-colors",
          isApproved 
            ? "bg-green-500 text-white cursor-not-allowed"
            : match.selected
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
        )}
      >
        {isApproved ? 'Approved!' : 'Approve Match'}
      </button>
    </div>
  );
}