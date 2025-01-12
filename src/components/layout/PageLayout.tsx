// src/components/layout/PageLayout.tsx
import Sidebar from './navigation/Sidebar';
import AddSongButton from '@/components/ui/buttons/AddSongButton';
import { SongsProvider } from '@/contexts/SongProvider';
import Player from '@/components/ui/Player';

type PageLayoutProps = {
  children?: React.ReactNode;
  title: string;
}

export default function PageLayout({ children, title }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-900">
      <SongsProvider>
        <Sidebar />
        <main className="flex-1 w-0 min-w-0">
          {/* Adjusted header container */}
          <div className="flex items-center justify-between px-16 py-4">
            <h1 className="text-xl font-semibold text-white">{title}</h1>
            <AddSongButton />
          </div>
          {/* Main content */}
          <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <Player />
      </SongsProvider>
    </div>
  );
}