// src/lib/constants/colors.ts

export const STATUS_COLORS = {
    PLAYBOOK: {
      base: 'blue-500',
      light: 'blue-400',
      border: 'border-blue-500',
      bg: 'bg-blue-500',
      bgHover: 'hover:bg-blue-600',
      bgFaded: 'bg-blue-500/20',
      bgFadedHover: 'hover:bg-blue-500/30',
      text: 'text-blue-500',
      textLight: 'text-blue-400'
    },
    SUGGESTED: {
      base: 'orange-500',
      light: 'orange-400',
      border: 'border-orange-500',
      bg: 'bg-orange-500',
      bgHover: 'hover:bg-orange-600',
      bgFaded: 'bg-orange-500/20',
      bgFadedHover: 'hover:bg-orange-500/30',
      text: 'text-orange-500',
      textLight: 'text-orange-400'
    },
   
    PRACTICE: {
        base: 'yellow-400',
        light: 'yellow-300',
        border: 'border-yellow-400',
        bg: 'bg-gradient-to-b from-yellow-500/20 to-yellow-600/30',  // Brighter gradient
        bgHover: 'hover:bg-yellow-500',
        bgFaded: 'bg-yellow-400/20',  // No opacity for practice cards
        bgFadedHover: 'hover:bg-yellow-900',
        gradient: 'bg-gradient-to-b from-yellow-950/80 via-yellow-900/70 to-yellow-950/90',
        text: 'text-yellow-400',
        textLight: 'text-yellow-300'
    } as const,

    REVIEW: {
      base: 'green-500',
      light: 'green-400',
      border: 'border-green-500',
      bg: 'bg-green-500',
      bgHover: 'hover:bg-green-600',
      bgFaded: 'bg-green-500/20',
      bgFadedHover: 'hover:bg-green-500/30',
      text: 'text-green-500',
      textLight: 'text-green-400'
    },
    DISCARDED: {
      base: 'gray-600',
      light: 'gray-500',
      border: 'border-gray-600',
      bg: 'bg-gray-600',
      bgHover: 'hover:bg-gray-700',
      bgFaded: 'bg-gray-600/20',
      bgFadedHover: 'hover:bg-gray-600/30',
      text: 'text-white-600',
      textLight: 'text-white-500'
    },
    PARKED: {
      base: 'blue-500',  // Different shade than PLAYBOOK if needed
      light: 'blue-400',
      border: 'border-blue-500',
      bg: 'bg-blue-500',
      bgHover: 'hover:bg-blue-600',
      bgFaded: 'bg-blue-500/20',
      bgFadedHover: 'hover:bg-blue-500/30',
      text: 'text-white-500',
      textLight: 'text-blue-400'
    }
  } as const;
  
  // Helper function to get color classes
  export function getStatusColorClasses(status: keyof typeof STATUS_COLORS, variant: 'solid' | 'faded' = 'solid') {
    const colors = STATUS_COLORS[status];
    if (variant === 'faded') {
      return `${colors.bgFaded} ${colors.bgFadedHover} ${colors.text}`;
    }
    return `${colors.bg} ${colors.bgHover} text-white`;
  }