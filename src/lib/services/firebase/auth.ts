// src/lib/services/firebase/auth.ts
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
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
  createdAt: Date;
  updatedAt: Date;
}

export const createUserProfile = async (user: User, profileData: Partial<UserProfile>) => {
  const userRef = doc(db, 'bf_users', user.uid);
  
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email!,
    displayName: profileData.displayName || `${profileData.firstName} ${profileData.lastName}`,
    firstName: profileData.firstName || '',
    lastName: profileData.lastName || '',
    fullName: profileData.fullName || `${profileData.firstName} ${profileData.lastName}`,
    instruments: profileData.instruments || [],
    postcode: profileData.postcode || '',
    avatar: profileData.avatar || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(userRef, profile);
  return profile;
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
  
  // Create initial bf_users profile immediately after auth creation
  const initialProfile: UserProfile = {
    uid: userCredential.user.uid,
    email: email,
    displayName: '',
    firstName: '',
    lastName: '',
    fullName: '',
    instruments: [],
    postcode: '',
    avatar: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await createUserProfile(userCredential.user, initialProfile);
  
  return userCredential.user;
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    console.log('Calling Firebase Auth with email:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Firebase Auth success:', userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error('Firebase Auth error:', error);
    throw error;
  }
};

export const signOut = () => firebaseSignOut(auth);