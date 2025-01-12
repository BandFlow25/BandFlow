//src\components\songs\features\RagStatusControls.tsx
import { cn } from '@/lib/utils';
//import type { RAGStatus } from '@/lib/types/song';
import { Ban, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RAGStatusControlsProps {
  currentStatus: 'RED' | 'AMBER' | 'GREEN' | 'GREY' | null;
  onChange: (status: 'RED' | 'AMBER' | 'GREEN' | 'GREY') => void;
}

const RAG_ICONS = {
  RED: Ban,
  AMBER: AlertTriangle,
  GREEN: CheckCircle2
} as const;

export function RAGStatusControls({ 
  currentStatus, 
  onChange
}: RAGStatusControlsProps) {
  const statuses: (keyof typeof RAG_ICONS)[] = ['RED', 'AMBER', 'GREEN'];

  return (
    <div className="flex items-center gap-2">
      {statuses.map((status) => {
        const Icon = RAG_ICONS[status];
        return (
          <button
            key={status}
            onClick={() => onChange(status)}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              {
                'bg-red-500/20 text-red-400 hover:bg-red-500/30': status === 'RED',
                'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30': status === 'AMBER',
                'bg-green-500/20 text-green-400 hover:bg-green-500/30': status === 'GREEN',
              },
              currentStatus === status && "ring-1 ring-white/50"
            )}
            title={`Mark as ${status.toLowerCase()}`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}