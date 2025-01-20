import React from 'react';

type ComingSoonOverlayProps = {
  message?: string;
};

export default function ComingSoonOverlay({ message = "Coming Soon!" }: ComingSoonOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 text-white">
      <div className="text-center">
        <div className="text-3xl font-bold mb-4">
          {message}
        </div>
        <div className="p-4 bg-orange-500 rounded-full text-xl font-semibold rotate-12">
          {message}
        </div>
      </div>
    </div>
  );
}
