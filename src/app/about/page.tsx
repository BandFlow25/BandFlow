// app/about/page.tsx
'use client';

import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { ExternalLink, Sparkles, MessageCircle } from 'lucide-react';

export default function AboutPage() {
 const handleFeatureRequest = () => {
   window.open('https://github.com/yourusername/bndy/issues/new?labels=enhancement&template=feature_request.md', '_blank');
 };

 return (
   <PageLayout title="About">
     <div className="max-w-3xl mx-auto p-6 space-y-8">
       <section className="space-y-4">
         
         <p className="text-gray-300">
         <span className="bndy-font-small">bndy</span> is a collaborative platform for bands to manage their song repertoire, from initial suggestions through to performance-ready setlists.
         </p>
       </section>

       <section className="space-y-4">
         <h2 className="text-2xl font-bold text-white flex items-center gap-2">
           <Sparkles className="text-orange-500" />
           Upcoming Features
         </h2>
         <div className="grid gap-4">
           <div className="bg-gray-800 p-4 rounded-lg">
             <h3 className="font-semibold text-white mb-2">Events Management</h3>
             <p className="text-gray-400">Schedule and manage gigs, rehearsals, and band meetings.</p>
           </div>
           <div className="bg-gray-800 p-4 rounded-lg">
             <h3 className="font-semibold text-white mb-2">Media Library</h3>
             <p className="text-gray-400">Store and organize band photos, videos, and recordings.</p>
           </div>
           <div className="bg-gray-800 p-4 rounded-lg">
             <h3 className="font-semibold text-white mb-2">AI Setlist Generation</h3>
             <p className="text-gray-400">Smart setlist suggestions based on your band's style and preferences.</p>
           </div>
         </div>
       </section>

       <section className="space-y-4">
         <h2 className="text-2xl font-bold text-white flex items-center gap-2">
           <MessageCircle className="text-orange-500" />
           Feature Requests
         </h2>
         <p className="text-gray-300">
           Have an idea for a feature that would make <span className="bndy-font-small">bndy</span> better for your band?
         </p>
         <Button 
           onClick={handleFeatureRequest}
           className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
         >
           Submit Feature Request
           <ExternalLink className="w-4 h-4" />
         </Button>
       </section>

       <footer className="pt-8 border-t border-gray-800">
         <p className="text-sm text-gray-400">
           Version 25.1.0 • Released January 2025
         </p>
       </footer>
     </div>
   </PageLayout>
 );
}