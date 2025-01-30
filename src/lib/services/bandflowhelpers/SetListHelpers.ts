// lib/services/bandflowhelpers/SetListHelpers.ts
import type { BandSong } from '@/lib/types/song';
import type { SetlistSong } from '@/lib/types/setlist';

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

export const calculateSetDurationInSeconds = (songs: (BandSong | undefined)[], setlistSongs: SetlistSong[]): number => {
  return songs.reduce((total, song, index) => {
    if (!song?.metadata?.duration) return total;
    const setlistSong = setlistSongs[index];
    // Handle both null and undefined cases
    const setupTimeSeconds = setlistSong?.setupTime != null ? setlistSong.setupTime * 60 : 0;
    return total + parseInt(song.metadata.duration, 10) + setupTimeSeconds;
  }, 0);
};

export const getSetDurationInfo = (durationSeconds: number, targetMinutes: number) => {
  const durationMinutes = durationSeconds / 60;
  const variance = Math.abs(durationMinutes - targetMinutes);
  const variancePercent = (variance / targetMinutes) * 100;
  
  let color;
  if (variancePercent <= 8) {
    color = 'text-green-400';
  } else if (durationMinutes < targetMinutes) {
    color = 'text-yellow-400';
  } else {
    color = 'text-red-400';
  }
  
  return {
    color,
    duration: DurationtoMinSec(durationSeconds),
    isUndertime: durationMinutes < targetMinutes,
    variancePercent
  };
};