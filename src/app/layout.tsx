import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthProvider';
import { BandProvider } from '@/contexts/BandProvider';
import { SongsProvider } from '@/contexts/SongProvider';
import { PlayerContextProvider } from '@/contexts/PlayerContext';
import { ModalProvider } from '@/contexts/ModalProvider';
import Player from '@/components/ui/Player';
import AddSongModal from '@/components/songs/Modals/AddSongModal';
import { viewport } from './viewport'; // Import the viewport config

export const metadata = {
  viewport, // Apply the viewport config
};

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <PlayerContextProvider>
          <AuthProvider>
            <BandProvider>
              <SongsProvider>
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
                  <div className="flex-1">{children}</div>
                  <AddSongModal />
                  <Player />
                </ModalProvider>
              </SongsProvider>
            </BandProvider>
          </AuthProvider>
        </PlayerContextProvider>
      </body>
    </html>
  );
}