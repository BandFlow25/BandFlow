// components/songs/SongList/SongListHeader.tsx

import { Input } from '@/components/ui/input';
interface SongListHeaderProps {
    title: string;
    count: number;
    searchQuery: string;
    onSearchChange: (value: string) => void;
  }
  
  export function SongListHeader({  searchQuery, onSearchChange }: SongListHeaderProps) {
    return (
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm pb-4 space-y-4">
        <div className="flex items-center justify-between">
         
        </div>
        <div className="relative">
          <Input
            type="search"
            placeholder="Filter songs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 w-full"
          />
        </div>
      </div>
    );
  }
  
