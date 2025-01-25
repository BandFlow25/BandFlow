// components/layout/navigation/Sidebar.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getBandMemberRole } from '@/lib/services/firebase/bands';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  Settings, LogOut, User, Home, Shuffle, Info
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
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const { activeBand, isAdmin, clearActiveBand } = useBand();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      setIsOpen(isLargeScreen);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (activeBand && user) {
      getBandMemberRole(activeBand.id, user.uid)
        .then((role) => setUserRole(role))
        .catch((err) => console.error('Error fetching user role:', err));
    }
  }, [activeBand, user]);

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

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden"
      >
        <Image
          src="/bf-logo.png"
          alt="BandFlow"
          width={32}
          height={32}
          className="rounded-full"
        />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}


<aside className={cn(
 "fixed lg:static top-0 left-0 w-[240px] bg-gray-900 flex flex-col",
 "z-40 border border-orange-500/50 transition-transform duration-200",
 isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
)}>
{/* Header - Single BF logo that handles both mobile/desktop */}
{/* Header - Single BF logo that handles both mobile/desktop */}
<Link 
  href={`/bands/${activeBand.id}`} 
  className="h-14 border-b border-gray-800 flex items-center px-6 hover:bg-gray-800/50"
>
  <div className="flex-1 pl-8">
    <h1 className="font-bold text-white">Band Flow 25</h1>
  </div>
  <div className="p-2 rounded-lg">
    <Home className="w-5 h-5 text-gray-400" />
  </div>
</Link>

 {/* Active Band - Reduced height */}
 <div className="px-6 py-3 border-b border-gray-800">
   <div className="flex justify-between items-center">
     <h2 className="text-xl font-bold text-white">{activeBand.name}</h2>
     <div className="flex flex-col gap-2">
       {isAdmin && (
         <Link
           href={`/bands/${activeBand.id}/settings`}
           className="p-2 rounded-lg hover:bg-gray-800"
         >
           <Settings className="w-5 h-5 text-blue-500" />
         </Link>
       )}
       <Link
         href="/home"
         className="p-2 rounded-lg hover:bg-gray-800"
       >
         <Shuffle className="w-5 h-5 text-orange-500" />
       </Link>
     </div>
   </div>
 </div>

 {/* User Section - Reduced height */}
 <div className="px-6 py-3 border-b border-gray-800 bg-gray-800/50">
   <div className="flex justify-between items-center">
     <div className="flex items-center">
       <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center">
         <User className="w-4 h-4 text-orange-500" />
       </div>
       <div className="ml-3">
         <p className="font-medium text-white truncate">{profile?.displayName}</p>
         <p className="text-xs text-gray-400">{userRole || 'admin'}</p>
       </div>
     </div>
     <div className="flex flex-col gap-2">
       <Link 
         href={`/profile-setup`} 
         className="p-2 rounded-lg hover:bg-gray-700"
       >
         <Settings className="w-5 h-5 text-blue-500" />
       </Link>
       <button 
         onClick={handleLogout} 
         className="p-2 rounded-lg hover:bg-gray-700"
       >
         <LogOut className="w-5 h-5 text-orange-500" />
       </button>
     </div>
   </div>
 </div>

{/* About Link */}
<div className="mt-auto border-t border-gray-800">
  <div className="px-6 py-3 flex justify-between items-center">
    <Link href="/about" className="text-sm text-gray-400 hover:text-white">
      About Band Flow 25
    </Link>
    <div className="p-2 rounded-lg">
      <Info className="w-5 h-5 text-gray-400" />
    </div>
  </div>
</div>
</aside>
    </>
  );
}
