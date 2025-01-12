// components/songs/SongCard/SongCardActions.tsx
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SongCardActionsProps {
  onOpenMenu: () => void;
  className?: string;
}

export function SongCardActions({ 
  onOpenMenu,
  className 
}: SongCardActionsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenMenu();
        }}
        className="p-2 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors"
      >
        <MoreHorizontal className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}