// src/app/process-invite/[inviteCode]/ProcessInviteClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { useBand } from '@/contexts/BandProvider';
import { processInvite } from '@/lib/services/firebase/bands';

interface ProcessInviteClientProps {
  inviteCode: string;
}

export default function ProcessInviteClient({ inviteCode }: ProcessInviteClientProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { refreshBands } = useBand();
  const [error, setError] = useState('');

  useEffect(() => {
    const processInviteCode = async () => {
      if (!user || !inviteCode) {
        router.push('/');
        return;
      }

      if (!profile?.hasProfile) {
        router.push('/profile-setup');
        return;
      }

      try {
        await processInvite(inviteCode, user.uid);
        localStorage.removeItem('pendingInvite');
        
        // Wrap these operations in try-catch to prevent console errors
        try {
          await refreshBands();
        } catch (err) {
          // Ignore refresh errors since the write was successful
          console.debug('Non-critical error refreshing bands:', err);
        }
        
        // Small delay to ensure state updates
        setTimeout(() => {
          router.push('/home');
        }, 100);
      } catch (err) {
        console.error('Failed to process invite:', err);
        setError('Failed to process invite');
      }
    };

    processInviteCode();
  }, [user, profile, inviteCode, router, refreshBands]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Processing invite...</div>
    </div>
  );
}