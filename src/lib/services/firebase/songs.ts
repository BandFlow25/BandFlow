// src/lib/services/firebase/songs.ts
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { BaseSong, BandSong, SongStatus, RAGStatus } from '@/lib/types/song';
import { auth } from '@/lib/config/firebase';
import { getSongMetadata } from '@/lib/services/ai/SongMetadata';

const BF_BASE_SONGS = 'bf_base_songs';
const BF_BAND_SONGS = 'bf_band_songs';
const BF_BAND_MEMBERS = 'bf_band_members';

// Helper function to check band membership
async function isBandMember(userId: string, bandId: string): Promise<boolean> {
  const memberQuery = query(
    collection(db, BF_BAND_MEMBERS),
    where('userId', '==', userId),
    where('bandId', '==', bandId)
  );

  const memberSnap = await getDocs(memberQuery);
  return !memberSnap.empty;
}

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
  const songsRef = collection(db, BF_BASE_SONGS);
  const q = query(
    songsRef,
    where('title', '==', title),
    where('artist', '==', artist)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty || !snapshot.docs[0]) return null;

  const data = snapshot.docs[0].data();
  if (!data) return null;

  return { id: snapshot.docs[0].id, ...data } as BaseSong;
}

export async function findBandSongByBaseSongId(bandId: string, baseSongId: string): Promise<BandSong | null> {
  const songsRef = collection(db, BF_BAND_SONGS);
  const q = query(
    songsRef,
    where('bandId', '==', bandId),
    where('baseSongId', '==', baseSongId)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty || !snapshot.docs[0]) return null;

  const data = snapshot.docs[0].data();
  if (!data) return null;

  return { id: snapshot.docs[0].id, ...data } as BandSong;
}

export async function addBaseSong(song: Omit<BaseSong, 'id' | 'createdAt' | 'updatedAt' | 'songAddedBy'>): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user found to add the song");
  }

  const songRef = doc(collection(db, BF_BASE_SONGS));
  const timestamp = serverTimestamp();

  try {
    const metadata = await getSongMetadata(song.title, song.artist);

    await setDoc(songRef, {
      ...song,
      metadata: {
        ...song.metadata,
        key: metadata?.key || null,
        bpm: metadata?.bpm || null,
        duration: song.metadata?.duration || null
      },
      metadataStatus: metadata ? 'complete' : 'failed',
      songAddedBy: user.uid,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  } catch (error) {
    // If AI call fails, save song with pending status
    await setDoc(songRef, {
      ...song,
      metadataStatus: 'pending',
      songAddedBy: user.uid,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  return songRef.id;
}

export async function addBandSong(
  baseSongId: string,
  bandId: string,
  status: SongStatus
): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user found to add the band song");
  }

  // Check band membership
  if (!(await isBandMember(user.uid, bandId))) {
    throw new Error("User is not a member of this band");
  }

  const baseSong = await getDoc(doc(db, BF_BASE_SONGS, baseSongId));
  if (!baseSong.exists()) {
    throw new Error('Base song not found');
  }

  const bandSongRef = doc(collection(db, BF_BAND_SONGS));
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
    const songRef = doc(db, BF_BAND_SONGS, songId);
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
    const updateData: any = {
      [`votes.${userId}`]: {
        value: score,
        updatedAt: timestamp
      },
      updatedAt: timestamp
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

export async function updateSongStatus(
  songId: string,
  userId: string,
  newStatus: SongStatus
): Promise<void> {
  try {
    const songRef = doc(db, BF_BAND_SONGS, songId);
    const songDoc = await getDoc(songRef);

    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }

    const songData = songDoc.data();
    const bandId = songData.bandId;

    // Only admins can change status
    if (!(await isBandAdmin(userId, bandId))) {
      throw new Error('User is not a band admin');
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

export async function getBandSongs(bandId: string): Promise<BandSong[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user found");
  }

  // Check band membership
  if (!(await isBandMember(user.uid, bandId))) {
    throw new Error("User is not a member of this band");
  }

  const songsQuery = query(
    collection(db, BF_BAND_SONGS),
    where('bandId', '==', bandId)
  );

  const snapshot = await getDocs(songsQuery);
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

  const songsRef = collection(db, BF_BASE_SONGS);
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
  votes: Record<string, { value: number; updatedAt: any }>
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

    const songRef = doc(db, BF_BAND_SONGS, songId);
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
    const songRef = doc(db, BF_BAND_SONGS, songId);
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