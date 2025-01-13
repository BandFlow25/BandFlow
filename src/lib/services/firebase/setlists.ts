// lib/services/firebase/setlists.ts
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,  
  setDoc, 
  updateDoc, 
  deleteDoc,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import type { Setlist, SetlistSong } from '@/lib/types/setlist';
import { COLLECTIONS } from '@/lib/constants'; 

const createSetlistRef = (bandId: string) => 
collection(db, COLLECTIONS.BANDS, bandId, 'setlists');

// Create a new setlist
export async function createSetlist(
bandId: string,
userId: string,
data: {
  name: string;
  format: {
    numSets: number;
    setDuration: number;
  };
  songs: SetlistSong[];
}
): Promise<string> {
try {
  const setlistRef = doc(createSetlistRef(bandId));
  console.log("Firestore path:", `${COLLECTIONS.BANDS}/${bandId}/setlists/${setlistRef.id}`);

  const now = Timestamp.now();
  const setlist = {
    name: data.name,
    bandId,
    createdBy: userId,
    format: data.format,
    songs: data.songs,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(setlistRef, setlist);
  return setlistRef.id;
} catch (error) {
  console.error("Error creating setlist:", error);
  throw error;
}
}

// Get all setlists for a band
export async function getBandSetlists(bandId: string): Promise<Setlist[]> {
const setlistsRef = createSetlistRef(bandId);
const snapshot = await getDocs(setlistsRef);
return snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
})) as Setlist[];
}

// Get a single setlist
export async function getSetlist(bandId: string, setlistId: string): Promise<Setlist | null> {
  try {
    const setlistRef = doc(createSetlistRef(bandId), setlistId);
    const snapshot = await getDoc(setlistRef);
 
    if (!snapshot.exists()) {
      console.warn('getSetlist Debug - Document does not exist');
      return null;
    }

    const setlistData = {
      id: snapshot.id,
      ...snapshot.data(),
      songDetails: {} // Initialize empty songDetails
    } as Setlist;

    return setlistData;
  } catch (error) {
    console.error('getSetlist Debug - Error:', error);
    throw error;
  }
}
 

// Update setlist songs
export async function updateSetlistSongs(
  bandId: string,
  setlistId: string,
  songs: SetlistSong[]
): Promise<void> {
  try {
    // First, ensure all songs have valid positions within their sets
    const songsBySet = songs.reduce<Record<number, SetlistSong[]>>((acc, song) => {
      const setNumber = song.setNumber;
      if (!acc[setNumber]) {
        acc[setNumber] = [];
      }
      acc[setNumber].push(song);
      return acc;
    }, {});

    // Update positions within each set
    const updatedSongs = Object.entries(songsBySet).flatMap(([setNumber, setSongs]) => {
      return setSongs
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((song, index) => ({
          ...song,
          setNumber: parseInt(setNumber),
          position: index,
        }));
    });

    const setlistRef = doc(createSetlistRef(bandId), setlistId);
    await updateDoc(setlistRef, {
      songs: updatedSongs,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating setlist songs:', error);
    throw error;
  }
}

// Delete setlist
export async function deleteSetlist(bandId: string, setlistId: string): Promise<void> {
const setlistRef = doc(createSetlistRef(bandId), setlistId);
await deleteDoc(setlistRef);
}

// Duplicate setlist
export async function duplicateSetlist(
bandId: string,
setlistId: string,
newName: string
): Promise<string> {
const originalSetlist = await getSetlist(bandId, setlistId);
if (!originalSetlist) throw new Error('Setlist not found');

const newSetlistRef = doc(createSetlistRef(bandId));
const now = Timestamp.now();

const newSetlist: Omit<Setlist, 'id'> = {
  ...originalSetlist,
  name: newName,
  createdAt: now,
  updatedAt: now
};

await setDoc(newSetlistRef, newSetlist);
return newSetlistRef.id;
}

// Interface for the update payload
interface SetlistUpdateData {
  name?: string;
  format?: {
    numSets: number;
    setDuration: number;
  };
}

// Function to update setlist details
export async function updateSetlist(
  bandId: string,
  setlistId: string,
  data: SetlistUpdateData
): Promise<void> {
  try {
    const setlistRef = doc(createSetlistRef(bandId), setlistId);
    await updateDoc(setlistRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating setlist:', error);
    throw error;
  }
}