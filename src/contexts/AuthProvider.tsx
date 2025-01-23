// src/contexts/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User, 
  setPersistence, 
  browserSessionPersistence, 
  browserLocalPersistence 
} from "firebase/auth";
import { auth } from "@/lib/config/firebase";
import { 
  createUserProfile, 
  getUserProfile, 
  UserProfile,
  signInWithEmail,
  signOut 
} from "@/lib/services/firebase/auth";
import { useRouter } from 'next/navigation';

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setProfile: (profile: UserProfile | null) => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  requireProfile: () => boolean;
  validateProfile: (force?: boolean) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Profile validation with force option
  const validateProfile = (force: boolean = false): boolean => {
    if (!user) {
      router.push('/login');
      return false;
    }

    // Only force redirect to profile setup if explicitly required
    if (!profile?.hasProfile && force) {
      router.push('/profile-setup');
      return false;
    }

    return true;
  };

  // Used when profile is required (e.g., accessing band features)
  const requireProfile = (): boolean => {
    return validateProfile(true);
  };

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    try {
      // Set persistence based on remember me choice
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      const user = await signInWithEmail(email, password);
      setUser(user);

      const userProfile = await getUserProfile(user.uid);
      if (userProfile) {
        setProfile(userProfile);
        
        // Redirect based on profile status
        if (!userProfile.hasProfile) {
          router.push('/profile-setup');
        } else {
          router.push('/home');
        }
      } else {
        // Create default profile if none exists
        const defaultProfile = {
          uid: user.uid,
          email: user.email || '',
          hasProfile: false,
          displayName: '',
          fullName: '',
          postcode: '',
          instruments: [],
          firstName: '',
          lastName: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await createUserProfile(user, defaultProfile);
        setProfile(defaultProfile);
        router.push('/profile-setup');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setProfile(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      try {
        if (user) {
          setUser(user);
          const userProfile = await getUserProfile(user.uid);
          
          if (userProfile) {
            setProfile(userProfile);
          } else {
            const defaultProfile = {
              uid: user.uid,
              email: user.email || '',
              hasProfile: false,
              displayName: '',
              fullName: '',
              postcode: '',
              instruments: [],
              firstName: '',
              lastName: '',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await createUserProfile(user, defaultProfile);
            setProfile(defaultProfile);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth state observer error:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Don't render children until initial auth check is complete
  if (!isInitialized) {
    return null;
  }

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