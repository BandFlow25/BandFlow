// components/layout/navigation/Sidebar.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getBandMemberRole } from '@/lib/services/firebase/bands';
import { SongHelpers } from '@/lib/services/bandflowhelpers/SongHelpers';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  Music, Settings, LogOut, User,
  Menu, X, ChevronDown, ChevronRight,
  BookOpen, Calendar, ListMusic, ImageIcon, Shuffle, GitBranch, Library
} from 'lucide-react';

interface SongCount {
  total: number;
  active: number;
  suggested: number;
  review: number;
  practice: number;
  playbook: number;
  parked: number;
  discarded: number;
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [songMenuOpen, setSongMenuOpen] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();
  const { activeBand, isAdmin, clearActiveBand } = useBand();
  const searchParams = useSearchParams();
  const [songCounts, setSongCounts] = useState<SongCount>({
    total: 0,
    active: 0,
    suggested: 0,
    review: 0,
    practice: 0,
    playbook: 0,
    parked: 0,
    discarded: 0
  });
  

  useEffect(() => {
    const handleResize = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      setIsOpen(isLargeScreen);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (activeBand && user) {
      getBandMemberRole(activeBand.id, user.uid)
        .then((role) => setUserRole(role))
        .catch((err) => console.error('Error fetching user role:', err));
    }
  }, [activeBand, user]);

  /** Get song counts when active band changes */
  useEffect(() => {
    if (activeBand?.id) {
      SongHelpers.getAllSongCounts(activeBand.id)
        .then(setSongCounts)
        .catch(console.error);
    }
  }, [activeBand?.id]);

  const handleSwitchBand = () => {
    clearActiveBand();
    router.push('/home');
  };

