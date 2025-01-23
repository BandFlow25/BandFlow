// src/app/join/[inviteCode]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import JoinBandClient from './JoinBandClient';

export default function JoinBandPage() {
  const params = useParams();
  const inviteCode = params?.inviteCode as string;

  return (
    <div>
      <JoinBandClient inviteCode={inviteCode} />
    </div>
  );
}