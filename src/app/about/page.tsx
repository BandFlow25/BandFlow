'use client';

import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { ExternalLink, Sparkles, MessageCircle } from 'lucide-react';
import { BndyLogo } from '@/components/ui/bndylogo';

const features = [
  {
    title: 'Events Management',
    description: 'Schedule and manage gigs, rehearsals, and band meetings.'
  },
  {
    title: 'Media Library',
    description: 'Store and organize band photos, videos, and recordings.'
  },
  {
    title: 'AI Setlist Generation',
    description: "Smart setlist suggestions based on your band's style and preferences."
  }
];

export default function AboutPage() {
  const handleFeatureRequest = () => {
    window.open('https://github.com/yourusername/bndy/issues/new?labels=enhancement&template=feature_request.md', '_blank');
  };

  return (
    <PageLayout title="">
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {/* About Section */}
        <section className="space-y-4">
          <div className="text-foreground">
            <span className="inline-block w-14 align-middle -mt-1 text-primary">
              <BndyLogo />
            </span>
            {' '}is a collaborative platform for bands to manage their song repertoire, from initial suggestions through to performance-ready setlists.
          </div>
        </section>

        {/* Upcoming Features */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="text-primary" />
            Upcoming Features
          </h2>
          <div className="grid gap-4">
            {features.map((feature) => (
              <div key={feature.title} className="feature-card">
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-secondary-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Requests */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="text-primary" />
            Feature Requests
          </h2>
          <div className="text-foreground">
            Have an idea for a feature that would make{' '}
            <span className="inline-block w-14 align-middle -mt-1 text-primary">
              <BndyLogo />
            </span>
            {' '}better for your band?
          </div>
        
          <Button
            onClick={handleFeatureRequest}
            className="button-primary !w-auto flex items-center gap-2"
          >
            Submit Feature Request
            <ExternalLink className="w-4 h-4" />
          </Button>
        </section>

        <footer className="pt-8 border-t border-border">
          <p className="text-sm text-secondary-foreground">
            Version 25.1.0 • Released January 2025
          </p>
        </footer>
      </div>
    </PageLayout>
  );
}