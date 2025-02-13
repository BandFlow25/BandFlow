//src/components/layout/PageLayout.tsx

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
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 w-0 min-w-0 flex flex-col h-screen overflow-hidden">
          <PageTitleHeader 
            title={title} 
            count={count} 
            pageType={pageType} 
          />
          <div className="flex-1 overflow-hidden bg-background">
            {children}
          </div>
        </main>
        <Player />
      </div>
    </SongsProvider>
  );
}