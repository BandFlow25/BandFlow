// services/firebase/baseSongs.ts
import { db } from '@/lib/config/firebase';
import { collection, doc, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/constants';

export async function deleteBaseSongWithCascade(baseSongId: string) {
  const batch = writeBatch(db);
  
  // Delete from all bands
  const bandsRef = collection(db, COLLECTIONS.BANDS);
  const bandsSnapshot = await getDocs(bandsRef);
  
  for (const bandDoc of bandsSnapshot.docs) {
    const bandSongsRef = collection(bandDoc.ref, 'songs');
    const q = query(bandSongsRef, where('baseSongId', '==', baseSongId));
    const songsSnapshot = await getDocs(q);
    
    songsSnapshot.docs.forEach(songDoc => {
      batch.delete(songDoc.ref);
    });
  }

  // Delete base song
  const baseSongRef = doc(db, COLLECTIONS.BASE_SONGS, baseSongId);
  batch.delete(baseSongRef);

  await batch.commit();
}