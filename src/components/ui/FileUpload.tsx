// components/ui/FileUpload.tsx
import { useRef } from 'react';

interface FileUploadProps {
 accept: string;
 onUpload: (file: File) => void;
}

export function FileUpload({ accept, onUpload }: FileUploadProps) {
 const inputRef = useRef<HTMLInputElement>(null);

 return (
   <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
     <input
       type="file"
       accept={accept}
       onChange={(e) => {
         const file = e.target.files?.[0];
         if (file) onUpload(file);
       }}
       ref={inputRef}
       className="hidden"
     />
     <button
       onClick={() => inputRef.current?.click()}
       className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
     >
       Upload Setlist Image
     </button>
     <p className="mt-2 text-sm text-gray-400">
       Upload an image of your setlist to bulk import songs
     </p>
   </div>
 );
}

