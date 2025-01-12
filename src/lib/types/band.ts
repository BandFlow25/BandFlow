// src/lib/types/band.ts

import { Timestamp } from 'firebase/firestore';

export interface Band {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateBandData {
  name: string;
  description?: string;
  imageUrl?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
}

export interface BandMember {
  userId: string;
  bandId: string;
  role: 'admin' | 'member';
  displayName: string;
  instruments: string[];
  joinedAt: Timestamp;
}