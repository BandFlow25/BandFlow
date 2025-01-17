// components/songs/shared/SearchHeader.tsx
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SearchHeader({
  searchQuery,
  onSearchChange,
  placeholder = "Search...",
  className,
  children
}: SearchHeaderProps) {
  return (
    <div className={cn(
      "flex-none space-y-4 px-4 py-3",
      className
    )}>
      <div className="relative">
        <Input
          type="search"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-gray-800/50 border-gray-700 text-white"
        />
      </div>

      {children}
    </div>
  );
}