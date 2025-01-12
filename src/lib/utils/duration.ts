// lib/utils/duration.ts
import type { BandSong } from '@/lib/types/song';

export function formatDuration(seconds: number, includeSeconds = true): string {
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
export function parseDuration(duration: string): number {
  if (!duration) return 0;
  
  const parts = duration.split(':');
  if (!Array.isArray(parts)) return 0;
  
  const numbers = parts.map(p => parseInt(p, 10));
  if (numbers.some(n => isNaN(n))) return 0;
  
  if (parts.length === 3) {
    return (numbers[0] ?? 0) * 3600 + (numbers[1] ?? 0) * 60 + (numbers[2] ?? 0);
  }
  if (parts.length === 2) {
    return (numbers[0] ?? 0) * 60 + (numbers[1] ?? 0);
  }
  return (numbers[0] ?? 0) * 60;
}

export function calculateSetDuration(songs: (BandSong | undefined)[]): string {
  if (!Array.isArray(songs)) return '0';
  
  const totalSeconds = songs.reduce((total, song) => {
    if (!song?.metadata?.duration) return total;
    return total + parseDuration(song.metadata.duration);
  }, 0);

  const minutes = Math.floor(totalSeconds / 60);
  return minutes.toString();
}