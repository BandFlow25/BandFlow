//src/components/layout/RootWrapper.tsx
'use client';

import { useState } from 'react';
import AddSongModal from '@/components/songs/AddSongModal';
//TODO:import {Createsetlismodal} from '@/components/songs/AddSongModal';

export default function RootWrapper({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {children}
      <AddSongModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}