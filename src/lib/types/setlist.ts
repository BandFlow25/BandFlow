// lib/types/setlist.ts
import { Timestamp } from 'firebase/firestore';
import { BandSong } from './song';

export interface SetlistSong {
  songId: string;
  setNumber: number;
  position: number;
  isPlayBookActive: boolean;
  transitionNote?: string;
}

export interface SetlistFormat {
  numSets: number;
  setDuration: number;  // in minutes
  breakDuration?: number;
  bufferTime?: number;
}

export interface Setlist {
  id: string;
  name: string;
  bandId: string;
  createdBy: string;
  format: SetlistFormat;
  songs: SetlistSong[];
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  songDetails?: Record<string, BandSong>;
}