"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { api } from "@/lib/api-client";
import { UserProfile, LanguageCode } from "@/types";

const GUEST_PROFILE: UserProfile = {
  uid: "guest",
  displayName: "Guest",
  email: "",
  photoURL: "",
  targetLanguages: ["de" as LanguageCode],
  activeLanguage: "de" as LanguageCode,
  streakCount: 0,
  lastSessionDate: null,
  totalXP: 0,
  createdAt: 0,
};

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isGuest: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: () => void;
  exitGuest: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      // GET profile; if not found yet, PUT will create it (first sign-in)
      const p = await api.getProfile().catch(() => api.updateProfile({}));
      setProfile(p);
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [loadProfile]);

  const signInWithGoogle = async () => {
    setIsGuest(false);
    await signInWithPopup(auth, googleProvider);
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setProfile(GUEST_PROFILE);
  };

  // Merge guest into real account — called after sign-in while in guest mode
  const exitGuest = () => {
    setIsGuest(false);
    setProfile(null);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setIsGuest(false);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isGuest,
        loading,
        signInWithGoogle,
        continueAsGuest,
        exitGuest,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
