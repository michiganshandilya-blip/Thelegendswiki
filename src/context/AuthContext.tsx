import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { getUserById } from '../services/userService';
import { registerWithEmail, loginWithEmail, logoutUser } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  isAuthenticated: boolean;
  isEditor: boolean;
  isAdmin: boolean;
  signup: (
    displayName: string,
    username: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; isProviderDisabled?: boolean }>;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; isProviderDisabled?: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const profile = await getUserById(uid);
      setUserProfile(profile);
    } catch (err) {
      console.warn('Failed to load user profile document:', err);
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      setLoading(false);
      return;
    }

    // Central Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (currentUser) {
      await fetchProfile(currentUser.uid);
    }
  }, [currentUser, fetchProfile]);

  const signup = async (
    displayName: string,
    username: string,
    email: string,
    password: string
  ) => {
    try {
      const result = await registerWithEmail(displayName, username, email, password);
      if (result.error) {
        return { success: false, error: result.error, isProviderDisabled: result.isProviderDisabled };
      }
      if (result.profile) {
        setUserProfile(result.profile);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create account.' };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await loginWithEmail(email, password);
      if (result.error) {
        return { success: false, error: result.error, isProviderDisabled: result.isProviderDisabled };
      }
      if (result.profile) {
        setUserProfile(result.profile);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed.' };
    }
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const role: UserRole = userProfile?.role || 'guest';
  const isEditor = role === 'editor' || role === 'administrator';
  const isAdmin = role === 'administrator';
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        loading,
        isAuthenticated,
        isEditor,
        isAdmin,
        signup,
        login,
        logout,
        refreshProfile,
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
