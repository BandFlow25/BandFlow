// components/layout/PageTitleHeader.tsx
import AddSongButton from '@/components/ui/buttons/AddSongButton';
//import  AddMediaButton  from '@/components/ui/buttons/AddMediaButton';
//import  AddEventButton  from '@/components/ui/buttons/AddEventButton';

type PageType = 'songs' | 'setlists' | 'media' | 'events';

interface PageTitleHeaderProps {
  title: string;
  count?: number | undefined;  // Make count explicitly optional
  pageType?: PageType;
}

export function PageTitleHeader({
  title,
  count,
  pageType = 'songs'
}: PageTitleHeaderProps) {
  const renderActionButton = () => {
    switch (pageType) {
      case 'media':
      //return <AddMediaButton />;
      case 'events':
      //return <AddEventButton />;
      case 'setlists':
        return null;
      case 'songs':
      default:
        return <AddSongButton />;
    }
  };

  return (
    <div className="flex items-center justify-between px-12 h-14 bg-gray-900 border-b border-gray-800">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {typeof count === 'number' && (
          <span className="text-sm text-gray-400">({count} songs)</span>
        )}
      </div>
      
        {renderActionButton()}
   
    </div>
  );
}