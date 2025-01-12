// components/songs/SetLists/SetlistAIHelper.tsx
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import type { BandSong } from '@/lib/types/song';

interface SetlistAIHelperProps {
  currentSongs: BandSong[];
  onSuggestionsReceived: (suggestions: BandSong[]) => void;
}

export function SetlistAIHelper({
  currentSongs,
  onSuggestionsReceived
}: SetlistAIHelperProps) {
  const handleGetSuggestions = async () => {
    try {
      // TODO: Implement AI suggestion logic here
      // You'll want to:
      // 1. Extract key features from current songs (tempo, key, genre, etc.)
      // 2. Call your AI service to get suggestions
      // 3. Filter suggestions against band's current playlist
      // 4. Return both known and new song suggestions
      const suggestions = await suggestSongs(currentSongs);
      onSuggestionsReceived(suggestions);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleGetSuggestions}
      className="text-orange-500 border-orange-500 hover:bg-orange-500/10"
    >
      <Sparkles className="w-4 h-4 mr-2" />
      Get AI Suggestions
    </Button>
  );
}