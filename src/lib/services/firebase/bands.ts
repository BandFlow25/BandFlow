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
  Timestamp,
  DocumentReference
} from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import type { Band, BandMember, CreateBandData } from '@/lib/types/band';
import { COLLECTIONS } from '@/lib/constants';

// Helper functions for collection references
const getBandsCollection = () => collection(db, COLLECTIONS.BANDS);

const getBandMembersCollection = (bandId: string) => 
  collection(db, COLLECTIONS.BANDS, bandId, COLLECTIONS.BAND_MEMBERS);

// Create a new band
import { getUserProfile } from './auth';

export async function createBand(userId: string, data: CreateBandData): Promise<string> {
  try {
    console.log('Starting band creation for user:', userId);
    const bandRef = doc(getBandsCollection());
    const timestamp = Timestamp.now();
    
    // Get user profile first
    console.log('Fetching user profile...');
    const userProfile = await getUserProfile(userId);
    console.log('User profile fetched:', userProfile);
    
    const band: Omit<Band, 'id'> = {
      name: data.name,
      imageUrl: data.imageUrl || '',
      description: data.description || '',
      socialLinks: data.socialLinks || {},
      createdAt: timestamp,
      updatedAt: timestamp
    };

    console.log('Creating band document...');
    await setDoc(bandRef, band);
    console.log('Band document created with ID:', bandRef.id);

    // Create band member record using userId as the document ID
    const memberRef = doc(getBandMembersCollection(bandRef.id), userId);
    console.log('Creating member document at path:', memberRef.path);
    
    const memberData: BandMember = {
      userId,
      role: 'admin',
      displayName: userProfile?.displayName || '',
      instruments: userProfile?.instruments || [],
      joinedAt: timestamp
    };

    console.log('Member data to be written:', memberData);
    
    try {
      await setDoc(memberRef, memberData);
      console.log('Member document created successfully');
    } catch (memberError) {
      console.error('Error creating member document:', memberError);
      console.error('Member ref path:', memberRef.path);
      console.error('Member data:', memberData);
      throw memberError; // Re-throw to handle in calling code
    }

    return bandRef.id;
  } catch (error) {
    console.error('Error in createBand:', error);
    throw error;
  }
}


// Get a band by ID
export async function getBand(bandId: string): Promise<Band | null> {
  const bandRef = doc(getBandsCollection(), bandId);
  const bandSnap = await getDoc(bandRef);
  
  if (!bandSnap.exists()) return null;
  
  return {
    id: bandSnap.id,
    ...bandSnap.data()
  } as Band;
}

// Get all bands for a user
export async function getUserBands(userId: string): Promise<Band[]> {
  const bands: Band[] = [];
  const bandsSnapshot = await getDocs(getBandsCollection());

  for (const bandDoc of bandsSnapshot.docs) {
    const memberQuery = query(
      getBandMembersCollection(bandDoc.id),
      where('userId', '==', userId)
    );
    const memberSnap = await getDocs(memberQuery);
    
    if (!memberSnap.empty) {
      bands.push({
        id: bandDoc.id,
        ...bandDoc.data()
      } as Band);
    }
  }

  return bands;
}

// Update band details
export async function updateBand(bandId: string, data: Partial<Band>): Promise<void> {
  const bandRef = doc(getBandsCollection(), bandId);
  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  };
  await updateDoc(bandRef, updateData);
}

// Check if user is band admin
export async function isUserBandAdmin(userId: string, bandId: string): Promise<boolean> {
  const memberQuery = query(
    getBandMembersCollection(bandId),
    where('userId', '==', userId),
    where('role', '==', 'admin')
  );
  
  const memberSnap = await getDocs(memberQuery);
  return !memberSnap.empty;
}

// Get Band Member Role
export async function getBandMemberRole(bandId: string, userId: string): Promise<string | null> {
  try {
    const memberQuery = query(
      getBandMembersCollection(bandId),
      where('userId', '==', userId)
    );

    const memberSnap = await getDocs(memberQuery);

    if (!memberSnap.empty) {
      const memberDoc = memberSnap.docs[0];
      return memberDoc?.data()?.role || null;
    }

    return null;
  } catch (error) {
    console.error('Error fetching band member role:', error);
    return null;
  }
}

// Add member to band
export async function addBandMember(
  bandId: string,
  userId: string,  // This should be the auth UID
  role: 'admin' | 'member' = 'member'
): Promise<void> {
  // Use userId as the document ID instead of auto-generating
  const memberRef = doc(getBandMembersCollection(bandId), userId);
  const memberData: BandMember = {
    userId,  // This stays the same - matches the doc ID
    role,
    displayName: '',
    instruments: [],
    joinedAt: serverTimestamp() as Timestamp
  };

  await setDoc(memberRef, memberData);
}

// Get band members
export async function getBandMembers(bandId: string): Promise<BandMember[]> {
  const memberSnap = await getDocs(getBandMembersCollection(bandId));
  
  return memberSnap.docs.map(doc => ({
    ...doc.data()
  }) as BandMember);
}

// Update band member role
export async function updateBandMember(
  bandId: string,
  userId: string,
  newRole: 'admin' | 'member'
): Promise<void> {
  const memberQuery = query(
    getBandMembersCollection(bandId),
    where('userId', '==', userId)
  );
  
  const memberSnap = await getDocs(memberQuery);
  if (!memberSnap.empty) {
    const memberDoc = memberSnap.docs[0];
    if (memberDoc) {
      await updateDoc(
        doc(getBandMembersCollection(bandId), memberDoc.id),
        { role: newRole }
      );
    }
  }
}

// Remove band member
export async function removeBandMember(
  bandId: string,
  userId: string
): Promise<void> {
  const memberQuery = query(
    getBandMembersCollection(bandId),
    where('userId', '==', userId)
  );
  
  const memberSnap = await getDocs(memberQuery);
  if (!memberSnap.empty) {
    const memberDoc = memberSnap.docs[0];
    if (memberDoc) {
      await deleteDoc(doc(getBandMembersCollection(bandId), memberDoc.id));
    }
  }
}