  const handleLogout = async () => {
    try {
      clearActiveBand();
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (!activeBand) return null;

  const menuSections = [
    {
      title: 'Playbook',
      icon: <Library />,
      items: [
        {
          name: 'Active Songs',
          href: `/bands/${activeBand.id}/playbook`,
          count: songCounts.playbook
        },
        {
          name: 'Setlists',
          href: `/bands/${activeBand.id}/setlists`
        }
      ],
    },
    {
      title: 'Pipeline',
      icon: <GitBranch />,
      items: [
        {
          name: 'Suggestions',
          href: `/bands/${activeBand.id}/pipeline/suggestions`,
          count: songCounts.suggested,  // Just use suggested count
          highlight: true
        },
        {
          name: 'Practice',
          href: `/bands/${activeBand.id}/pipeline/practice`,
          count: songCounts.practice
        }
      ]
    }
  ];

  const isMenuItemActive = (href: string) => {
    if (href === `/bands/${activeBand.id}`) {
      return pathname === `/bands/${activeBand.id}`;
    }

    if (href.includes('?view=')) {
      const itemView = href.split('?view=')[1];
      const currentView = searchParams?.get('view');
      return currentView === itemView;
    }

    if (href === `/bands/${activeBand.id}/songs`) {
      return pathname === `/bands/${activeBand.id}/songs` && !searchParams?.get('view');
    }

    return pathname === href;
  };

 
  const songMenuItems = [
    {
      items: [
        {
          name: 'Songs Suggestions',
          href: `/bands/${activeBand.id}/songs?view=suggestions`,
          count: songCounts.suggested + songCounts.review,
          highlight: true
        },
        {
          name: 'Practice List',
          href: `/bands/${activeBand.id}/songs?view=practice`,
          count: songCounts.practice
        },
        {
          name: 'All Songs',
          href: `/bands/${activeBand.id}/songs`,
          count: songCounts.total
        }
      ]
    }
  ];


return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden text-white"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-40 transform transition-transform duration-200 ease-in-out border-r border-gray-800 flex flex-col",
        "pt-12 lg:pt-0",
        {
          "translate-x-0": isOpen,
          "-translate-x-full": !isOpen,
          "lg:translate-x-0": true,
          "lg:static": true,
        }
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center">
          <Link
            href={`/bands/${activeBand.id}`}
            className="flex items-center flex-1 gap-3 hover:bg-gray-800 rounded-lg p-2 transition-colors"
          >
            <Image
              src="/bf-logo.png"
              alt="BandFlow"
              width={32}
              height={32}
              className="rounded-full"
            />
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Band Flow 25</h1>
              <h2 className="text-sm text-gray-400">{activeBand.name}</h2>
            </div>
          </Link>
          <div className="flex flex-col gap-2 ml-2">
            {isAdmin && (
              <Link
                href={`/bands/${activeBand.id}/settings`}
                className="p-2 text-blue-500 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors"
                title="Band Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}
            <button
              onClick={handleSwitchBand}
              className="p-2 text-orange-500 hover:text-orange-400 hover:bg-gray-800 rounded-lg transition-colors"
              title="Select Band"
            >
              <Shuffle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            href={`/bands/${activeBand.id}/playbook`}
            className={cn(
              "flex items-center justify-between px-2 py-2 rounded-lg mb-4",
              pathname === `/bands/${activeBand.id}/playbook`
                ? "bg-orange-500 text-white"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            )}
          >
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              <span>Play Book</span>
            </div>
            {songCounts.playbook > 0 && (
              <span className={cn(
                "ml-2 px-2 py-0.5 rounded-full text-xs",
                pathname === `/bands/${activeBand.id}/playbook`
                  ? "bg-white/20"
                  : "bg-gray-700/50"
              )}>
                {songCounts.playbook}
              </span>
            )}
          </Link>

          <Link
            href={`/bands/${activeBand.id}/setlists`}
            className={cn(
              "flex items-center justify-between px-2 py-2 rounded-lg mb-4",
              pathname === `/bands/${activeBand.id}/setlists`
                ? "bg-orange-500 text-white"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            )}
          >
            <div className="flex items-center">
              <ListMusic className="w-5 h-5 mr-2" />
              <span>Setlists</span>
            </div>
          </Link>

          <div className="space-y-4">
            <div>
              <button
                onClick={() => setSongMenuOpen(!songMenuOpen)}
                className="w-full flex items-center justify-between px-2 py-2 text-gray-300 hover:text-white"
              >
                <div className="flex items-center">
                  <GitBranch className="w-5 h-5 mr-2" />
                  <span>Song Pipeline</span>
                </div>
                {songMenuOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {songMenuOpen && (
                <div className="ml-4 space-y-1 mt-2">
                  {songMenuItems.map((menuItem, idx) => (
                    <div key={idx}>
                      {menuItem.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center justify-between px-2 py-1.5 rounded-lg text-sm group",
                            isMenuItemActive(item.href)
                              ? "bg-orange-500 text-white"
                              : "text-gray-400 hover:text-white hover:bg-gray-800",
                            item.highlight && item.count > 0 && "border-l-2 border-orange-500"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="truncate">{item.name}</span>
                    
                          </div>
                          {item.count > 0 && (
                            <span className={cn(
                              "ml-2 px-2 py-0.5 rounded-full text-xs",
                              isMenuItemActive(item.href)
                                ? "bg-white/20"
                                : item.highlight
                                  ? "bg-orange-500/20 text-orange-400"
                                  : "bg-gray-700/50"
                            )}>
                              {item.count}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href={`/bands/${activeBand.id}/events`}
              className={cn(
                "flex items-center px-2 py-2 rounded-lg",
                pathname === `/bands/${activeBand.id}/events`
                  ? "bg-orange-500 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              )}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Events
            </Link>

            <Link
              href={`/bands/${activeBand.id}/media`}
              className={cn(
                "flex items-center px-2 py-2 rounded-lg",
                pathname === `/bands/${activeBand.id}/media`
                  ? "bg-orange-500 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              )}
            >
              <ImageIcon className="w-5 h-5 mr-2" />
              Media
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-gray-800 bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <User className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white truncate">
                {profile?.displayName || user?.email}
              </p>
              <p className="text-xs text-gray-400">{userRole || 'Unknown Role'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/profile-setup"
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-blue-500 hover:text-blue-400" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 text-orange-500 hover:text-orange-400" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}