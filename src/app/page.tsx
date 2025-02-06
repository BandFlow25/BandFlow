'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Music4 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { BndyLogo } from '@/components/ui/bndylogo';
import { cn } from '@/lib/utils';
import { personas } from '@/lib/constants/personas';
import type { PersonaType } from '@/lib/types/persona';






export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [activePersona, setActivePersona] = useState<PersonaType>('band');

  useEffect(() => {
    if (user) {
      router.push('/home');
    }
  }, [user, router]);

  const currentPersona = personas[activePersona];

  return (
    <div className="landing-page">
      <section className="landing-hero text-center">
        <div className={cn(
          "logo transition-all",
          currentPersona.colors.icon.bg
        )}>
          <Music4 className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl md:text-3xl text-white mb-2">Welcome to</h1>

        <div className={cn(
          "w-48 md:w-64 mx-auto mb-8 transition-all",
          currentPersona.colors.logo
        )}>
          <BndyLogo />
        </div>

        <p className="subtitle mt-2">
          {currentPersona.tagline}
        </p>

        <Link href="/login">
          <button 
            className={cn(
              "button-primary transition-all",
              currentPersona.colors.button.bg,
              currentPersona.colors.button.hover
            )}
          >
            Sign In
          </button>
        </Link>
      </section>

      <section className="landing-features">
        <h2>Key Features</h2>
        <div className="space-y-4">
          {currentPersona.features.map((feature, index) => (
            <div key={index} className="feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="mt-16 text-center border-t border-gray-800 pt-8">
        <h3 className="text-gray-400 mb-4">Coming Soon to bndy</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {(Object.values(personas)).map((persona) => (
            <button
              key={persona.id}
              onClick={() => setActivePersona(persona.id)}
              className={cn(
                "px-4 py-1 rounded-full border text-sm transition-all",
                activePersona === persona.id
                  ? cn(persona.colors.logo, "border-current")
                  : "border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-600"
              )}
            >
              {persona.title}
            </button>
          ))}
        </div>
      </section>
    
    </div>

    
  );
}