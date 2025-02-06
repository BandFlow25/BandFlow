//src\components\songs\BulkUpload\BulkSongUpload.tsx
import { useState } from 'react';
import { FileUpload } from '@/components/ui/FileUpload';
import { SongMatchCard } from './SongMatchCard';
import { handleOCR } from './utils/ocr';
import { processSpotifyMatches, updateMatch, approveSong } from './utils/matching';
import { useBand } from '@/contexts/BandProvider';
import type { SongMatch } from '@/lib/types/bulkUpload';
import type { SpotifyTrack } from '@/lib/services/spotify';

export function BulkSongUpload() {
  const { activeBand } = useBand();
  const [results, setResults] = useState<SongMatch[]>([]);
  const [processing, setProcessing] = useState(false);
  const [approvedSongs, setApprovedSongs] = useState<Set<number>>(new Set());

  const handleImageUpload = async (file: File) => {
    if (!activeBand?.id) return;
    setProcessing(true);
    try {
      const songTitles = await handleOCR(file);
      const matches = await processSpotifyMatches(songTitles);
      setResults(matches);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleSelectMatch = (index: number, track: SpotifyTrack) => {
    updateMatch(index, track, results, setResults);
  };

  const handleApprove = async (index: number) => {
    if (!activeBand?.id) return;
    try {
      await approveSong(index, results, activeBand.id);
      setApprovedSongs(prev => new Set(prev).add(index));
    } catch (error) {
      console.error('Error approving song:', error);
    }
  };

  return (
    <div className="space-y-4">
      {processing ? (
        <div className="flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <FileUpload accept="image/*" onUpload={handleImageUpload} />
      )}

      {results.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((match, i) => (
            <SongMatchCard
              key={i}
              match={match}
              onSelectMatch={(track) => handleSelectMatch(i, track)}
              onApprove={() => handleApprove(i)}
              isApproved={approvedSongs.has(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}