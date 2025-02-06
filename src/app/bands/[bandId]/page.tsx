// src/app/bands/[bandId]/page.tsx 
'use client';

// Import necessary hooks and utilities from React and Next.js
import { useEffect, useState } from 'react';
import { useBand } from '@/contexts/BandProvider';
import { useTheme } from '@/contexts/ThemeProvider';
import { SongHelpers } from '@/lib/services/bndyhelpers/SongHelpers';
import { PageLayout } from '@/components/layout/PageLayout';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { BookOpen, GitBranch, Calendar, Settings, ImageIcon } from 'lucide-react';

// Define sections for different features of the band page
const sections = [
  {
    title: 'Play Book & Setlists',
    description: "Create and manage setlists from your performance-ready songs",
    icon: BookOpen,
    href: 'playbook',
    gradient: 'from-blue-500 to-purple-500', // Gradient styling for visual appeal
    countKey: 'playbook'
  },
  {
    title: 'Song Pipeline',
    description: "Songs being worked on by the band",
    icon: GitBranch,
    href: 'songs',
    gradient: 'from-orange-500 to-pink-500',
    countKey: 'active'
  },
  {
    title: 'Practice List',
    description: "Manage songs that you are practicing & getting gig ready",
    icon: Settings,
    href: 'practice',
    gradient: 'from-yellow-400 to-orange-500',
    countKey: 'practice'
  },
  {
    title: 'Events',
    description: "Manage gigs, rehearsals and setlist planning",
    icon: Calendar,
    href: 'events',
    gradient: 'from-purple-500 to-indigo-500'
  },
  {
    title: 'Media',
    description: "Access band photos, videos, and files",
    icon: ImageIcon,
    href: 'media',
    gradient: 'from-green-500 to-emerald-500'
  }
];

export default function BandPage() {
  // Retrieve active band information and theme settings
  const { activeBand, isReady } = useBand();
  
  // State to store song counts for different categories
  const [songCounts, setSongCounts] = useState<Record<string, number>>({});

  // Effect to load song counts when active band changes
  useEffect(() => {
    const loadSongCounts = async () => {
      if (activeBand?.id) {
        const counts = await SongHelpers.getAllSongCounts(activeBand.id);
        setSongCounts(counts || {});
      }
    };
    loadSongCounts();
  }, [activeBand?.id]);

  // Display loading screen if data is not ready or active band is not available
  if (!isReady || !activeBand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <PageLayout title="bndy">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
        {sections.map((section) => (
          <Link key={section.title} href={`/bands/${activeBand.id}/${section.href}`} className="group">
            <div className="feature-card">
              <div className="flex items-center gap-4">
                {/* Section Icon with gradient styling */}
                <div className={cn("feature-icon", "bg-gradient-to-br", section.gradient, "transform-gpu transition-transform")}>
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                
                {/* Section Title with Song Count */}
                <div className="flex-1 min-w-0 p-0">
                  <h2 className="feature-title truncate text-lg md:text-xl">
                    {section.title} {section.countKey && songCounts[section.countKey] !== undefined ? `(${songCounts[section.countKey] ?? 0})` : ''}
                  </h2>
                  <p className="text-sm text-gray-400">{section.description}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </PageLayout>
  );
}
