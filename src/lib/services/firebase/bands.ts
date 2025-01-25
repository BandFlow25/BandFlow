/**
 * Firebase services for band management including CRUD operations,
 * member management, and invite system
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  updateDoc,
  deleteDoc,
  Timestamp,
  writeBatch,
  collectionGroup
} from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { getUserProfile } from './auth';
import { COLLECTIONS } from '@/lib/constants';
import { nanoid } from 'nanoid';
import type { Band, BandMember, CreateBandData, BandInvite } from '@/lib/types/band';

// ============================================================
// Collection References
// ============================================================

const getBandsCollection = () => collection(db, COLLECTIONS.BANDS);

const getBandMembersCollection = (bandId: string) => 
  collection(db, COLLECTIONS.BANDS, bandId, COLLECTIONS.BAND_MEMBERS);

// ============================================================
// Band CRUD Operations
// ============================================================

/**
 * Creates a new band and adds the creator as an admin member
 * @param userId - The ID of the user creating the band
 * @param data - The band creation data
 * @returns Promise<string> - The ID of the created band
 */
export async function createBand(userId: string, data: CreateBandData): Promise<string> {
  const bandRef = doc(getBandsCollection());
  
  try {
    const userProfile = await getUserProfile(userId);
    const now = Timestamp.now();
    
    // Create band document
    const band: Omit<Band, 'id'> = {
      name: data.name,
      imageUrl: data.imageUrl || '',
      description: data.description || '',
      socialLinks: data.socialLinks || {},
      createdAt: now,
      updatedAt: now
    };

    await setDoc(bandRef, band);

    // Add creator as admin member
    const memberData: BandMember = {
      userId,
      role: 'admin',
      displayName: userProfile?.displayName || '',
      instruments: userProfile?.instruments || [],
      joinedAt: now
    };

    await setDoc(doc(getBandMembersCollection(bandRef.id), userId), memberData);

    return bandRef.id;
  } catch (error) {
    console.error('Error in createBand:', error);
    throw error;
  }
}

/**
 * Retrieves a band by its ID
 */
export async function getBand(bandId: string): Promise<Band | null> {
  const bandRef = doc(getBandsCollection(), bandId);
  const bandSnap = await getDoc(bandRef);
  
  if (!bandSnap.exists()) return null;
  
  return {
    id: bandSnap.id,
    ...bandSnap.data()
  } as Band;
}

/**
 * Updates band details
 */
export async function updateBand(bandId: string, data: Partial<Band>): Promise<void> {
  const bandRef = doc(getBandsCollection(), bandId);
  const updateData = {
    ...data,
    updatedAt: Timestamp.now()
  };
  await updateDoc(bandRef, updateData);
}

/**
 * Gets all bands for a given user
 */
export async function getUserBands(userId: string): Promise<Band[]> {
  const bands: (Band & { userRole?: string })[] = [];
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
        ...bandDoc.data(),
        userRole: memberSnap.docs[0]?.data().role || ''
      } as Band & { userRole: string });
    }
  }

  return bands;
}
// ============================================================
// Member Management
// ============================================================

/**
 * Checks if a user is an admin of a band
 */
export async function isUserBandAdmin(userId: string, bandId: string): Promise<boolean> {
  const memberQuery = query(
    getBandMembersCollection(bandId),
    where('userId', '==', userId),
    where('role', '==', 'admin')
  );
  
  const memberSnap = await getDocs(memberQuery);
  return !memberSnap.empty;
}

/**
 * Gets a member's role in a band
 */
export async function getBandMemberRole(bandId: string, userId: string): Promise<string | null> {
  try {
    const memberRef = doc(getBandMembersCollection(bandId), userId);
    const memberSnap = await getDoc(memberRef);
    
    if (memberSnap.exists()) {
      return memberSnap.data()?.role || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching band member role:', error);
    return null;
  }
}

/**
 * Adds a new member to a band
 */
export async function addBandMember(
  bandId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
): Promise<void> {
  const memberData: BandMember = {
    userId,
    role,
    displayName: '',
    instruments: [],
    joinedAt: Timestamp.now()
  };

  await setDoc(doc(getBandMembersCollection(bandId), userId), memberData);
}

/**
 * Gets all members of a band
 */
export async function getBandMembers(bandId: string): Promise<BandMember[]> {
  const memberSnap = await getDocs(getBandMembersCollection(bandId));
  return memberSnap.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  }) as BandMember);
}

/**
 * Updates a member's role
 */
export async function updateBandMember(
  bandId: string,
  userId: string,
  newRole: 'admin' | 'member'
): Promise<void> {
  const memberRef = doc(getBandMembersCollection(bandId), userId);
  await updateDoc(memberRef, { role: newRole });
}

/**
 * Removes a member from a band
 */
export async function removeBandMember(bandId: string, userId: string): Promise<void> {
  const memberRef = doc(getBandMembersCollection(bandId), userId);
  await deleteDoc(memberRef);
}

// ============================================================
// Invite System
// ============================================================

/**
 * Creates a new band invite
 * @returns The invite URL to share
 */


