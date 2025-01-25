// src/lib/services/firebase/songs.ts
import { writeBatch, collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, serverTimestamp, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { BaseSong, BandSong, SongStatus, RAGStatus, SONG_STATUS } from '@/lib/types/song';
import { auth } from '@/lib/config/firebase';
import { getSongMetadata } from '@/lib/services/ai/SongMetadata';
import { COLLECTIONS } from '@/lib/constants';

// Helper function to get band songs collection reference
const getBandSongsCollection = (bandId: string) => {
  return collection(db, COLLECTIONS.BANDS, bandId, COLLECTIONS.BAND_SONGS);
};

// Helper function to get band members collection reference
const getBandMembersCollection = (bandId: string) => {
  return collection(db, COLLECTIONS.BANDS, bandId, COLLECTIONS.BAND_MEMBERS);
};

// src/lib/services/firebase/songs.ts
export async function addVote(
  bandId: string,
  songId: string,
  userId: string,
  score: number
): Promise<void> {
  try {
    const songRef = doc(getBandSongsCollection(bandId), songId);
    const songDoc = await getDoc(songRef);
    
    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }

    const songData = songDoc.data();
    const updatedVotes = {
      ...(songData.votes || {}),
      [userId]: {
        value: score,
        updatedAt: serverTimestamp()
      }
    };

    // Get total member count for comparison
    const membersSnapshot = await getDocs(getBandMembersCollection(bandId));
    const totalMembers = membersSnapshot.size;
    const totalVotes = Object.keys(updatedVotes).length;

    // Only update status to REVIEW when all members have voted
    let newStatus = songData.status;
    if (songData.status === SONG_STATUS.SUGGESTED && totalVotes >= totalMembers) {
      newStatus = SONG_STATUS.REVIEW;
    }

    const updateData = {
      votes: updatedVotes,
      status: newStatus,
      votingMemberCount: totalMembers, // Store this for score calculations
      updatedAt: serverTimestamp()
    };

    await updateDoc(songRef, updateData);

  } catch (error) {
    console.error('AddVote: Error with full context:', {
      error,
      bandId,
      songId,
      userId,
      location: 'songs.addVote'
    });
    throw error;
  }
}

