//src\contexts\auth\AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/config/firebase";
import { getUserProfile, UserProfile } from "@/lib/services/firebase/auth";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  needsProfile: boolean;
  isProfileComplete: boolean;  // Add this
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isProfileComplete = (profile: UserProfile | null): boolean => {
    return !!(
      profile &&
      profile.displayName?.trim() &&
      profile.fullName?.trim() &&
      profile.postcode?.trim() &&
      profile.instruments?.length > 0
    );
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setUser(user);

      if (user) {
        try {
          const userProfile = await getUserProfile(user.uid);
          setProfile(userProfile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await auth.signOut();
  };

  const needsProfile = !!user && !profile;

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      isLoading, 
      needsProfile,
      isProfileComplete: profile ? isProfileComplete(profile) : false,
      login, 
      logout 
    }}>
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