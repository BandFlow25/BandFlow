// src/lib/services/firebase/songs.ts
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, serverTimestamp, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { BaseSong, BandSong, SongStatus, RAGStatus } from '@/lib/types/song';
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







export async function addVote(
  bandId: string,
  songId: string,
  userId: string,
  score: number
): Promise<void> {
  console.log('AddVote: Starting with params:', {
    bandId,
    songId,
    userId,
    score,
    currentAuthUser: auth.currentUser?.uid // Add this to check auth state
  });
  
  try {
    const songRef = doc(getBandSongsCollection(bandId), songId);
    console.log('AddVote: Document path:', songRef.path);

    // Check if user is band member before attempting update
    const memberRef = doc(getBandMembersCollection(bandId), userId);
    const memberDoc = await getDoc(memberRef);
    
    console.log('AddVote: Member check:', {
      memberPath: memberRef.path,
      exists: memberDoc.exists(),
      role: memberDoc.data()?.role
    });

    if (!memberDoc.exists()) {
      throw new Error('User is not a band member');
    }

    const songDoc = await getDoc(songRef);
    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }

    const songData = songDoc.data();
    console.log('AddVote: Current song data:', {
      id: songDoc.id,
      status: songData.status,
      votes: songData.votes || {}
    });

    const updatedVotes = {
      ...(songData.votes || {}),
      [userId]: {
        value: score,
        updatedAt: serverTimestamp()
      }
    };

    const membersSnapshot = await getDocs(getBandMembersCollection(bandId));
    const totalMembers = membersSnapshot.size;
    const totalVotes = Object.keys(updatedVotes).length;

    console.log('AddVote: Vote counts:', {
      totalMembers,
      totalVotes,
      hasVoted: Object.keys(updatedVotes)
    });

    let newStatus = songData.status;
    if (songData.status === 'SUGGESTED') {
      newStatus = 'VOTING';
    } else if (songData.status === 'VOTING' && totalVotes >= totalMembers) {
      newStatus = 'REVIEW';
    }

    const updateData = {
      votes: updatedVotes,
      status: newStatus,
      updatedAt: serverTimestamp()
    };

    console.log('AddVote: Updating document:', updateData);
    await updateDoc(songRef, updateData);
    console.log('AddVote: Successfully updated document');

  } catch (error) {
    console.error('AddVote: Error with full context:', {
      error,
      bandId,
      songId,
      userId,
      authUid: auth.currentUser?.uid,
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
  userId: string,
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
  userId: string
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