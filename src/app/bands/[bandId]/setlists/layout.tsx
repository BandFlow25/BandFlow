//src\app\bands\[bandId]\setlists\layout.tsx
'use client';

import { SetlistProvider } from '@/contexts/SetlistProvider';

export default function SetlistLayout({ children }: { children: React.ReactNode }) {
  return <SetlistProvider>{children}</SetlistProvider>;
}