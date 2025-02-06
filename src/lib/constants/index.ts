// src/lib/constants/index.ts
export const APP_NAME = 'bndy';

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

// src/lib/constants/index.ts
export const COLLECTIONS = {
  USERS: 'bf_users',
  BANDS: 'bf_bands',
  BASE_SONGS: 'bf_base_songs',
  // Subcollections under BANDS
  BAND_SONGS: 'songs',
  BAND_MEMBERS: 'members',
  SETLISTS: 'setlists',
  BAND_INVITES: 'invites',  // Add this new subcollection
} as const;