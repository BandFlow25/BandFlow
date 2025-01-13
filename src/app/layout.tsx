// layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthProvider';
import { BandProvider } from '@/contexts/BandProvider';
import { SetlistProvider } from '@/contexts/SetlistProvider';
import { PlayerContextProvider } from '@/contexts/PlayerContext';
import { ModalProvider } from '@/contexts/ModalProvider';
import Player from '@/components/ui/Player';
import AddSongModal from '@/components/songs/AddSongModal';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: 'icons/apple-icon.png', sizes: '180x180' },
    ],
    other: [
      {
        rel: 'apple-touch-icon',
        url: 'icons/apple-icon.png',
      },
    ],
  },
};

export const viewport = { /* ... keep existing viewport ... */ };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PlayerContextProvider>
          <AuthProvider>
            <BandProvider>
              <SetlistProvider>
                <ModalProvider>
                  {children}
                  <AddSongModal />
                  <Player />
                </ModalProvider>
              </SetlistProvider>
            </BandProvider>
          </AuthProvider>
        </PlayerContextProvider>
      </body>
    </html>
  );
}