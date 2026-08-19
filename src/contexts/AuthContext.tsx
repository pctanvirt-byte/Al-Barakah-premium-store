import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { User, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { UserProfile } from '../types.ts';
import { fetchApi } from '../api/client.ts';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initialize from LocalStorage if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem('albarakah_customer_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          const emailLower = parsed.email.toLowerCase().trim();
          const isSuper = emailLower === 'pctanvirt@gmail.com' || emailLower === 'albarakahpremium10@gmail.com';
          setUser({
            uid: parsed.uid || `local_${Date.now()}`,
            email: parsed.email,
            displayName: parsed.name || parsed.displayName || parsed.email.split('@')[0],
            photoURL: parsed.photoURL || parsed.avatarUrl || null,
          });
          setProfile({
            id: parsed.id || `profile_${Date.now()}`,
            email: parsed.email,
            name: parsed.name || parsed.displayName || parsed.email.split('@')[0],
            avatarUrl: parsed.avatarUrl || parsed.photoURL,
            role: isSuper ? 'super_admin' : (parsed.role || 'customer'),
          });
        }
      }
    } catch (e) {
      console.warn('Could not restore local user session:', e);
    }
  }, []);

  // Listen to Firebase auth if available
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
        if (firebaseUser && firebaseUser.email) {
          const emailLower = firebaseUser.email.toLowerCase().trim();
          const isSuper = emailLower === 'pctanvirt@gmail.com' || emailLower === 'albarakahpremium10@gmail.com';
          const authUserObj: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            photoURL: firebaseUser.photoURL,
          };
          setUser(authUserObj);
          
          try {
            const res = await fetchApi<{ user: UserProfile }>('/api/auth/me');
            if (res?.user) {
              setProfile({
                ...res.user,
                role: isSuper ? 'super_admin' : (res.user.role || 'customer')
              });
            } else {
              setProfile({
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                avatarUrl: firebaseUser.photoURL || undefined,
                role: isSuper ? 'super_admin' : 'customer',
              });
            }
          } catch (e) {
            // Fallback profile
            setProfile({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              avatarUrl: firebaseUser.photoURL || undefined,
              role: isSuper ? 'super_admin' : 'customer',
            });
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setLoading(false);
    }
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const signInWithGoogle = async () => {
    try {
      // Attempt Firebase popup if configured
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result?.user?.email) {
        const authUser: AuthUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || result.user.email.split('@')[0],
          photoURL: result.user.photoURL,
        };
        setUser(authUser);
        localStorage.setItem('albarakah_customer_user', JSON.stringify(authUser));

        try {
          const res = await fetchApi<{ user: UserProfile }>('/api/auth/me');
          if (res?.user) setProfile(res.user);
        } catch (e) {
          // Ignored fallback
        }
        closeAuthModal();
      }
    } catch (error: any) {
      // If user voluntarily cancelled popup, just ignore
      if (
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request' ||
        error?.message?.includes('popup-closed-by-user')
      ) {
        return;
      }

      // If Firebase API key is invalid or not yet provisioned in Google Cloud
      if (
        error?.code === 'auth/api-key-not-valid' ||
        error?.code === 'auth/invalid-api-key' ||
        error?.message?.includes('api-key-not-valid') ||
        error?.message?.includes('API key')
      ) {
        console.warn('Firebase API key not yet connected. Opening direct customer login modal.');
        // Open the sleek customer login modal
        openAuthModal();
        return;
      }

      // Other errors open modal
      openAuthModal();
    }
  };

  const signInWithEmail = async (email: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name?.trim() || cleanEmail.split('@')[0];
    const isSuper = cleanEmail === 'pctanvirt@gmail.com' || cleanEmail === 'albarakahpremium10@gmail.com';

    const authUser: AuthUser = {
      uid: `user_${Date.now()}`,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
    };

    const userProfile: UserProfile = {
      id: authUser.uid,
      email: cleanEmail,
      name: cleanName,
      avatarUrl: authUser.photoURL || undefined,
      role: isSuper ? 'super_admin' : 'customer',
    };

    setUser(authUser);
    setProfile(userProfile);
    localStorage.setItem('albarakah_customer_user', JSON.stringify(userProfile));

    try {
      await fetchApi<{ user: UserProfile }>('/api/auth/me');
    } catch (e) {
      // Local fallback is active
    }

    closeAuthModal();
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth).catch(() => {});
    } catch (error) {
      // Ignore
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem('albarakah_customer_user');
    localStorage.removeItem('albarakah_admin_session');
  };

  const userEmailLower = user?.email?.toLowerCase().trim() || profile?.email?.toLowerCase().trim();
  const isSuperAdminEmail = userEmailLower === 'pctanvirt@gmail.com' || userEmailLower === 'albarakahpremium10@gmail.com';
  const isAdmin = isSuperAdminEmail || profile?.role === 'admin' || profile?.role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        signOut,
        logout: signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
