// // components/songs/SetLists/SetlistSplitView.tsx
// import { useState } from 'react';
// import { useSongs } from '@/contexts/SongProvider';
// import type { Setlist } from '@/lib/types/setlist';
// import type { BandSong } from '@/lib/types/song';
// import { DndContext, DragOverlay, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
// //import { Button } from '@/components/ui/button';
// import { Search } from 'lucide-react';
// import { Input } from '@/components/ui/input';
// import { SetlistSongCard } from '@/components/songs/SongCard/SetListSongCard';

// interface SetlistSplitViewProps {
//   setlist: Setlist;
//   songDetails: Record<string, BandSong>;
//   selectedSetNumber: number;
//   onSongDrop: (songId: string, dropSetNumber: number) => Promise<void>;
//   onSongRemove: (songId: string) => void;
//   availableSongs: BandSong[]; // Songs not already in the setlist
// }

// export function SetlistSplitView({
//   setlist,
//   songDetails,
//   onSongDrop,
//   onSongRemove,
//   availableSongs
// }: SetlistSplitViewProps) {
//   const { songs = [] } = useSongs();
//   const [searchQuery, setSearchQuery] = useState('');
//   const [activeId, setActiveId] = useState<string | null>(null);
//   const [selectedSetNumber, setSelectedSetNumber] = useState<number>(1);

//   // Group songs alphabetically
//   const groupedSongs = songs.reduce((acc: Record<string, BandSong[]>, song) => {
//     const firstLetter = song.title?.[0]?.toUpperCase() || '';
//     if (!acc[firstLetter]) acc[firstLetter] = [];
//     acc[firstLetter].push(song);
//     return acc;
//   }, {});

//   // Filter songs based on search
//   const filteredGroups = Object.entries(groupedSongs).reduce((acc: Record<string, BandSong[]>, [letter, groupSongs]) => {
//     const filtered = groupSongs.filter(song =>
//       song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       song.artist.toLowerCase().includes(searchQuery.toLowerCase())
//     );
//     if (filtered.length > 0) acc[letter] = filtered;
//     return acc;
//   }, {});

//   const handleDragStart = (event: DragStartEvent) => {
//     setActiveId(event.active.id.toString());
//   };

//   const handleDragEnd = (event: DragEndEvent) => {
//     const { active, over } = event;

//     if (over && active.id !== over.id) {
//       if (over.id.toString().startsWith('set-')) {
//         const setNumber = parseInt(over.id?.toString().split('-')[1] || '0');
//         onSongDrop(active.id.toString(), setNumber);
//       }
//     }
//     setActiveId(null);
//   };

//   return (
//     <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
//       <div className="flex h-[calc(100vh-200px)]">
//         {/* Left side - Setlist and Sets */}
//         <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
//           <div className="p-4">
//             <h3 className="text-lg font-medium text-white mb-4">{setlist.name}</h3>
//             {Array.from({ length: setlist.format.numSets }).map((_, idx) => {
//               const setNumber = idx + 1;
//               const setSongs = setlist.songs.filter(s => s.setNumber === setNumber);

//               return (
//                 <div
//                   key={`set-${setNumber}`}
//                   className={`p-4 rounded-lg mb-4 ${selectedSetNumber === setNumber ? 'bg-gray-800' : 'bg-gray-800/50'
//                     }`}
//                   onClick={() => setSelectedSetNumber(setNumber)}
//                 >
//                   <h4 className="text-white mb-2">Set {setNumber}</h4>
//                   {setSongs.map((song, songIdx) => (
//                     <SetlistSongCard
//                       key={song.songId}
//                       songDetails={songDetails[song.songId]}
//                       position={songIdx + 1}
//                       setNumber={setNumber}
//                       onRemove={() => onSongRemove(song.songId)}
//                     />
//                   ))}
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Right side - Available Songs */}
//         <div className="w-2/3 overflow-hidden flex flex-col">
//           <div className="p-4 border-b border-gray-700">
//             <div className="relative">
//               <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//               <Input
//                 placeholder="Search songs..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-10 bg-gray-800 border-gray-700"
//               />
//             </div>
//           </div>

//           <div className="w-2/3 overflow-hidden flex flex-col">
//             <div className="flex-1 overflow-y-auto">
//               {Object.entries(filteredGroups)
//                 .sort(([a], [b]) => a.localeCompare(b)) // Sort A-Z
//                 .map(([letter, songs]) => (
//                   <div key={letter} className="mb-2">
//                     <div className="sticky top-0 bg-gray-900 text-xs font-medium text-gray-400 px-4 py-1">
//                       {letter}
//                     </div>
//                     <div className="space-y-0.5 px-4">
//                       {songs.map(song => (
//                         <div
//                           key={song.id}
//                           className="p-2 rounded bg-gray-800/50 hover:bg-gray-800 cursor-grab text-sm"
//                         >
//                           <div className="text-white truncate">{song.title}</div>
//                           <div className="text-xs text-gray-400 truncate">{song.artist}</div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           </div>
//         </div>

//         <DragOverlay>
//           {activeId ? (
//             <div className="p-2 rounded-lg bg-gray-800 shadow-lg">
//               <div className="font-medium text-white">
//                 {songs.find(s => s.id === activeId)?.title}
//               </div>
//             </div>
//           ) : null}
//         </DragOverlay>
//       </div>
//     </DndContext>
//   );
// }