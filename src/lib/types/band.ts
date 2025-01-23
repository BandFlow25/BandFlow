// src/lib/types/band.ts
import { Timestamp } from 'firebase/firestore';
import type { UserProfile } from '@/lib/services/firebase/auth';

export interface Band {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BandMember {
  id?: string;
  userId: string;
  role: 'admin' | 'member';
  displayName: string;
  instruments: string[];
  joinedAt: Timestamp;
  inviteCode?: string;
}

export interface BandInvite {
  bandId: string;
  inviteCode: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  uses: {
    userId: string;
    joinedAt: Timestamp;
    displayName: string;
  }[];
}

export interface CreateBandData {
  name: string;
  imageUrl?: string;
  description?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
}