// src/lib/services/firebase/setlists.ts
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    query,
    orderBy,
    Timestamp
  } from 'firebase/firestore';
  import { db } from '@/lib/config/firebase';
  import { COLLECTIONS } from '@/lib/constants';
  import type { BandSong } from '@/lib/types/song';
  import type { Setlist, SetlistSet, SetlistFormat, SetlistSong } from '@/lib/types/setlist';
  import { nanoid } from 'nanoid';
  
  const getSetlistsCollection = (bandId: string) => 
    collection(db, COLLECTIONS.BANDS, bandId, COLLECTIONS.SETLISTS);
  
  /**
   * Creates a new setlist 
   */
  export async function createSetlist(
    bandId: string,
    userId: string,
    name: string,
    format: SetlistFormat,
    selectedSongs?: BandSong[]
  ): Promise<string> {
    const setlistRef = doc(getSetlistsCollection(bandId));
    const now = Timestamp.now();
  
    // Initialize sets based on format
    const sets: SetlistSet[] = [...Array(format.numSets)].map((_, i) => ({
        id: `set-${i + 1}`,
        name: `Set ${i + 1}`,
        targetDuration: format.setDuration,
        songs: []
      }));
  
    // Add extras set
    sets.push({
        id: 'extras',
        name: 'Extras',
        targetDuration: 0,
        songs: []
      });

    // If songs were selected, distribute them across sets
 if (selectedSongs?.length && sets.length > 0) {
  let currentSetIndex = 0;
  let currentSetDuration = 0;

  selectedSongs.forEach((song, index) => {
    const songDuration = song.metadata?.duration 
      ? parseInt(song.metadata.duration, 10) 
      : 0;
    
    // Check the current set exists
    const currentSet = sets[currentSetIndex];
    if (!currentSet) return;
   
    // Check if we need to move to next set
    if (currentSetDuration + songDuration > format.setDuration * 60 && 
        currentSetIndex < format.numSets - 1) {
      currentSetIndex++;
      currentSetDuration = 0;
    }
   
    // Add song to current set
    currentSet.songs.push({
      id: nanoid(),       // Generate unique instance ID
      songId: song.id,    // Reference to original song
      setNumber: currentSetIndex + 1,
      position: index,
      isPlayBookActive: true
    });
    currentSetDuration += songDuration;
   });
}
  
    const setlist: Omit<Setlist, 'id'> = {
      name,
      bandId,
      createdBy: userId,
      format,
      sets,
      createdAt: now,
      updatedAt: now
    };
  
    await setDoc(setlistRef, setlist);
    return setlistRef.id;
  }
  
  /**
   * Gets all setlists for a band
   */
  export async function getBandSetlists(bandId: string): Promise<Setlist[]> {
    const setlistsRef = getSetlistsCollection(bandId);
    const q = query(setlistsRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
  
    // Get all setlists with their basic data
    const setlists = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Setlist[];
  
    // Load song details for each setlist
    const setlistsWithDetails = await Promise.all(setlists.map(async (setlist) => {
      const songIds = setlist.sets
        .flatMap(set => set.songs)
        .map(song => song.songId);
        
      const uniqueSongIds = [...new Set(songIds)];
      
      // Load song details including status
      const songDetails: Record<string, BandSong> = {};
      for (const songId of uniqueSongIds) {
        const songRef = doc(db, COLLECTIONS.BANDS, bandId, COLLECTIONS.BAND_SONGS, songId);
        const songSnap = await getDoc(songRef);
        if (songSnap.exists()) {
          songDetails[songId] = { 
            id: songSnap.id,
            ...songSnap.data()
          } as BandSong;
        }
      }
  
      return {
        ...setlist,
        songDetails
      };
    }));
  
    return setlistsWithDetails;
  }
  /**
   * Gets a specific setlist by ID
   */
  export async function getSetlist(bandId: string, setlistId: string): Promise<Setlist | null> {
    try {
      const setlistRef = doc(db, COLLECTIONS.BANDS, bandId, 'setlists', setlistId);
      const setlistSnap = await getDoc(setlistRef);
      
      if (!setlistSnap.exists()) return null;
      
      const setlistData = setlistSnap.data() as Setlist;
      
      // Make sure we're loading song details for all songs
      const songIds = setlistData.sets
        .flatMap(set => set.songs)
        .map(song => song.songId);
        
      const uniqueSongIds = [...new Set(songIds)];
      
      // Load song details
      const songDetails: Record<string, BandSong> = {};
      for (const songId of uniqueSongIds) {
        const songRef = doc(db, COLLECTIONS.BANDS, bandId, COLLECTIONS.BAND_SONGS, songId);
        const songSnap = await getDoc(songRef);
        if (songSnap.exists()) {
          songDetails[songId] = { id: songSnap.id, ...songSnap.data() } as BandSong;
        }
      }
      
      return {
        ...setlistData,
        id: setlistSnap.id,
        songDetails
      };
    } catch (error) {
      console.error('Error fetching setlist:', error);
      return null;
    }
  }
  
  /**
   * Updates a setlist's sets (song order, additions, removals)
   */
  export async function updateSetlistSets(
    bandId: string, 
    setlistId: string, 
    sets: Setlist['sets']
  ): Promise<void> {
    const setlistRef = doc(getSetlistsCollection(bandId), setlistId);
    
    await updateDoc(setlistRef, {
      sets,
      updatedAt: Timestamp.now()
    });
  }
  
  /**
   * Updates setlist metadata (name, format)
   */
  export async function updateSetlistMetadata(
    bandId: string,
    setlistId: string,
    updates: Partial<Pick<Setlist, 'name' | 'format'>>
  ): Promise<void> {
    const setlistRef = doc(getSetlistsCollection(bandId), setlistId);
    
    await updateDoc(setlistRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }
  
  /**
   * Duplicates an existing setlist
   */
  export async function duplicateSetlist(
    bandId: string,
    setlistId: string,
    newName: string,
    includeSongs: boolean = true
  ): Promise<string> {
    const originalSetlist = await getSetlist(bandId, setlistId);
    if (!originalSetlist) throw new Error('Original setlist not found');
  
    const newSetlistRef = doc(getSetlistsCollection(bandId));
    const now = Timestamp.now();
  
    const newSetlist: Omit<Setlist, 'id'> = {
      name: newName,
      bandId,
      createdBy: originalSetlist.createdBy,
      format: originalSetlist.format,
      sets: includeSongs 
        ? originalSetlist.sets 
        : originalSetlist.sets.map(set => ({
            ...set,
            songs: []
          })),
      createdAt: now,
      updatedAt: now
    };
  
    await setDoc(newSetlistRef, newSetlist);
    return newSetlistRef.id;
  }
  
  /**
   * Deletes a setlist
   */
  export async function deleteSetlist(bandId: string, setlistId: string): Promise<void> {
    const setlistRef = doc(getSetlistsCollection(bandId), setlistId);
    await deleteDoc(setlistRef);
  }