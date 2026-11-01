import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { User, onAuthStateChanged, updateProfile, ConfirmationResult } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { 
  getUserById, 
  ensureUserProfile, 
  normalizeHandle, 
  updateUserAvatarUrl, 
  updateUserProfile,
  subscribeToUserProfile,
  DESIGNATED_SUPER_ADMIN_EMAIL 
} from '../services/userService';
import { 
  registerWithEmail, 
  loginWithEmail, 
  loginWithGoogle, 
  loginWithApple, 
  requestPhoneCode, 
  verifyPhoneVerificationCode, 
  sendUserPasswordResetEmail,
  verifyResetCode,
  confirmUserPasswordReset,
  logoutUser 
} from '../services/authService';
import { withTimeout } from '../lib/asyncUtils';

interface AuthContextType {
  currentUser: User | null;
  user: User | null; // Alias for backward compatibility
  userProfile: UserProfile | null;
  profile: UserProfile | null; // Alias for backward compatibility
  role: UserRole;
  effectiveRole: UserRole;
  simulatedRole: UserRole | null;
  setSimulatedRole: (role: UserRole | null) => void;
  loading: boolean;
  isAuthenticated: boolean;
  isRegisteredUser: boolean;
  isUser: boolean;
  isEditor: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isGuest: boolean;
  isSuspended: boolean;
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
  signInWithGoogle: () => Promise<{ success: boolean; error?: string; isProviderDisabled?: boolean }>;
  signInWithApple: () => Promise<{ success: boolean; error?: string; isProviderDisabled?: boolean }>;
  sendPhoneCode: (
    phoneNumber: string,
    containerIdOrElement: string | HTMLElement
  ) => Promise<{ success: boolean; confirmationResult?: ConfirmationResult; error?: string; isProviderDisabled?: boolean }>;
  verifyPhoneCode: (
    confirmationResult: ConfirmationResult,
    code: string
  ) => Promise<{ success: boolean; error?: string; isProviderDisabled?: boolean }>;
  resetPasswordEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyResetActionCode: (oobCode: string) => Promise<{ success: boolean; email?: string; error?: string }>;
  completePasswordReset: (oobCode: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserPhoto: (photoURL: string) => Promise<{ success: boolean; error?: string }>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [simulatedRole, setSimulatedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isAuthResolvedRef = useRef<boolean>(false);

  const createFallbackProfile = useCallback((firebaseUser: User): UserProfile => {
    const rawName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : '') || 'scholar';
    const cleanHandle = normalizeHandle(rawName) || 'scholar';
    const email = (firebaseUser.email || '').trim().toLowerCase();
    const isDesignatedSuperAdmin = email === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase();

    let detectedProvider: 'password' | 'google' | 'apple' | 'phone' | string = 'password';
    if (firebaseUser.providerData && firebaseUser.providerData.length > 0) {
      const pIds = firebaseUser.providerData.map((p) => p.providerId);
      if (pIds.some((p) => p === 'google.com' || p.includes('google'))) {
        detectedProvider = 'google';
      } else if (pIds.some((p) => p === 'apple.com' || p.includes('apple'))) {
        detectedProvider = 'apple';
      } else if (pIds.some((p) => p === 'phone' || p.includes('phone'))) {
        detectedProvider = 'phone';
      } else if (pIds.some((p) => p === 'password')) {
        detectedProvider = 'password';
      }
    } else if (firebaseUser.phoneNumber && !email) {
      detectedProvider = 'phone';
    }

    return {
      id: firebaseUser.uid,
      username: cleanHandle,
      displayName: firebaseUser.displayName || cleanHandle,
      email,
      role: isDesignatedSuperAdmin ? 'super_admin' : 'user',
      authProvider: detectedProvider,
      photoURL: firebaseUser.photoURL || '',
      bio: isDesignatedSuperAdmin 
        ? 'Chief Super Administrator of TheLegendsWiki.' 
        : 'Contributor and researcher at TheLegendsWiki.',
      disabled: false,
      articlesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, []);

  const fetchProfile = useCallback(async (firebaseUser: User): Promise<UserProfile> => {
    const fallback = createFallbackProfile(firebaseUser);
    try {
      const profile = await withTimeout(
        ensureUserProfile(firebaseUser),
        8000,
        fallback
      );
      setUserProfile(profile || fallback);
      return profile || fallback;
    } catch (err) {
      console.warn('Failed to ensure user profile document:', err);
      setUserProfile(fallback);
      return fallback;
    }
  }, [createFallbackProfile]);

  useEffect(() => {
    // Failsafe timer: Ensure loading is set to false after max 3500ms under any circumstance
    const failsafeTimer = setTimeout(() => {
      if (!isAuthResolvedRef.current) {
        isAuthResolvedRef.current = true;
        setLoading(false);
      }
    }, 3500);

    if (!isFirebaseConfigured() || !auth) {
      setCurrentUser(null);
      setUserProfile(null);
      isAuthResolvedRef.current = true;
      setLoading(false);
      clearTimeout(failsafeTimer);
      return;
    }

    // Proactively sync with persistent Firebase Auth state
    if (typeof auth.authStateReady === 'function') {
      auth.authStateReady().then(() => {
        if (auth.currentUser) {
          setCurrentUser(auth.currentUser);
        }
      }).catch(console.warn);
    }

    let profileUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (profileUnsub) {
          profileUnsub();
          profileUnsub = null;
        }

        setCurrentUser(firebaseUser);
        if (firebaseUser) {
          await fetchProfile(firebaseUser);

          // Establish real-time listener for current user's profile and role updates
          profileUnsub = subscribeToUserProfile(firebaseUser.uid, (liveProfile) => {
            if (liveProfile) {
              setUserProfile((prev) => {
                if (!prev) return liveProfile;
                return {
                  ...prev,
                  ...liveProfile,
                };
              });
            }
          });
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.warn('Error during onAuthStateChanged profile resolution:', err);
      } finally {
        isAuthResolvedRef.current = true;
        setLoading(false);
        clearTimeout(failsafeTimer);
      }
    });

    // Cross-tab / In-app real-time event listener for role changes
    const handleRoleChangedEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; newRole: UserRole; user?: UserProfile }>;
      if (!customEvent.detail) return;
      const targetId = customEvent.detail.userId;
      setUserProfile((prev) => {
        if (!prev) return prev;
        // Designated Root Super Admin always retains super_admin role
        if (prev.email.toLowerCase() === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase()) {
          return { ...prev, role: 'super_admin' };
        }
        if (prev.id === targetId || (currentUser && currentUser.uid === targetId)) {
          return {
            ...prev,
            role: customEvent.detail.newRole,
          };
        }
        return prev;
      });
    };

    const handleAvatarChangedEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; photoURL: string }>;
      if (customEvent.detail && (currentUser?.uid === customEvent.detail.userId || userProfile?.id === customEvent.detail.userId)) {
        setUserProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            photoURL: customEvent.detail.photoURL,
          };
        });
      }
    };

    const handleStatusChangedEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; disabled: boolean }>;
      if (customEvent.detail) {
        const { userId, disabled } = customEvent.detail;
        if (currentUser?.uid === userId || userProfile?.id === userId) {
          setUserProfile((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              disabled,
            };
          });
        }
      }
    };

    window.addEventListener('thelegendswiki:user-role-changed', handleRoleChangedEvent);
    window.addEventListener('thelegendswiki:user-avatar-updated', handleAvatarChangedEvent);
    window.addEventListener('thelegendswiki:user-status-changed', handleStatusChangedEvent);

    return () => {
      clearTimeout(failsafeTimer);
      if (profileUnsub) profileUnsub();
      window.removeEventListener('thelegendswiki:user-role-changed', handleRoleChangedEvent);
      window.removeEventListener('thelegendswiki:user-avatar-updated', handleAvatarChangedEvent);
      window.removeEventListener('thelegendswiki:user-status-changed', handleStatusChangedEvent);
      unsubscribe();
    };
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  }, [currentUser, fetchProfile]);

  const updateUserPhoto = async (photoURL: string): Promise<{ success: boolean; error?: string }> => {
    const targetUid = currentUser?.uid || userProfile?.id;
    if (!targetUid) {
      return { success: false, error: 'Not authenticated.' };
    }

    try {
      // Optimistically update context state
      setUserProfile((prev) => (prev ? { ...prev, photoURL } : null));

      // Synchronize Firebase Auth user profile if active with non-blocking timeout
      if (currentUser && typeof updateProfile === 'function') {
        try {
          await withTimeout(updateProfile(currentUser, { photoURL }), 1500, null);
        } catch {
          // Non-blocking
        }
      }

      // Persist to service & database
      const res = await updateUserAvatarUrl(targetUid, photoURL);
      return res;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update photo.' };
    }
  };

  const updateProfileData = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    const targetUid = currentUser?.uid || userProfile?.id;
    if (!targetUid) {
      return { success: false, error: 'Not authenticated.' };
    }

    try {
      // 1. Sync Firebase Auth displayName if currentUser is signed in
      if (updates.displayName && currentUser && typeof updateProfile === 'function') {
        try {
          await withTimeout(updateProfile(currentUser, { displayName: updates.displayName }), 2000, null);
        } catch (authErr) {
          console.warn('[AuthContext] Notice: Firebase Auth profile displayName update bypassed:', authErr);
        }
      }

      // 2. Persist to authoritative Firestore document
      const res = await updateUserProfile(targetUid, updates);
      if (!res.success) {
        return { success: false, error: res.error || 'Failed to update profile in database.' };
      }

      // 3. Update local state
      setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
      return res;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update profile.' };
    }
  };

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
      if (result.user) {
        setCurrentUser(result.user);
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
      if (result.user) {
        setCurrentUser(result.user);
      }
      if (result.profile) {
        setUserProfile(result.profile);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed.' };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await loginWithGoogle();
      if (result.error) {
        return { success: false, error: result.error, isProviderDisabled: result.isProviderDisabled };
      }
      if (result.user) {
        setCurrentUser(result.user);
      }
      if (result.profile) {
        setUserProfile(result.profile);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Google authentication failed.' };
    }
  };

  const signInWithApple = async () => {
    try {
      const result = await loginWithApple();
      if (result.error) {
        return { success: false, error: result.error, isProviderDisabled: result.isProviderDisabled };
      }
      if (result.user) {
        setCurrentUser(result.user);
      }
      if (result.profile) {
        setUserProfile(result.profile);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Apple authentication failed.' };
    }
  };

  const sendPhoneCode = async (
    phoneNumber: string,
    containerIdOrElement: string | HTMLElement
  ) => {
    try {
      const result = await requestPhoneCode(phoneNumber, containerIdOrElement);
      if (result.error) {
        return {
          success: false,
          error: result.error,
          isProviderDisabled: result.isProviderDisabled,
        };
      }
      return {
        success: true,
        confirmationResult: result.confirmationResult,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to dispatch phone verification SMS.',
      };
    }
  };

  const verifyPhoneCode = async (
    confirmationResult: ConfirmationResult,
    code: string
  ) => {
    try {
      const result = await verifyPhoneVerificationCode(confirmationResult, code);
      if (result.error) {
        return {
          success: false,
          error: result.error,
          isProviderDisabled: result.isProviderDisabled,
        };
      }
      if (result.user) {
        setCurrentUser(result.user);
      }
      if (result.profile) {
        setUserProfile(result.profile);
      }
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Verification failed.',
      };
    }
  };

  const resetPasswordEmail = async (email: string) => {
    try {
      return await sendUserPasswordResetEmail(email);
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to request password reset email.',
      };
    }
  };

  const verifyResetActionCode = async (oobCode: string) => {
    try {
      return await verifyResetCode(oobCode);
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to verify password reset link.',
      };
    }
  };

  const completePasswordReset = async (oobCode: string, newPassword: string) => {
    try {
      return await confirmUserPasswordReset(oobCode, newPassword);
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to update password.',
      };
    }
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setUserProfile(null);
    setSimulatedRole(null);
  };

  // Base role resolution: An unauthenticated visitor (no currentUser) is ALWAYS a guest.
  let rawRole: UserRole = 'guest';

  if (currentUser) {
    const authEmail = (currentUser.email || '').trim().toLowerCase();
    const profileRole = userProfile?.role;

    if (authEmail === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase() || profileRole === 'super_admin') {
      rawRole = 'super_admin';
    } else if (profileRole === 'admin' || profileRole === 'administrator' || profileRole === 'editor') {
      rawRole = 'admin';
    } else {
      rawRole = 'user';
    }
  }
  
  // Effective role incorporates simulated role if set for testing (only when authenticated or explicitly testing)
  const effectiveRole: UserRole = currentUser ? (simulatedRole || rawRole) : 'guest';

  const isGuest = !currentUser || effectiveRole === 'guest';
  const isSuperAdmin = Boolean(currentUser) && effectiveRole === 'super_admin';
  const isAdmin = Boolean(currentUser) && (isSuperAdmin || effectiveRole === 'admin' || effectiveRole === 'administrator' || effectiveRole === 'editor');
  const isEditor = isAdmin;
  const isUser = Boolean(currentUser) && !isGuest;
  const isRegisteredUser = Boolean(currentUser) && !isGuest;
  const isAuthenticated = Boolean(currentUser);
  const isSuspended = Boolean(!isSuperAdmin && currentUser && (userProfile?.disabled === true));

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        userProfile,
        profile: userProfile,
        role: effectiveRole,
        effectiveRole,
        simulatedRole,
        setSimulatedRole,
        loading,
        isAuthenticated,
        isRegisteredUser,
        isUser,
        isEditor,
        isAdmin,
        isSuperAdmin,
        isGuest,
        isSuspended,
        signup,
        login,
        signInWithGoogle,
        signInWithApple,
        sendPhoneCode,
        verifyPhoneCode,
        resetPasswordEmail,
        verifyResetActionCode,
        completePasswordReset,
        logout,
        refreshProfile,
        updateUserPhoto,
        updateProfileData,
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
