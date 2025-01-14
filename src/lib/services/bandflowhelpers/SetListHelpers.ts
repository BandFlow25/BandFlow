// lib/services/bandflowhelpers/SetListHelpers.ts
import type { BandSong } from '@/lib/types/song';

export function DurationtoMinSec(seconds: number, includeSeconds = true): string {
  if (typeof seconds !== 'number' || isNaN(seconds)) {
    return '--:--';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (!includeSeconds) {
    return hours > 0 
      ? `${hours}:${minutes.toString().padStart(2, '0')}`
      : minutes.toString();
  }

  // Only include hours if they are greater than 0
  if (hours > 0) {
    return remainingSeconds === 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}`
      : `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Default case for minutes and seconds
  return remainingSeconds === 0
    ? `${minutes}`
    : `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Simplified to just sum the seconds
export const calculateSetDurationInSeconds = (songs: (BandSong | undefined)[]): number => {
  return songs.reduce((total, song) => {
    if (!song?.metadata?.duration) return total;
    return total + parseInt(song.metadata.duration, 10);
  }, 0);
};

// Simplified duration info with clearer calculation
export const getSetDurationInfo = (durationSeconds: number, targetMinutes: number) => {
  const durationMinutes = durationSeconds / 60;
  const variance = Math.abs(durationMinutes - targetMinutes);
  const variancePercent = (variance / targetMinutes) * 100;
  
  console.log('Duration Info:', {
    durationSeconds,
    targetMinutes,
    durationMinutes,
    variance,
    variancePercent
  });
  
  let color;
  if (variancePercent <= 8) {
    color = 'text-green-400';
    console.log('Color set to blue - within 8% variance');
  } else if (durationMinutes < targetMinutes) {
    color = 'text-yellow-400';
    console.log('Color set to amber - duration less than target');
  } else {
    color = 'text-red-400';
    console.log('Color set to red - duration exceeds target');
  }
  
  return {
    color,
    duration: DurationtoMinSec(durationSeconds),
    isUndertime: durationMinutes < targetMinutes,
    variancePercent
  };
};