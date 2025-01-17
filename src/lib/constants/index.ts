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
  // Subcollections under BANDS
  BAND_SONGS: 'songs',      // bf_bands/{bandId}/songs
  BAND_MEMBERS: 'members',  // bf_bands/{bandId}/members
  SETLISTS: 'setlists',    // bf_bands/{bandId}/setlists

  //BAND_SONGS was previously bf_band_songs - queried with both bandid & songid
  //BAND_MEMBERS was previously bf_band_members
} as const;