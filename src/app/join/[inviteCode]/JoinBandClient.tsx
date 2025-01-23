'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { validateInvite } from '@/lib/services/firebase/bands';

interface JoinBandClientProps {
  inviteCode: string;
}

export default function JoinBandClient({ inviteCode }: JoinBandClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkInvite = async () => {
      if (!inviteCode) {
        router.push('/login');
        return;
      }

      try {
        const { isValid } = await validateInvite(inviteCode);
        
        if (!isValid) {
          const path = user ? '/home' : '/login';
          router.push(`${path}?message=${encodeURIComponent("This invite link is not valid.")}`);
          return;
        }

        // Store valid invite code
        localStorage.setItem('pendingInvite', inviteCode);

        // Route based on auth state
        if (user) {
          router.push('/profile-setup');
        } else {
          router.push('/register');
        }
      } catch (error) {
        console.error('Error checking invite:', error);
        router.push('/login?message=' + encodeURIComponent("Something went wrong. Please try again."));
      } finally {
        setIsChecking(false);
      }
    };

    checkInvite();
  }, [inviteCode, user, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Checking invite link...</div>
      </div>
    );
  }

  return null;
}