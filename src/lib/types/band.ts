// src/lib/types/band.ts

import { Timestamp } from 'firebase/firestore';

export interface Band {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  socialLinks?: {
    [key: string]: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BandMember {
  userId: string;
  role: 'admin' | 'member';
  displayName: string;
  instruments: string[];
  joinedAt: Timestamp;
}

export interface CreateBandData {
  name: string;
  imageUrl?: string;
  description?: string;
  socialLinks?: {
    [key: string]: string;
  };
}