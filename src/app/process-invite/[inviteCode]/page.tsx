// src/app/process-invite/[inviteCode]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import ProcessInviteClient from './ProcessInviteClient';

export default function ProcessInvitePage() {
  const params = useParams();
  const inviteCode = params?.inviteCode as string;

  return (
    <div>
      <ProcessInviteClient inviteCode={inviteCode} />
    </div>
  );
}