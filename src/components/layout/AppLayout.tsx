//src/components/layout/AppLayout.tsx

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackNav?: boolean;
  backPath?: string;
  backLabel?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  footerClassName?: string;
  contentClassName?: string;
}

export function AppLayout({
  children,
  title,
  showBackNav = true,
  backPath,
  backLabel,
  action,
  footer,
  footerClassName,
  contentClassName
}: AppLayoutProps) {
  const { user } = useAuth();
  const { activeBand, isReady } = useBand();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!activeBand && pathname?.includes('/bands/') && !pathname?.includes('/create')) {
      router.push('/home');
    }
  }, [user, activeBand, pathname, router]);

  if (!isReady) {
    return (
      <div className="app-container">
        <div className="flex items-center justify-center flex-1">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  const defaultBackPath = activeBand 
    ? `/bands/${activeBand.id}` 
    : '/home';

  const defaultBackLabel = activeBand 
    ? 'Back to Band' 
    : 'Back to Home';

  return (
    <div className="app-container">
      {/* Fixed Header */}
      <header className="app-header safe-area-top">
        <div className="h-full flex items-center px-4">
          <div className="flex-1 flex items-center gap-4 min-w-0">
            {showBackNav && (
              <Link
                href={backPath || defaultBackPath}
                className="flex items-center text-gray-400 hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{backLabel || defaultBackLabel}</span>
              </Link>
            )}
            {title && (
              <h1 className="text-xl font-bold truncate text-foreground">{title}</h1>
            )}
          </div>
          {action && (
            <div className="flex-none ml-4">
              {action}
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className={cn(
        footer ? 'app-content-with-footer' : 'app-content',
        contentClassName
      )}>
        {children}
      </main>

      {/* Optional Footer */}
      {footer && (
        <footer className={cn(
          "app-footer safe-area-bottom",
          footerClassName
        )}>
          <div className="h-full flex items-center px-4">
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
}