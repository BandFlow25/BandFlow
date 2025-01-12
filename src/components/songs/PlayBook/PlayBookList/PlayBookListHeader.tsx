// components/songs/PlayBook/PlayBookList/PlayBookListHeader.tsx
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PlayBookListHeaderProps {
  title: string;
  count: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  className?: string;
}

export function PlayBookListHeader({
  title,
  count,
  searchQuery,
  onSearchChange,
  className
}: PlayBookListHeaderProps) {
  return (
    <div className={cn(
      "sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm pb-4 space-y-4",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <span className="text-sm text-gray-400">({count} songs)</span>
        </div>
      </div>

      <div className="relative">
        <Input
          type="search"
          placeholder="Search Play Book..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 w-full"
        />
      </div>
    </div>
  );
}