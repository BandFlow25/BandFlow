import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useModal } from '@/contexts/ModalProvider';

export default function AddSongButton() {
  const [open, setOpen] = useState(false);
  const { openAddSong } = useModal();

  const handleClick = () => {
    setOpen(!open);
    openAddSong();
  };

  return (
    <button 
      onClick={handleClick} 
      className="absolute top-2 right-4 rounded-full bg-orange-500 p-2 hover:bg-orange-400 transition-colors"
    >
      
        <Plus className="w-6 h-6 text-white" />
   
    </button>
  );
}