export async function updateRagStatus(
  bandId: string,
  songId: string,
  userId: string,
  status: RAGStatus
): Promise<void> {
  try {
    const songRef = doc(getBandSongsCollection(bandId), songId);
    const songDoc = await getDoc(songRef);
    
    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }

    await updateDoc(songRef, {
      [`ragStatus.${userId}`]: {
        status,
        updatedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating RAG status:', error);
    throw error;
  }
}

export async function updateSongStatus(
  bandId: string,
  songId: string,
  newStatus: SongStatus
): Promise<void> {
  try {
    const songRef = doc(getBandSongsCollection(bandId), songId);
    const songDoc = await getDoc(songRef);

    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }

    await updateDoc(songRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating song status:', error);
    throw error;
  }
}

export async function deleteBandSong(
  bandId: string,
  songId: string,
): Promise<void> {
  try {
    const songRef = doc(getBandSongsCollection(bandId), songId);
    await deleteDoc(songRef);
  } catch (error) {
    console.error('Error deleting song:', error);
    throw error;
  }
}

export async function getBandSongs(bandId: string): Promise<BandSong[]> {
  const songsRef = getBandSongsCollection(bandId);
  const snapshot = await getDocs(songsRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as BandSong[];
}

export async function findBaseSongByTitleAndArtist(title: string, artist: string): Promise<BaseSong | null> {
  const songsRef = collection(db, COLLECTIONS.BASE_SONGS);
  const q = query(
    songsRef,
    where('title', '==', title),
    where('artist', '==', artist)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty || !snapshot.docs[0]) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as BaseSong;
}

export async function findBandSongByBaseSongId(bandId: string, baseSongId: string): Promise<BandSong | null> {
  const songsRef = getBandSongsCollection(bandId);
  const q = query(songsRef, where('baseSongId', '==', baseSongId));
  const snapshot = await getDocs(q);

  if (snapshot.empty || !snapshot.docs[0]) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as BandSong;
}

export async function addBaseSong(song: Omit<BaseSong, 'id' | 'createdAt' | 'updatedAt' | 'songAddedBy'>): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user found");
  }

  const songRef = doc(collection(db, COLLECTIONS.BASE_SONGS));
  const timestamp = serverTimestamp();

  try {
    const metadata = await getSongMetadata(song.title, song.artist);
    
    const dataToStore = {
      ...song,
      metadata: {
        ...song.metadata,
        key: metadata?.key || null,
        bpm: metadata?.bpm || null,
        duration: song.metadata?.duration || null,
      },
      metadataStatus: metadata ? 'complete' : 'failed',
      songAddedBy: user.uid,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await setDoc(songRef, dataToStore);
  } catch (error) {
    console.error('Error adding base song:', error);
    
    // Fallback to storing without metadata
    const fallbackData = {
      ...song,
      metadataStatus: 'pending',
      songAddedBy: user.uid,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await setDoc(songRef, fallbackData);
  }

  return songRef.id;
}

export async function addBandSong(
  baseSongId: string,
  bandId: string,
  status: SongStatus
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user found");

  const baseSong = await getDoc(doc(db, COLLECTIONS.BASE_SONGS, baseSongId));
  if (!baseSong.exists()) throw new Error('Base song not found');

  const bandSongRef = doc(getBandSongsCollection(bandId));
  const timestamp = serverTimestamp();

  await setDoc(bandSongRef, {
    ...baseSong.data(),
    baseSongId,
    bandId,
    status,
    songAddedBy: user.uid,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return bandSongRef.id;
}

export async function fetchSongDetails(bandId: string, songId: string): Promise<BandSong | null> {
  try {
    const songDoc = await getDoc(doc(getBandSongsCollection(bandId), songId));
    if (!songDoc.exists()) return null;
    return { id: songDoc.id, ...songDoc.data() } as BandSong;
  } catch (error) {
    console.error('Error fetching song details:', error);
    return null;
  }
}

export async function searchBaseSongs(searchQuery: string): Promise<BaseSong[]> {
  const songsRef = collection(db, COLLECTIONS.BASE_SONGS);
  const searchLower = searchQuery.toLowerCase();
  const snapshot = await getDocs(songsRef);

  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BaseSong))
    .filter(song =>
      song.title.toLowerCase().startsWith(searchLower)
    )
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function checkAllMembersVoted(
  bandId: string,
  votes: Record<string, { value: number; updatedAt: Timestamp }>
): Promise<boolean> {
  const membersSnapshot = await getDocs(getBandMembersCollection(bandId));
  const totalMembers = membersSnapshot.size;
  const totalVotes = Object.keys(votes || {}).length;
  return totalVotes >= totalMembers;
}

export async function deleteBaseSongWithCascade(baseSongId: string) {
  const batch = writeBatch(db);
  
  // Delete song from all bands
  const bandsSnapshot = await getDocs(collection(db, COLLECTIONS.BANDS));
  
  for (const bandDoc of bandsSnapshot.docs) {
    const bandSongsRef = collection(bandDoc.ref, COLLECTIONS.BAND_SONGS);
    const songsQuery = query(bandSongsRef, where('baseSongId', '==', baseSongId));
    const songsSnapshot = await getDocs(songsQuery);
    
    songsSnapshot.docs.forEach(songDoc => {
      batch.delete(songDoc.ref);
    });
  }
 
  // Delete base song
  const baseSongRef = doc(db, COLLECTIONS.BASE_SONGS, baseSongId);
  batch.delete(baseSongRef);
 
  try {
    await batch.commit();
  } catch (error) {
    console.error('Error in cascade delete:', error);
    throw error;
  }
 }