// src/lib/services/firebase/bands.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import type { Band, BandMember, CreateBandData } from '@/lib/types/band';

const BANDS_COLLECTION = 'bf_bands';
const BAND_MEMBERS_COLLECTION = 'bf_band_members';

// Create a new band
export async function createBand(userId: string, data: CreateBandData): Promise<string> {
  const bandRef = doc(collection(db, BANDS_COLLECTION));
  const timestamp = Timestamp.now();
  
  const band: Omit<Band, 'id'> = {
    name: data.name,
    imageUrl: data.imageUrl || '',
    description: data.description || '',
    socialLinks: data.socialLinks || {},
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await setDoc(bandRef, band);

  // Create band member record for creator (as admin)
  const memberRef = doc(collection(db, BAND_MEMBERS_COLLECTION));
  const memberData: Omit<BandMember, 'joinedAt'> = {
    userId,
    bandId: bandRef.id,
    role: 'admin',
    displayName: '',
    instruments: []
  };

  await setDoc(memberRef, {
    ...memberData,
    joinedAt: timestamp
  });

  return bandRef.id;
}

// Get a band by ID
export async function getBand(bandId: string): Promise<Band | null> {
  const bandRef = doc(db, BANDS_COLLECTION, bandId);
  const bandSnap = await getDoc(bandRef);
  
  if (!bandSnap.exists()) return null;
  
  return {
    id: bandSnap.id,
    ...bandSnap.data()
  } as Band;
}

// Get all bands for a user
export async function getUserBands(userId: string): Promise<Band[]> {
  const membershipQuery = query(
    collection(db, BAND_MEMBERS_COLLECTION),
    where('userId', '==', userId)
  );
  
  const memberships = await getDocs(membershipQuery);
  const bandIds = memberships.docs.map(doc => doc.data().bandId);
  
  const bands: Band[] = [];
  for (const bandId of bandIds) {
    const band = await getBand(bandId);
    if (band) bands.push(band);
  }
  
  return bands;
}

// Update band details
export async function updateBand(bandId: string, data: Partial<Band>): Promise<void> {
  const bandRef = doc(db, BANDS_COLLECTION, bandId);
  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  };
  await updateDoc(bandRef, updateData);
}

// Check if user is band admin
export async function isUserBandAdmin(userId: string, bandId: string): Promise<boolean> {
  const memberQuery = query(
    collection(db, BAND_MEMBERS_COLLECTION),
    where('userId', '==', userId),
    where('bandId', '==', bandId),
    where('role', '==', 'admin')
  );
  
  const memberSnap = await getDocs(memberQuery);
  return !memberSnap.empty;
}

// Get Band Member Role
export async function getBandMemberRole(bandId: string, userId: string): Promise<string | null> {
  try {
    const memberQuery = query(
      collection(db, BAND_MEMBERS_COLLECTION),
      where('bandId', '==', bandId),
      where('userId', '==', userId)
    );

    const memberSnap = await getDocs(memberQuery);

    if (!memberSnap.empty) {
      const memberDoc = memberSnap.docs[0]; // Assume only one document per user in a band
      return memberDoc?.data()?.role || null; // Return the role field if it exists
    }

    return null; // Return null if no document is found
  } catch (error) {
    console.error('Error fetching band member role:', error);
    return null;
  }
}

// Add member to band
export async function addBandMember(
  bandId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
): Promise<void> {
  const memberRef = doc(collection(db, BAND_MEMBERS_COLLECTION));
  await setDoc(memberRef, {
    userId,
    bandId,
    role,
    displayName: '',
    instruments: [],
    joinedAt: serverTimestamp()
  });
}

// Get band members
export async function getBandMembers(bandId: string): Promise<BandMember[]> {
  const memberQuery = query(
    collection(db, BAND_MEMBERS_COLLECTION),
    where('bandId', '==', bandId)
  );
  
  const memberSnap = await getDocs(memberQuery);
  return memberSnap.docs.map(doc => ({
    ...doc.data()
  } as BandMember));
}

// Update band member role
export async function updateBandMember(
  bandId: string,
  userId: string,
  newRole: 'admin' | 'member'
): Promise<void> {
  const memberQuery = query(
    collection(db, BAND_MEMBERS_COLLECTION),
    where('userId', '==', userId),
    where('bandId', '==', bandId)
  );
  
  const memberSnap = await getDocs(memberQuery);
  if (!memberSnap.empty) {
    const memberDoc = memberSnap.docs[0];
    if (memberDoc) {
      await updateDoc(doc(db, BAND_MEMBERS_COLLECTION, memberDoc.id), {
        role: newRole
      });
    }
  }
}

// Remove band member
export async function removeBandMember(
  bandId: string,
  userId: string
): Promise<void> {
  const memberQuery = query(
    collection(db, BAND_MEMBERS_COLLECTION),
    where('userId', '==', userId),
    where('bandId', '==', bandId)
  );
  
  const memberSnap = await getDocs(memberQuery);
    if (!memberSnap.empty) {
    const memberDoc = memberSnap.docs[0];
    if (memberDoc) {
      await deleteDoc(doc(db, BAND_MEMBERS_COLLECTION, memberDoc.id));
    }
  }
}