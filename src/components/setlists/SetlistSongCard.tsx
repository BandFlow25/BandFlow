import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { MoreVertical, CornerRightDown, Trash2, Clock } from 'lucide-react';
import type { BandSong } from '@/lib/types/song';
import { DurationtoMinSec } from '@/lib/services/bndyhelpers/SetListHelpers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SetlistSongCardProps {
  id: string;
  songId: string;
  song: BandSong;
  index: number;
  setId: string;
  onRemove?: () => void;
  onToggleSegue?: () => void;
  onSetupTimeChange?: (setupTime: number | null) => void;
  hasSegue?: boolean;
  setupTime?: number | null;
}

const SetlistSongCard: React.FC<SetlistSongCardProps> = ({
  id,
  songId,
  song,
  index,
  setId,
  onRemove,
  onToggleSegue,
  onSetupTimeChange,
  hasSegue = false,
  setupTime = null
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSetupTimeModal, setShowSetupTimeModal] = useState(false);
  const [setupTimeInput, setSetupTimeInput] = useState(setupTime?.toString() || '');
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const updateMenuPosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 144;

    const x = Math.max(0, rect.right - 160);
    const y = spaceBelow < menuHeight + 8
      ? Math.max(8, rect.top - menuHeight - 8)
      : rect.bottom + 8;

    setMenuPosition({ x, y });
  };

  const handleOpenMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateMenuPosition();
    setIsMenuOpen(true);
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id,
    data: {
      type: 'setlist-song',
      songId,
      song,
      index,
      setId
    }
  });

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleScroll = () => {
      if (isMenuOpen) {
        updateMenuPosition();
      }
    };

    const handleResize = () => {
      if (isMenuOpen) {
        updateMenuPosition();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMenuOpen]);

  const handleSetupTimeSubmit = () => {
    const time = setupTimeInput === '' ? null : parseFloat(setupTimeInput);
    onSetupTimeChange?.(time);
    setShowSetupTimeModal(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none' as const
  };

  const isNotPlaybook = song.status !== 'PLAYBOOK';

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "flex items-center h-8 px-2 rounded-lg group",
          "touch-none select-none cursor-grab active:cursor-grabbing",
          isDragging ? "bg-orange-500/20" :
            isNotPlaybook ? "bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/50" :
              "bg-gray-700/50 hover:bg-gray-700"
        )}
      >
        <span className="w-6 text-xs text-gray-400">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium text-sm truncate flex items-center gap-1",
            isNotPlaybook ? "text-orange-400" : "text-white"
          )}>
            {song.title}
            {isNotPlaybook && (
              <span className="text-xs">⚠️</span>
            )}
          </div>
        </div>

        {song.metadata?.duration && (
          <div className="flex items-center gap-1">
            {setupTime !== null && (
              <div className="text-xs text-blue-400 ml-2">
                +{setupTime}m
              </div>
            )}
            <div className="text-xs text-gray-400 ml-2">
              {DurationtoMinSec(parseInt(song.metadata.duration))}
            </div>
          </div>
        )}

        {setupTime !== null && (
          <div className="ml-2 text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
        )}

        {hasSegue && (
          <div className="mx-2 text-green-500">
            <CornerRightDown className="w-4 h-4" />
          </div>
        )}

        <button
          ref={buttonRef}
          onClick={handleOpenMenu}
          className={cn(
            "p-1 rounded-full transition-colors",
            isMenuOpen ? "bg-gray-600 text-white" : "text-gray-400 hover:text-white"
          )}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {isMenuOpen && mounted && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
            zIndex: 50
          }}
          className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 w-40 py-1"
        >
          <button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onToggleSegue?.();
              setIsMenuOpen(false);
            }}
            className="w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
          >
            <CornerRightDown className="w-4 h-4" />
            {hasSegue ? "Remove Segue" : "Add Segue"}
          </button>
          <button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setShowSetupTimeModal(true);
              setIsMenuOpen(false);
            }}
            className="w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            {setupTime !== null ? "Change Setup Time" : "Add Setup Time"}
          </button>
          <button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onRemove?.();
              setIsMenuOpen(false);
            }}
            className="w-full px-3 py-2 text-sm text-left text-red-400 hover:bg-gray-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Remove
          </button>
        </div>,
        document.body
      )}

      <Dialog open={showSetupTimeModal} onOpenChange={setShowSetupTimeModal}>
        <DialogContent className="bg-gray-900 border border-gray-800">
          <DialogHeader>
            <DialogTitle>
              {setupTime !== null ? "Change Setup Time" : "Add Setup Time"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Setup time needed (minutes)
            </label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={setupTimeInput}
              onChange={(e) => setSetupTimeInput(e.target.value)}
              placeholder="Enter time in minutes"
              className="bg-gray-800 border-gray-700"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                onSetupTimeChange?.(null);
                setShowSetupTimeModal(false);
              }}
              className="bg-gray-800 hover:bg-gray-700"
            >
              {setupTime !== null ? "Remove Setup Time" : "Cancel"}
            </Button>
            <Button
              onClick={handleSetupTimeSubmit}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={setupTimeInput === ''}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { SetlistSongCard };