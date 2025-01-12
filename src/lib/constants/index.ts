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
  BAND_SONGS: 'bf_band_songs', // Updated to match our Firebase collection
  SETLISTS: 'setlists', //is there an issue here with the way FS concats this with bf_bands???
} as const;


