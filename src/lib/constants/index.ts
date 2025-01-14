// src/lib/constants/index.ts
export const APP_NAME = 'BandFlow25';

export const INSTRUMENTS = [
  'Vocals',
  'Guitar',
  'Rhythm Guitar', // Fixed typo in 'Guitar'
  'Bass',
  'Drums',
  'Keys',
  'Percussion',
  'Saxophone',
  'Trumpet',
  'Other'
] as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  BANDS: '/bands',
  PROFILE: '/bands/settings/profile',
} as const;

export const COLLECTIONS = {
  USERS: 'bf_users',
  BANDS: 'bf_bands',
  BASE_SONGS: 'bf_base_songs',
  // These are subcollections under BANDS
  BAND_SONGS: 'songs',     // NEW: subcollection path
  SETLISTS: 'setlists',    // Existing subcollection path
} as const;
