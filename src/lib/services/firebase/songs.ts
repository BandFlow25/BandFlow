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


//TODO: We get rid of this.
const BF_BAND_MEMBERS = 'bf_band_members';

// Helper function to check band membership
const isBandMember = async (userId: string, bandId: string): Promise<boolean> => {
  const memberQuery = query(
    collection(db, 'bf_band_members'),
    where('userId', '==', userId),
    where('bandId', '==', bandId)
  );

  const memberSnap = await getDocs(memberQuery);
  return !memberSnap.empty;
};
// Helper function to check if user is band admin
async function isBandAdmin(userId: string, bandId: string): Promise<boolean> {
  const memberQuery = query(
    collection(db, BF_BAND_MEMBERS),
    where('userId', '==', userId),
    where('bandId', '==', bandId),
    where('role', '==', 'admin')
  );

  const memberSnap = await getDocs(memberQuery);
  return !memberSnap.empty;
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
    throw new Error("No authenticated user found to add the song");
  }

  const songRef = doc(collection(db, COLLECTIONS.BASE_SONGS));
  const timestamp = serverTimestamp();

  try {
    // Log incoming song details
    console.log('addBaseSong: called with song:', song);

    const metadata = await getSongMetadata(song.title, song.artist);
    console.log('addBaseSong: Metadata received from AI service:', metadata);

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

    // Log the final data before storing
    console.log('addBaseSong: Final data being stored in bf_base_song:', dataToStore);

    await setDoc(songRef, dataToStore);
  } catch (error) {
    console.error('Error adding base song, storing with pending status:', error);

    const fallbackData = {
      ...song,
      metadataStatus: 'pending',
      songAddedBy: user.uid,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    console.log('addBaseSong: Fallback data being stored in bf_base_song:', fallbackData);

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
  if (!(await isBandMember(user.uid, bandId))) throw new Error("User is not a member of this band");

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


export async function addVote(
  songId: string,
  userId: string,
  score: number
): Promise<void> {
  try {
    const songRef = doc(db, COLLECTIONS.BAND_SONGS, songId);
    const songDoc = await getDoc(songRef);
    
    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }

    const songData = songDoc.data();
    const bandId = songData.bandId;

    // Verify band membership
    if (!(await isBandMember(userId, bandId))) {
      throw new Error('User is not a band member');
    }

    const timestamp = serverTimestamp();
    const updatedVotes = {
      ...songData.votes,
      [userId]: { 
        value: score,
        updatedAt: timestamp 
      }
    };

    // Get band member count
    const membersQuery = query(
      collection(db, BF_BAND_MEMBERS),
      where('bandId', '==', bandId)
    );
    const membersSnapshot = await getDocs(membersQuery);
    const totalMembers = membersSnapshot.size;
    const totalVotes = Object.keys(updatedVotes).length;

    // If moving to review, store the member count
    const updateData: Partial<BandSong> = {
      votes: {
      ...songData.votes,
      [userId]: {
        value: score,
        updatedAt: Timestamp.now()
      }
      },
      updatedAt: Timestamp.now()
    };

    if (totalVotes >= totalMembers) {
      updateData.status = 'REVIEW';
      updateData.votingMemberCount = totalMembers; // Store the count when moving to review
    } else {
      updateData.status = 'VOTING';
    }

    await updateDoc(songRef, updateData);
    
  } catch (error) {
    console.error('Detailed vote error:', error);
    throw error;
  }
}

export async function fetchSongDetails(bandId: string, songId: string): Promise<BandSong | null> {
  try {
    const songDoc = await getDoc(doc(db, COLLECTIONS.BANDS, bandId, COLLECTIONS.BAND_SONGS, songId));
    if (!songDoc.exists()) return null;
    return { id: songDoc.id, ...songDoc.data() } as BandSong;
  } catch (error) {
    console.error('Error fetching song details:', error);
    return null;
  }
}

export async function updateSongStatus(
  bandId: string,
  songId: string,
  userId: string,
  newStatus: SongStatus
): Promise<void> {
  const songRef = doc(getBandSongsCollection(bandId), songId);
  const songDoc = await getDoc(songRef);

  if (!songDoc.exists()) throw new Error('Song not found');
  if (!(await isBandMember(userId, bandId))) throw new Error("User is not a band member");

  await updateDoc(songRef, {
    status: newStatus,
    updatedAt: serverTimestamp()
  });
}

export async function getBandSongs(bandId: string): Promise<BandSong[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user found");
  if (!(await isBandMember(user.uid, bandId))) throw new Error("User is not a member of this band");

  const songsRef = getBandSongsCollection(bandId);
  const snapshot = await getDocs(songsRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as BandSong[];
}

export async function searchBaseSongs(searchQuery: string): Promise<BaseSong[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user found");
  }

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
  const membersQuery = query(
    collection(db, BF_BAND_MEMBERS),
    where('bandId', '==', bandId)
  );

  const membersSnapshot = await getDocs(membersQuery);
  const totalMembers = membersSnapshot.size;
  const totalVotes = Object.keys(votes || {}).length;

  return totalVotes >= totalMembers;
}

export async function deleteBandSong(
  songId: string,
  userId: string,
  bandId: string
): Promise<void> {
  try {
    // First check if user is admin
    const memberQuery = query(
      collection(db, BF_BAND_MEMBERS),
      where('userId', '==', userId),
      where('bandId', '==', bandId),
      where('role', '==', 'admin')
    );

    const memberSnap = await getDocs(memberQuery);
    if (memberSnap.empty) {
      throw new Error('Only band admins can delete songs');
    }

    const songRef = doc(db, COLLECTIONS.BAND_SONGS, songId);
    await deleteDoc(songRef);

    console.log('Song deleted successfully');
  } catch (error) {
    console.error('Error deleting song:', error);
    throw error;
  }
}

export async function updateRagStatus(
  songId: string,
  userId: string,
  status: RAGStatus
): Promise<void> {
  try {
    const songRef = doc(db, COLLECTIONS.BAND_SONGS, songId);
    const songDoc = await getDoc(songRef);
    
    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }

    const songData = songDoc.data();
    const bandId = songData.bandId;

    // Verify band membership
    if (!(await isBandMember(userId, bandId))) {
      throw new Error('User is not a band member');
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