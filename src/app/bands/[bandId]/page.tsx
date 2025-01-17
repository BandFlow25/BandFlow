// src/app/bands/[bandId]/page.tsx
'use client';
 
import { useEffect, useState } from 'react';
import { useBand } from '@/contexts/BandProvider';
import { SongHelpers } from '@/lib/services/bandflowhelpers/SongHelpers';
import { PageLayout } from '@/components/layout/PageLayout';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  BookOpen, ListMusic, Music, 
  ThumbsUp, GitBranch, Calendar,
  GraduationCap, ImageIcon
} from 'lucide-react';

export default function BandPage() {
  const { activeBand, isActiveBandLoaded, error } = useBand();
  const params = useParams();
  const [songCounts, setSongCounts] = useState({
    total: 0,
    active: 0,
    suggested: 0,
    voting: 0,
    review: 0,
    practice: 0,
    playbook: 0,
    parked: 0,
    discarded: 0
  });
  
  useEffect(() => {
    const loadSongCounts = async () => {
      if (activeBand?.id) {
        const counts = await SongHelpers.getAllSongCounts(activeBand.id);
        setSongCounts(counts);
      }
    };
    
    loadSongCounts();
  }, [activeBand?.id]);

  console.log('BandPage Initial Render:', {
    bandId: params?.bandId,
    activeBand: activeBand?.id,
    isLoaded: isActiveBandLoaded
  });

  if (!isActiveBandLoaded) {
    console.log('BandPage showing loading state');
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading band...</div>
      </div>
    );
  }

  if (error) {
    console.log('BandPage showing error state:', error);
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  if (!activeBand) {
    console.log('BandPage showing no active band state');
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Band not found</div>
      </div>
    );
  }

  console.log('BandPage rendering dashboard for band:', {
    bandId: activeBand.id,
    bandName: activeBand.name
  });

  const sections = [
    {
      title: `Play Book & Setlists`,
      description: "Create and manage setlists from your mastered songs",
      icon: <BookOpen className="w-6 h-6" />,
      href: `/bands/${activeBand.id}/playbook`,
      count: songCounts.playbook > 0 ? `${songCounts.playbook} songs` : null,
      color: "bg-green-500",
      primary: true
    },
    {
      title: "Song Pipeline",
      description: "Songs being evaluated and practiced by the band",
      icon: <GitBranch className="w-6 h-6" />,
      href: `/bands/${activeBand.id}/songs`,
      count: songCounts.practice + songCounts.voting + songCounts.suggested + songCounts.review > 0 ? 
        `${songCounts.practice + songCounts.voting + songCounts.suggested + songCounts.review} in progress` : null,
      color: "bg-orange-500"
    },
    {
      title: "Active Practice",
      description: "Songs currently being worked on by the band",
      icon: <GraduationCap className="w-6 h-6" />,
      href: `/bands/${activeBand.id}/songs?view=practice`,
      count: songCounts.practice > 0 ? `${songCounts.practice} practicing` : null,
      color: "bg-yellow-500"
    },
    {
      title: "Suggestions",
      description: "Vote and review potential new songs for the band",
      icon: <ThumbsUp className="w-6 h-6" />,
      href: `/bands/${activeBand.id}/songs?view=voting`,
      count: songCounts.voting + songCounts.suggested > 0 ? `${songCounts.voting + songCounts.suggested} to review` : null,
      color: "bg-blue-500"
    },
    {
      title: "Events",
      description: "Manage gigs, rehearsals and setlist planning",
      icon: <Calendar className="w-6 h-6" />,
      href: `/bands/${activeBand.id}/events`,
      color: "bg-purple-500"
    },
    {
      title: "Media",
      description: "Access band photos, videos, and files",
      icon: <ImageIcon className="w-6 h-6" />,
      href: `/bands/${activeBand.id}/media`,
      color: "bg-indigo-500"
    }
  ];

  return (
    <PageLayout title={`Welcome to ${activeBand.name}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="block p-6 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${section.color} transition-colors`}>
                {section.icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-1 group-hover:text-orange-500 transition-colors">
                  {section.title}
                </h2>
                <p className="text-sm text-gray-400">
                  {section.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </PageLayout>
  );
}