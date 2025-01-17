// lib/services/firebase/setlists.ts
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,  
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import type { Setlist, SetlistSong } from '@/lib/types/setlist';
import { COLLECTIONS } from '@/lib/constants'; 

// Helper function to get setlists collection reference
const getSetlistsCollection = (bandId: string) => 
  collection(db, COLLECTIONS.BANDS, bandId, COLLECTIONS.SETLISTS);

interface CreateSetlistData {
  name: string;
  format: {
    numSets: number;
    setDuration: number;
  };
  songs: SetlistSong[];
}

export async function createSetlist(
  bandId: string,
  userId: string,
  data: CreateSetlistData
): Promise<string> {
  try {
    console.log('Creating setlist:', { bandId, userId });
    const setlistRef = doc(getSetlistsCollection(bandId));

    const setlist = {
      name: data.name,
      bandId,
      createdBy: userId,
      format: data.format,
      songs: data.songs,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log('Setlist data to save:', setlist);
    await setDoc(setlistRef, setlist);
    return setlistRef.id;
  } catch (error) {
    console.error("Error creating setlist:", error);
    throw error;
  }
}

export async function getBandSetlists(bandId: string): Promise<Setlist[]> {
  try {
    console.log('Getting setlists for band:', bandId);
    const snapshot = await getDocs(getSetlistsCollection(bandId));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Setlist[];
  } catch (error) {
    console.error("Error getting band setlists:", error);
    throw error;
  }
}

export async function getSetlist(bandId: string, setlistId: string): Promise<Setlist | null> {
  try {
    console.log('Getting setlist:', { bandId, setlistId });
    const setlistRef = doc(getSetlistsCollection(bandId), setlistId);
    const snapshot = await getDoc(setlistRef);
 
    if (!snapshot.exists()) {
      console.log('Setlist not found');
      return null;
    }

    const data = {
      id: snapshot.id,
      ...snapshot.data(),
      songDetails: {} // Initialize empty songDetails
    } as Setlist;

    console.log('Retrieved setlist:', data);
    return data;
  } catch (error) {
    console.error('Error getting setlist:', error);
    throw error;
  }
}

export async function updateSetlistSongs(
  bandId: string,
  setlistId: string,
  songs: SetlistSong[]
): Promise<void> {
  try {
    console.log('Updating setlist songs:', { bandId, setlistId });
    
    const songsBySet = songs.reduce<Record<number, SetlistSong[]>>((acc, song) => {
      const setNumber = song.setNumber;
      if (!acc[setNumber]) {
        acc[setNumber] = [];
      }
      acc[setNumber].push(song);
      return acc;
    }, {});

    const updatedSongs = Object.entries(songsBySet).flatMap(([setNumber, setSongs]) => 
      setSongs
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((song, index) => ({
          ...song,
          setNumber: parseInt(setNumber),
          position: index
        }))
    );

    const setlistRef = doc(getSetlistsCollection(bandId), setlistId);
    
    // Only update songs and updatedAt timestamp
    await updateDoc(setlistRef, {
      songs: updatedSongs,
      updatedAt: serverTimestamp()
    });
    
    console.log('Setlist songs updated successfully');
  } catch (error) {
    console.error('Error updating setlist songs:', error);
    throw error;
  }
}

export async function deleteSetlist(bandId: string, setlistId: string): Promise<void> {
  try {
    console.log('Deleting setlist:', { bandId, setlistId });
    const setlistRef = doc(getSetlistsCollection(bandId), setlistId);
    await deleteDoc(setlistRef);
    console.log('Setlist deleted successfully');
  } catch (error) {
    console.error('Error deleting setlist:', error);
    throw error;
  }
}

interface SetlistUpdateData {
  name?: string;
  format?: {
    numSets: number;
    setDuration: number;
  };
}

export async function updateSetlist(
  bandId: string,
  setlistId: string,
  data: SetlistUpdateData
): Promise<void> {
  try {
    console.log('Updating setlist:', { bandId, setlistId, data });
    const setlistRef = doc(getSetlistsCollection(bandId), setlistId);
    
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(setlistRef, updateData);
    console.log('Setlist updated successfully');
  } catch (error) {
    console.error('Error updating setlist:', error);
    throw error;
  }
}