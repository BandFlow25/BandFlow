// lib/services/bandflowhelpers/SongHelpers.ts

import { COLLECTIONS } from '@/lib/constants';
import { db } from '@/lib/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { SONG_STATUS, SongStatus, BandSong } from '@/lib/types/song';

/** Helper functions for getting song counts without needing full SongsProvider */
export const SongHelpers = {
  /** Get count of songs in a specific status */
  async getSongCountByStatus(bandId: string, status: SongStatus): Promise<number> {
    if (!bandId) return 0;

    try {
      const songsRef = collection(db, COLLECTIONS.BANDS, bandId, COLLECTIONS.BAND_SONGS);
      const statusQuery = query(songsRef, where('status', '==', status));
      const snapshot = await getDocs(statusQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting song count:', error);
      return 0;
    }
  },

  /** Get total count of all active songs (excluding parked, discarded, and playbook) */
  async getActiveSongCount(bandId: string): Promise<number> {
    if (!bandId) return 0;

    try {
      const songsRef = collection(db, COLLECTIONS.BANDS, bandId, COLLECTIONS.BAND_SONGS);
      const activeQuery = query(songsRef, 
        where('status', 'not-in', [
          SONG_STATUS.PARKED, 
          SONG_STATUS.DISCARDED,
          SONG_STATUS.PLAYBOOK
        ])
      );
      const snapshot = await getDocs(activeQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting active song count:', error);
      return 0;
    }
  },

  /** Calculate score for a song based on votes */
  calculateSongScore(song: BandSong): number {
    if (!song.votes) return 0;
    const totalVotes = Object.values(song.votes).reduce((sum, vote) => sum + vote.value, 0);
    // Use votingMemberCount stored on the song when it entered review
    const maxPossibleScore = (song.votingMemberCount || Object.keys(song.votes).length) * 5;
    return (totalVotes / maxPossibleScore) * 100;
  },

  /** Get total count of non-playbook songs (including active, parked, and discarded) */
  async getTotalSongCount(bandId: string): Promise<number> {
    if (!bandId) return 0;

    try {
      const songsRef = collection(db, COLLECTIONS.BANDS, bandId, COLLECTIONS.BAND_SONGS);
      const nonPlaybookQuery = query(songsRef, 
        where('status', '!=', SONG_STATUS.PLAYBOOK)
      );
      const snapshot = await getDocs(nonPlaybookQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting total song count:', error);
      return 0;
    }
  },

  /** Get all song counts at once to minimize database calls */
  async getAllSongCounts(bandId: string): Promise<{
    total: number;       // All non-playbook songs
    active: number;      // All songs excluding parked/discarded/playbook
    suggested: number;
    review: number;
    practice: number;
    playbook: number;
    parked: number;
    discarded: number;
  }> {
    if (!bandId) {
      return {
        total: 0,
        active: 0,
        suggested: 0,
        review: 0,
        practice: 0,
        playbook: 0,
        parked: 0,
        discarded: 0
      };
    }

    try {
      const songsRef = collection(db, COLLECTIONS.BANDS, bandId, COLLECTIONS.BAND_SONGS);
      const snapshot = await getDocs(songsRef);
      
      const counts = {
        total: 0,
        active: 0,
        suggested: 0,
        review: 0,
        practice: 0,
        playbook: 0,
        parked: 0,
        discarded: 0
      };

      snapshot.docs.forEach(doc => {
        const status = doc.data().status as SongStatus;
        // Count specific status
        counts[status.toLowerCase() as keyof typeof counts]++;
        
        // Count active songs (not parked, discarded, or playbook)
        if (status !== SONG_STATUS.PARKED && 
            status !== SONG_STATUS.DISCARDED && 
            status !== SONG_STATUS.PLAYBOOK) {
          counts.active++;
        }

        // Count total non-playbook songs
        if (status !== SONG_STATUS.PLAYBOOK) {
          counts.total++;
        }
      });

      return counts;
    } catch (error) {
      console.error('Error getting song counts:', error);
      return {
        total: 0,
        active: 0,
        suggested: 0,
        review: 0,
        practice: 0,
        playbook: 0,
        parked: 0,
        discarded: 0
      };
    }
  }
};