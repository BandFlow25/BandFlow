import { Persona, PersonaType } from '@/lib/types/persona';

export const personas: Record<PersonaType, Persona> = {
    band: {
        id: 'band',
        title: 'Band Member',
        colors: {
          icon: {
            bg: 'bg-orange-500',
            text: 'text-white'
          },
          logo: 'text-orange-500',
          button: {
            bg: 'bg-orange-500',
            hover: 'hover:bg-orange-600'
          }
        },
    tagline: "Streamline your band's song management, from voting on new songs to creating dynamic setlists.",
    features: [
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
    ]
  },
  giggoer: {
    id: 'giggoer',
    title: 'Gig Goer',
    colors: {
      icon: {bg:'bg-green-500',text:'text-white'},
      logo: 'text-green-500',
      button: {bg:'bg-green-500',hover:'hover:bg-green-500'}
    },
    tagline: 'Find and follow your favorite bands, get notified about upcoming gigs near you.',
    features: [
      {
        title: 'Gig Notifications',
        description: 'Get alerts when your favorite bands are playing nearby'
      },
      {
        title: 'Band Following',
        description: 'Follow bands and venues to stay updated with their events'
      },
      {
        title: 'Smart Recommendations',
        description: 'Discover new bands based on your music preferences'
      }
    ]
  },
  venue: {
    id: 'venue',
    title: 'Venue',
    colors: {
      icon: {
        bg: 'bg-blue-500',
        text: 'text-white'
      },
      logo: 'text-blue-500',
      button: {
        bg: 'bg-blue-500',
        hover: 'hover:bg-blue-500'
      }
    },
    tagline: 'Find and book the perfect bands for your events, manage your live music calendar effectively.',
    features: [
      {
        title: 'AI-powered Talent Matching',
        description: 'Find the right bands based on your venue style and audience'
      },
      {
        title: 'Event Management',
        description: 'Organize your live music calendar and manage bookings efficiently'
      },
      {
        title: 'Crowd Analytics',
        description: 'Track audience engagement and optimize your entertainment schedule'
      }
    ]
  },
  studio: {
    id: 'studio',
    title: 'Studio',
    colors: {
      icon: {
        bg: 'bg-purple-500',
        text: 'text-white'
      },
      logo: 'text-purple-500',
      button: {
        bg: 'bg-purple-500',
        hover: 'hover:bg-purple-500'
      }
    },
    tagline: 'Manage your practice and recording spaces with smart booking and scheduling.',
    features: [
      {
        title: 'Room Scheduling',
        description: 'Streamline booking process for practice and recording rooms'
      },
      {
        title: 'Equipment Management',
        description: 'Track available equipment and maintain inventory for each room'
      },
      {
        title: 'Recurring Bookings',
        description: 'Handle regular band practice slots and long-term bookings'
      }
    ]
  },
  agent: {
    id: 'agent',
    title: 'Agent',
    colors: {
      icon: {
        bg: 'bg-red-500',
        text: 'text-white'
      },
      logo: 'text-red-500',
      button: {
        bg: 'bg-red-500',
        hover: 'hover:bg-red-500'
      }
    },
    tagline: 'Manage multiple bands or venues with centralized booking and performance tracking.',
    features: [
      {
        title: 'Portfolio Management',
        description: 'Manage multiple bands or venues from a single dashboard'
      },
      {
        title: 'Booking Automation',
        description: 'Streamline the booking process across your entire network'
      },
      {
        title: 'Performance Analytics',
        description: 'Track success metrics and optimize your business decisions'
      }
    ]
  }
};