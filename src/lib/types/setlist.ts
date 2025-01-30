// src/lib/types/setlist.ts
import { Timestamp } from 'firebase/firestore';
import type { BandSong } from './song';

export interface SetlistFormat {
  numSets: number;
  setDuration: number;  // in minutes
}

export interface DropPosition {  
  setId: string;
  index: number;
}

export interface SetlistSong {
  id: string;         // Unique instance ID
  songId: string;     // Reference to the original song
  setNumber: number;
  position: number;
  isPlayBookActive?: boolean;
  segueIntoNext?: boolean;
  transitionNote?: string;
  setupTime: number | null;  // Changed to number | null from undefined
}

export interface SetlistSet {
  id: string;
  name: string;
  targetDuration: number;  // in minutes
  songs: SetlistSong[];
}

export interface Setlist {
  id: string;
  name: string;
  bandId: string;
  createdBy: string;
  format: SetlistFormat;
  sets: SetlistSet[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  songDetails?: Record<string, BandSong>;
}