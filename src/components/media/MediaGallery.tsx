//src/components/media/components/MediaGallery.tsx
import { useState } from 'react';
import { Upload, Image as ImageIcon, FileText, Video, X, Plus } from 'lucide-react';

type MediaItem = {
  id: string;
  type: 'image' | 'video' | 'pdf';
  url: string;
  name: string;
  thumbnailUrl?: string;
};

export default function MediaGallery() {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [items] = useState<MediaItem[]>([
    { id: '1', type: 'image', url: '/placeholder.jpg', name: 'Band Photo' },
    { id: '2', type: 'video', url: '/video.mp4', name: 'Practice Session' },
    { id: '3', type: 'pdf', url: '/doc.pdf', name: 'Stage Plan' },
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-8 h-8" />;
      case 'video': return <Video className="w-8 h-8" />;
      case 'pdf': return <FileText className="w-8 h-8" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors">
          <Upload className="w-5 h-5" />
          Upload Media
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer"
            onClick={() => setSelectedItem(item)}
          >
            <div className="aspect-video flex items-center justify-center bg-gray-900 rounded-lg mb-2">
              {getIcon(item.type)}
            </div>
            <p className="text-white truncate">{item.name}</p>
          </div>
        ))}
        
        {/* Add New Placeholder */}
        <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
          <div className="text-center">
            <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <span className="text-gray-400">Add Media</span>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{selectedItem.name}</h3>
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                {getIcon(selectedItem.type)}
              </div>
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg">
                  Download
                </button>
                <button className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}