// layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';  // Add this import
import { AuthProvider } from '@/contexts/AuthProvider';
import { BandProvider } from '@/contexts/BandProvider';
import { PlayerContextProvider } from '@/contexts/PlayerContext';
import { ModalProvider } from '@/contexts/ModalProvider';
import Player from '@/components/ui/Player';
import AddSongModal from '@/components/songs/AddSongModal';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PlayerContextProvider>
          <AuthProvider>
            <BandProvider>
              <ModalProvider>
                <Toaster 
                  position="top-center"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#1f2937',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10B981',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
                {children}
                <AddSongModal />
                <Player />
              </ModalProvider>
            </BandProvider>
          </AuthProvider>
        </PlayerContextProvider>
      </body>
    </html>
  );
}