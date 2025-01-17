'use client';

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/config/firebase";
import { createUserProfile, getUserProfile, UserProfile } from "@/lib/services/firebase/auth";
import { useRouter } from 'next/navigation';

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setProfile: (profile: UserProfile | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  requireProfile: () => boolean;
  validateProfile: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const validateProfile = (): boolean => {
    if (!user) {
      router.push('/login');
      return false;
    }

    if (!profile?.hasProfile) {
      router.push('/profile-setup');
      return false;
    }

    return true;
  };

  const requireProfile = (): boolean => {
    return validateProfile();
  };

  const login = async (email: string, password: string): Promise<void> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    setUser(user);

    const userProfile = await getUserProfile(user.uid);
    setProfile({
      uid: user.uid,
      email: user.email || '',
      hasProfile: userProfile?.hasProfile ?? false,
      displayName: userProfile?.displayName || '',
      fullName: userProfile?.fullName || '',
      postcode: userProfile?.postcode || '',
      instruments: userProfile?.instruments || [],
      avatar: userProfile?.avatar || '',
      firstName: userProfile?.firstName || '',
      lastName: userProfile?.lastName || '',
      createdAt: userProfile?.createdAt || new Date(),
      updatedAt: userProfile?.updatedAt || new Date(),
    });
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setUser(user);

      if (user) {
        const userProfile = await getUserProfile(user.uid);

        if (userProfile) {
          setProfile({
            uid: user.uid,
            email: user.email || '',
            hasProfile: userProfile.hasProfile ?? false,
            displayName: userProfile.displayName || '',
            fullName: userProfile.fullName || '',
            postcode: userProfile.postcode || '',
            instruments: userProfile.instruments || [],
            avatar: userProfile.avatar || '',
            firstName: userProfile.firstName || '',
            lastName: userProfile.lastName || '',
            createdAt: userProfile.createdAt || new Date(),
            updatedAt: userProfile.updatedAt || new Date(),
          });
        } else {
          // Create a default profile if it doesn't exist
          await createUserProfile(user, { hasProfile: false });
          setProfile({
            uid: user.uid,
            email: user.email || '',
            hasProfile: false,
            displayName: '',
            fullName: '',
            postcode: '',
            instruments: [],
            avatar: '',
            firstName: '',
            lastName: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        setProfile,
        login,
        logout,
        requireProfile,
        validateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
