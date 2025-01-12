// lib/types/song.ts
import { Timestamp } from 'firebase/firestore';

// Database-level status values - used when storing/updating song status
export const SONG_STATUS = {
  SUGGESTED: 'SUGGESTED',  // New song suggested to the band
  VOTING: 'VOTING',       // Band members are voting on the song
  REVIEW: 'REVIEW',       // Voting complete, ready for review
  PRACTICE: 'PRACTICE',   // Song approved for practice
  PLAYBOOK: 'PLAYBOOK',   // Song mastered and ready for performance
  DISCARDED: 'DISCARDED', // Song rejected by the band
  PARKED: 'PARKED'       // Song put on hold for later
} as const;

export type SongStatus = typeof SONG_STATUS[keyof typeof SONG_STATUS];

// URL-friendly route values - used in navigation and routing
export const SONG_LIST_TYPES = {
  ALL: 'all',               // Show all songs regardless of status
  SUGGESTIONS: 'suggestions', // Maps to SUGGESTED status
  VOTING: 'voting',         // Maps to VOTING status
  REVIEW: 'review',         // Maps to REVIEW status
  PRACTICE: 'practice',     // Maps to PRACTICE status
  PLAYBOOK: 'playbook',     // Maps to PLAYBOOK status
  PARKED: 'parked',         // Maps to PARKED status
  DISCARDED: 'discarded'    // Maps to DISCARDED status
} as const;

export type SongListType = typeof SONG_LIST_TYPES[keyof typeof SONG_LIST_TYPES];

// Bidirectional mapping between URL types and database status
export const STATUS_TO_LIST_TYPE: Record<SongStatus, Exclude<SongListType, 'all'>> = {
  [SONG_STATUS.SUGGESTED]: SONG_LIST_TYPES.SUGGESTIONS,
  [SONG_STATUS.VOTING]: SONG_LIST_TYPES.VOTING,
  [SONG_STATUS.REVIEW]: SONG_LIST_TYPES.REVIEW,
  [SONG_STATUS.PRACTICE]: SONG_LIST_TYPES.PRACTICE,
  [SONG_STATUS.PLAYBOOK]: SONG_LIST_TYPES.PLAYBOOK,
  [SONG_STATUS.PARKED]: SONG_LIST_TYPES.PARKED,
  [SONG_STATUS.DISCARDED]: SONG_LIST_TYPES.DISCARDED
} as const;

// UI display labels - used for rendering status in the interface
export const SONG_LIST_LABELS: Record<SongListType, string> = {
  [SONG_LIST_TYPES.ALL]: 'All Songs',
  [SONG_LIST_TYPES.SUGGESTIONS]: 'Suggestions',
  [SONG_LIST_TYPES.VOTING]: 'In Voting',
  [SONG_LIST_TYPES.REVIEW]: 'In Review',
  [SONG_LIST_TYPES.PRACTICE]: 'Practice List',
  [SONG_LIST_TYPES.PLAYBOOK]: 'Play Book',
  [SONG_LIST_TYPES.PARKED]: 'Parked',
  [SONG_LIST_TYPES.DISCARDED]: 'Discarded'
} as const;

// RAG (Red/Amber/Green) status types - used for practice readiness indication
export const RAG_STATUS = {
  RED: 'RED',       // Not ready/significant issues
  AMBER: 'AMBER',   // Partially ready/minor issues
  GREEN: 'GREEN',   // Fully ready/no issues
  GREY: 'GREY'      // Not yet evaluated
} as const;

export type RAGStatus = typeof RAG_STATUS[keyof typeof RAG_STATUS];

// Individual RAG vote structure
export interface RAGVote {
  status: RAGStatus;
  updatedAt: Timestamp;
}

// Individual member's vote on a song
export interface Vote {
  value: number;      // 0-5 rating
  updatedAt: Timestamp;
}

// Map of user IDs to their votes
export type VoteMap = Record<string, Vote>;

// Base song type - represents core song data
export interface BaseSong {
  id: string;
  title: string;
  artist: string;
  previewUrl: string;        // URL for song preview audio
  thumbnail?: string;        // URL for song artwork
  metadata?: {
    bpm?: number;           // Beats per minute
    key?: string;           // Musical key
    duration?: string;      // Song duration
  };
  metadataStatus?: 'pending' | 'complete' | 'failed';  // Status of metadata retrieval
  spotifyUid?: string;      // Spotify track identifier
  fullUrl?: string;         // Full song URL (if available)
  createdAt: Timestamp;     // When the song was added
  updatedAt: Timestamp;     // When the song was last modified
}

// Band-specific song type - extends BaseSong with band-related data
export interface BandSong extends BaseSong {
  baseSongId: string;       // Reference to original BaseSong
  bandId: string;          // ID of the band
  status: SongStatus;      // Current status in the band's workflow
  notes?: string;          // Band-specific notes
  votes?: VoteMap;         // Member voting records
  votingMemberCount?: number;  // Number of members who voted
  ragStatus?: Record<string, RAGVote>;  // Member RAG status votes
}