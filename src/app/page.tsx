// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Music4 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';

const features = [
  {
    title: 'Democratic Song Selection',
    description: 'Vote on new songs and build your repertoire together'
  },
  {
    title: 'Progress Tracking',
    description: 'Monitor song readiness with RAG status indicators'
  },
  {
    title: 'Smart Setlists',
    description: 'Create and manage setlists with AI-powered suggestions'
  }
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/home');
    }
  }, [user, router]);

  return (
<div className="landing-page">
  <section className="landing-hero text-center">
    <div className="logo">
      <Music4 className="w-8 h-8 text-white" />
    </div>

    <h1 className="text-2xl md:text-3xl text-white">Welcome to</h1>

    <div className="bndy-font-large inline-block mt-2">
      <span className="combined-letter relative">
        <span className="letter b">b</span>
       
      </span>
      ndy
    </div>

    <p className="subtitle mt-6">
      Streamline your band's song management, from voting on new songs to creating dynamic setlists.
    </p>

        <Link href="/login">
          <button className="button-primary">Sign In</button>
        </Link>
      </section>

      <section className="landing-features">
        <h2>Key Features</h2>
        <div className="space-y-4">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}