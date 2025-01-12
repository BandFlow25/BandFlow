// src/components/ui/loading.tsx
export const SpinnerSVG = () => (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
  
  export const ButtonLoader = ({ text = "Loading..." }: { text?: string }) => (
    <div className="flex items-center justify-center gap-2">
      <SpinnerSVG />
      <span>{text}</span>
    </div>
  );
  
  export const PageLoader = () => (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <SpinnerSVG />
        <span className="text-gray-400">Loading...</span>
      </div>
    </div>
  );
  
  export const SkeletonCard = () => (
    <div className="animate-pulse bg-gray-800 rounded-lg p-4">
      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
    </div>
  );