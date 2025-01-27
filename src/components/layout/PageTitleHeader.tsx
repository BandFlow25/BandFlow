
// src/components/layout/PageTitleHeader.tsx
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBand } from '@/contexts/BandProvider';
import AddSongButton from '@/components/ui/buttons/AddSongButton';

type PageType = 'songs' | 'setlists' | 'media' | 'events';

interface PageTitleHeaderProps {
  title: string;
  count?: number | undefined;
  pageType?: PageType;
}

export function PageTitleHeader({
  title,
  count,
  pageType = 'songs'
}: PageTitleHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeBand } = useBand();
  const searchParams = useSearchParams();
  const currentView = searchParams?.get('view') || 'all';

  // Show dropdown in songs list and setlists views
  const showDropdown = (pathname?.includes('/songs') || pathname?.includes('/playbook') || pathname?.includes('/setlists')) && !pathname?.includes('/create');

  const songViews = [
    { label: 'Suggestions', value: 'suggestions' },
    { label: 'Practice List', value: 'practice' },
    { label: 'All Songs', value: 'all' }
  ];

  const setlistViews = [
    { label: 'Play Book', value: 'playbook' },
    { label: 'Setlists', value: 'setlists' }
  ];

  const views = pathname?.includes('/songs') ? songViews : setlistViews;

  const handleViewChange = (value: string) => {
    const menu = document.getElementById('view-menu');
    if (menu) menu.classList.add('hidden');
    
    if (pathname?.includes('/songs')) {
      router.push(`/bands/${activeBand?.id}/songs?view=${value}`);
    } else {
      router.push(`/bands/${activeBand?.id}/${value}`);
    }
  };

  return (
    <div className="flex items-center justify-between px-16 h-14 bg-gray-900 border-b border-gray-800">
      <div className="flex items-baseline gap-2">
        {showDropdown ? (
          <div className="relative group">
            <button
              className="flex items-center gap-2 text-xl font-semibold hover:text-orange-500 transition-colors"
              onClick={() => {
                const menu = document.getElementById('view-menu');
                menu?.classList.toggle('hidden');
              }}
            >
              {title}
              <ChevronDown className="w-5 h-5" />
            </button>

            <div
              id="view-menu"
              className="absolute hidden top-full left-0 mt-1 bg-gray-800 rounded-lg shadow-lg py-1 min-w-[160px] z-50"
            >
              {views.map((view) => (
                <button
                  key={view.value}
                  onClick={() => handleViewChange(view.value)}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm",
                    currentView === view.value ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-gray-700"
                  )}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <h1 className="text-xl font-semibold text-white">{title}</h1>
        )}
        {typeof count === 'number' && (
          <span className="text-sm text-gray-400">({count} songs)</span>
        )}
      </div>

      {pageType === 'songs' && <AddSongButton />}
    </div>
  );
}