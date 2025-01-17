// src/components/layout/PageLayout.tsx
import Sidebar from './navigation/Sidebar';
import Player from '@/components/ui/Player';
import { SongsProvider } from '@/contexts/SongProvider';
import { PageTitleHeader } from './PageTitleHeader';

type PageLayoutProps = {
  children?: React.ReactNode;
  title: string;
  count?: number;
  pageType?: 'songs' | 'setlists' | 'media' | 'events';
}

export function PageLayout({ children, title, count, pageType = 'songs' }: PageLayoutProps) {
  return (
    <SongsProvider>
      <div className="flex min-h-screen bg-gray-900">
        <Sidebar />
        <main className="flex-1 w-0 min-w-0 flex flex-col">
          <PageTitleHeader title={title} count={count} pageType={pageType} />
          <div className="flex-1">
            {children}
          </div>
        </main>
        <Player />
      </div>
    </SongsProvider>
  );
}