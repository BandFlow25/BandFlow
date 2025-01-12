import { Music4 } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Hero section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-6">
          <Music4 className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
          Welcome to BandFlow25
        </h1>
        
        <p className="text-gray-400 mb-8 max-w-md">
          Streamline your band's song management, from voting on new songs to 
          creating dynamic setlists.
        </p>

        {/* Coming Soon Message */}
        <div className="flex flex-col w-full gap-3 max-w-xs">
          <p className="bg-gray-800 text-white py-3 px-6 rounded-lg font-medium text-center">
            Coming Soon
          </p>
        </div>
      </div>

      {/* Features section */}
      <div className="bg-gray-800/50 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white text-center mb-6">
          Key Features
        </h2>
        <div className="grid gap-4 max-w-lg mx-auto text-sm">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium text-white mb-1">Democratic Song Selection</h3>
            <p className="text-gray-400">Vote on new songs and build your repertoire together</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium text-white mb-1">Progress Tracking</h3>
            <p className="text-gray-400">Monitor song readiness with RAG status indicators</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium text-white mb-1">Smart Setlists</h3>
            <p className="text-gray-400">Create and manage setlists with AI-powered suggestions</p>
          </div>
        </div>
      </div>
    </main>
  )
}