export async function getOrCreateBandInvite(bandId: string): Promise<BandInvite> {
  const invitesRef = collection(db, COLLECTIONS.BANDS, bandId, 'invites');
  const invitesSnapshot = await getDocs(invitesRef);
  
  // Return existing invite if found
  const firstDoc = invitesSnapshot.docs[0];
  if (firstDoc) {
    const docData = firstDoc.data();
    if (docData) {
      return {
        ...docData,
        uses: docData.uses || []  // Ensure uses array exists
      } as BandInvite;
    }
  }

  // Create new invite if none exists
  const newInvite: BandInvite = {
    bandId,
    inviteCode: nanoid(10),
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    uses: []
  };

  await setDoc(doc(invitesRef, newInvite.inviteCode), newInvite);
  return newInvite;
}
 
export async function regenerateBandInvite(bandId: string): Promise<BandInvite> {
  const invitesRef = collection(db, COLLECTIONS.BANDS, bandId, 'invites');
  const invitesSnapshot = await getDocs(invitesRef);
  
  const batch = writeBatch(db);
  
  // Delete existing invites if any exist
  invitesSnapshot.docs.forEach(docSnapshot => {
    if (docSnapshot) {
      batch.delete(docSnapshot.ref);
    }
  });

  // Create new invite
  const newInvite: BandInvite = {
    bandId,
    inviteCode: nanoid(10),
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    uses: []
  };

  const newInviteRef = doc(invitesRef, newInvite.inviteCode);
  batch.set(newInviteRef, newInvite);
  await batch.commit();
  
  return newInvite;
}

export async function toggleBandInvite(bandId: string, inviteCode: string, isActive: boolean): Promise<void> {
  const inviteRef = doc(db, COLLECTIONS.BANDS, bandId, 'invites', inviteCode);
  await updateDoc(inviteRef, {
    isActive,
    updatedAt: Timestamp.now()
  });
}

export async function processInvite(inviteCode: string, userId: string): Promise<string | null> {
  let invite: BandInvite | null = null;

  try {
    // Find and validate invite
    const querySnapshot = await getDocs(
      query(
        collectionGroup(db, COLLECTIONS.BAND_INVITES),
        where('inviteCode', '==', inviteCode),
        where('isActive', '==', true)
      )
    );

    const firstDoc = querySnapshot.docs[0];
    if (!firstDoc) {
         return null;
    }

    invite = firstDoc.data() as BandInvite;
    
    // Check if user already used this invite
    if (invite.uses?.some(use => use.userId === userId)) {
      console.log('User already used this invite');
      return invite.bandId;
    }

    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    // Try to add member
    try {
      const memberRef = doc(db, COLLECTIONS.BANDS, invite.bandId, COLLECTIONS.BAND_MEMBERS, userId);
      const memberData: BandMember = {
        userId,
        role: 'member',
        displayName: userProfile.displayName || '',
        instruments: userProfile.instruments || [],
        joinedAt: Timestamp.now(),
        inviteCode
      };

      await setDoc(memberRef, memberData);
      console.log('Member added successfully');

      // Try to update invite uses, but don't fail if it errors
      try {
        const useData = {
          userId,
          joinedAt: Timestamp.now(),
          displayName: userProfile.displayName || ''
        };

        const currentInvite = await getDoc(firstDoc.ref);
        const currentUses = currentInvite.data()?.uses || [];
        
        await updateDoc(firstDoc.ref, {
          uses: [...currentUses, useData],
          updatedAt: Timestamp.now()
        });
        console.log('Invite uses updated');
      } catch (updateError) {
        // Log but don't fail if we can't update the invite uses
        console.log('Could not update invite uses, but member was added:', updateError);
      }

      return invite.bandId;

    } catch (memberError) {
      // Check if member was actually added despite error
      const memberRef = doc(db, COLLECTIONS.BANDS, invite.bandId, COLLECTIONS.BAND_MEMBERS, userId);
      const memberDoc = await getDoc(memberRef);
      if (memberDoc.exists()) {
        console.log('Member exists despite error, operation successful');
        return invite.bandId;
      }
      throw memberError;
    }

  } catch (error) {
    console.error('Process invite error:', error);
    throw error;
  }
}

export async function validateInvite(inviteCode: string): Promise<{ isValid: boolean; bandId?: string }> {
  try {
    if (!inviteCode) {
      return { isValid: false };
    }

    const querySnapshot = await getDocs(
      query(
        collectionGroup(db, COLLECTIONS.BAND_INVITES),
        where('inviteCode', '==', inviteCode),
        where('isActive', '==', true)
      )
    );

    // Early return if no documents found
    if (querySnapshot.empty) {
      return { isValid: false };
    }

    const inviteDoc = querySnapshot.docs[0];
    if (!inviteDoc) {
      return { isValid: false };
    }

    const invite = inviteDoc.data();
    if (!invite?.bandId) {
      return { isValid: false };
    }

    return { 
      isValid: true, 
      bandId: invite.bandId 
    };
  } catch (error) {
    console.error('Error validating invite:', error);
    return { isValid: false };
  }
}