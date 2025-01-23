//src\components\ui\ShareButton.tsx
import React from 'react';
import { Share } from 'lucide-react';

interface ShareInviteButtonProps {
  inviteUrl: string;
  bandName: string;
  className?: string;
}

export function ShareInviteButton({ inviteUrl, bandName, className = '' }: ShareInviteButtonProps) {
  const shareToWhatsApp = () => {
    const message = encodeURIComponent(
      `Join my band "${bandName}" on BandFlow25!\n\n${inviteUrl}`
    );
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={shareToWhatsApp}
      className={`inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-2 rounded-lg transition-colors ${className}`}
    >
      <Share className="w-5 h-5" />
      Share via WhatsApp
    </button>
  );
}