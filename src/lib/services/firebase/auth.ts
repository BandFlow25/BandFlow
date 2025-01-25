// src/lib/services/firebase/auth.ts
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/config/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  instruments: string[];
  postcode: string;
  hasProfile?: boolean;
  createdAt: Date;
  updatedAt: Date;
  godMode?: boolean;
}

export const createUserProfile = async (user: User, profileData: Partial<UserProfile>) => {
  const userRef = doc(db, 'bf_users', user.uid);
  const updatedData = {
    ...profileData,
    updatedAt: Timestamp.now(),
  };
  await setDoc(userRef, updatedData, { merge: true }); // Merge to retain existing fields
};

export const updateUserProfile = async (uid: string, profileData: Partial<UserProfile>) => {
  const userRef = doc(db, 'bf_users', uid);
  
  const updates = {
    ...profileData,
    updatedAt: new Date(),
  };

  await updateDoc(userRef, updates);
  
  // Fetch and return the updated profile
  const updatedProfile = await getUserProfile(uid);
  return updatedProfile;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'bf_users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  
  return null;
};

export const registerWithEmail = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Initialize user profile with hasProfile: false
  await setDoc(doc(db, "bf_users", user.uid), {
    email: user.email,
    hasProfile: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return user;
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Firebase Auth error:', error);
    throw error;
  }
};

export const signOut = () => firebaseSignOut(auth);