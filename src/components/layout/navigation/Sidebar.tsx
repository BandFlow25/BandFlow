// src/components/layout/navigation/Sidebar.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import { useSongs } from '@/contexts/SongProvider';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getBandMemberRole, isUserBandAdmin } from '@/lib/services/firebase/bands';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  Music, Settings, LogOut, User,
  Menu, X, ChevronDown, ChevronRight,
  BookOpen, Calendar, ListMusic, ImageIcon, Shuffle
} from 'lucide-react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [songMenuOpen, setSongMenuOpen] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null); // State for the user role
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();
  const { activeBand, setActiveBandId } = useBand();
  const { songs } = useSongs();
  const searchParams = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(false); // State to track if the user is an admin
  useEffect(() => {
    const handleResize = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      setIsOpen(isLargeScreen);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);

    // Clean listeners on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (activeBand && user) {
      getBandMemberRole(activeBand.id, user.uid)
        .then((role) => setUserRole(role))
        .catch((err) => console.error('Error fetching user role:', err));

      isUserBandAdmin(user.uid, activeBand.id)
        .then((adminStatus) => setIsAdmin(adminStatus))
        .catch((err) => console.error('Error checking admin status:', err));
    }
  }, [activeBand, user]);

  const getSongCountByStatus = (status: string) => {
    return songs.filter(song => song.status === status).length;
  };

  const handleSwitchBand = () => {
    setActiveBandId(null);
    router.push('/home');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (!activeBand) return null;

  const playbookCount = getSongCountByStatus('PLAYBOOK');

  const songMenuItems = [
    {
      name: 'All Songs',
      href: `/bands/${activeBand.id}/songs`,
      icon: <Music className="w-4 h-4" />,
      count: songs.length,
      highlight: false
    },
    {
      name: 'Suggestions',
      href: `/bands/${activeBand.id}/songs?view=suggestions`,
      count: getSongCountByStatus('SUGGESTED'),
      highlight: true
    },
    {
      name: 'In Voting',
      href: `/bands/${activeBand.id}/songs?view=voting`,
      count: getSongCountByStatus('VOTING'),
      highlight: true
    },
    {
      name: 'In Review',
      href: `/bands/${activeBand.id}/songs?view=review`,
      count: getSongCountByStatus('REVIEW'),
      highlight: true
    },
    {
      name: 'Practice List',
      href: `/bands/${activeBand.id}/songs?view=practice`,
      count: getSongCountByStatus('PRACTICE'),
      highlight: true
    },
  ];

  const isMenuItemActive = (href: string) => {
    // For the Play Book route (main band page)
    if (href === `/bands/${activeBand.id}`) {
      return pathname === `/bands/${activeBand.id}`;
    }

    // For songs routes with view parameter
    if (href.includes('?view=')) {
      const itemView = href.split('?view=')[1];
      const currentView = searchParams?.get('view');
      return currentView === itemView;
    }

    // For All Songs (no view parameter)
    if (href === `/bands/${activeBand.id}/songs`) {
      return pathname === `/bands/${activeBand.id}/songs` && !searchParams?.get('view');
    }

    // For other routes
    return pathname === href;
  };

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
        "pt-12 lg:pt-0", // Add padding-top on mobile, remove on desktop
        {
          "translate-x-0": isOpen,
          "-translate-x-full": !isOpen,
          "lg:translate-x-0": true,
          "lg:static": true,
        }
      )}>

        {/* Updated header section */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <Image
              src="/bf-logo.png"
              alt="BandFlow"
              width={32}
              height={32}
              className="rounded-full"
            />
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white leading-tight">Band Flow 25</h1>
              <h2 className="text-sm text-gray-400">{activeBand.name}</h2>
            </div>
            <div className="flex flex-col gap-2">
              {isAdmin && (
                <Link
                  href={`/bands/${activeBand.id}/settings`}
                  className="text-blue-500 hover:text-blue-400"
                  title="Band Settings"
                >
                  <Settings className="w-5 h-5" />
                </Link>
              )}
              <button
                onClick={handleSwitchBand}
                className="text-orange-500 hover:text-orange-400"
                title="Select Band"
              >
                <Shuffle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            href={`/bands/${activeBand.id}`}
            className={cn(
              "flex items-center justify-between px-2 py-2 rounded-lg mb-4",
              pathname === `/bands/${activeBand.id}`
                ? "bg-orange-500 text-white"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            )}
          >
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              <span>Play Book</span>
            </div>
            {playbookCount > 0 && (
              <span className={cn(
                "ml-2 px-2 py-0.5 rounded-full text-xs",
                pathname === `/bands/${activeBand.id}`
                  ? "bg-white/20"
                  : "bg-gray-700/50"
              )}>
                {playbookCount}
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
                  <Music className="w-5 h-5 mr-2" />
                  <span>New Songs</span>
                </div>
                {songMenuOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {songMenuOpen && (
                <div className="ml-4 space-y-1 mt-2">
                  {songMenuItems.map((item) => (
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
                      <div className="flex items-center">
                        {item.icon && <span className="mr-2">{item.icon}</span>}
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

        <div className="mt-auto p-4 border-t border-gray-800 bg-gray-800/50">
          <Link href="/profile-setup" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <User className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white truncate">
                {profile?.displayName || user?.email}
              </p>
              <p className="text-xs text-gray-400">{userRole || 'Unknown Role'}</p>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Settings className="w-6 h-6 text-blue-500 hover:text-blue-400" />
              <LogOut className="w-6 h-6 text-orange-500 hover:text-orange-400" />
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}