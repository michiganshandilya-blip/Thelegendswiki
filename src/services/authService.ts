import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile } from '../types';
import { createUserProfile, getUserById, isUsernameAvailable } from './userService';

export interface AuthResult {
  user: User | null;
  profile: UserProfile | null;
  error?: string;
  isProviderDisabled?: boolean;
}

/**
 * Maps raw Firebase authentication errors into clear, friendly, and actionable messages.
 */
export function formatAuthError(error: any): { message: string; isProviderDisabled?: boolean } {
  if (!error) return { message: 'An unknown authentication error occurred.' };

  const code = error?.code || '';
  const rawMsg = error?.message || '';

  if (code === 'auth/operation-not-allowed') {
    return {
      message:
        'Email/Password sign-in is currently disabled in your Firebase project. To enable it, navigate to Firebase Console → Authentication → Sign-in method → Email/Password.',
      isProviderDisabled: true,
    };
  }

  if (code === 'auth/email-already-in-use') {
    return {
      message: 'This email address is already registered in TheLegendsWiki. Please log in instead.',
    };
  }

  if (code === 'auth/invalid-email') {
    return {
      message: 'Please enter a valid institutional or personal email address.',
    };
  }

  if (code === 'auth/weak-password') {
    return {
      message: 'Password security is too weak. Please use at least 6 characters.',
    };
  }

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return {
      message: 'Invalid email or password credentials. Please double check and try again.',
    };
  }

  if (code === 'auth/user-disabled') {
    return {
      message: 'This researcher account has been deactivated by registry administrators.',
    };
  }

  if (code === 'auth/too-many-requests') {
    return {
      message: 'Access temporarily locked due to consecutive failed attempts. Please try again shortly.',
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      message: 'Network connection failed. Please check your internet connection and try again.',
    };
  }

  // Fallback to cleaner message
  if (rawMsg) {
    const cleanMsg = rawMsg.replace(/^Firebase:\s*/, '').replace(/\s*\([^)]*\)$/, '');
    return { message: cleanMsg || 'Authentication failed. Please verify your details.' };
  }

  return { message: 'Authentication failed. Please try again.' };
}

/**
 * Registers a new researcher with Firebase Auth and creates their Firestore user profile document.
 */
export async function registerWithEmail(
  displayName: string,
  username: string,
  email: string,
  password: string
): Promise<AuthResult> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  const cleanDisplayName = displayName.trim();
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  // 1. Validate inputs before hitting Firebase
  if (!cleanDisplayName || cleanDisplayName.length < 2) {
    return {
      user: null,
      profile: null,
      error: 'Please enter your full researcher or display name.',
    };
  }

  if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 30) {
    return {
      user: null,
      profile: null,
      error: 'Username must be between 3 and 30 characters.',
    };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
    return {
      user: null,
      profile: null,
      error: 'Username may only contain letters, numbers, and underscores.',
    };
  }

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return {
      user: null,
      profile: null,
      error: 'Please enter a valid email address.',
    };
  }

  if (!password || password.length < 6) {
    return {
      user: null,
      profile: null,
      error: 'Password must be at least 6 characters long.',
    };
  }

  // 2. Database-backed uniqueness check for username
  const isAvailable = await isUsernameAvailable(cleanUsername);
  if (!isAvailable) {
    return {
      user: null,
      profile: null,
      error: `The username "@${cleanUsername}" is already claimed by another researcher. Please choose a different handle.`,
    };
  }

  // 3. Create Firebase Auth user
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const authUser = userCredential.user;

    // Update display name in Firebase Auth
    try {
      await updateProfile(authUser, {
        displayName: cleanDisplayName,
      });
    } catch (profileErr) {
      console.warn('Could not update Firebase Auth displayName:', profileErr);
    }

    // 4. Create Firestore document with role = 'registered_user'
    const newProfile: Partial<UserProfile> = {
      id: authUser.uid,
      username: cleanUsername,
      displayName: cleanDisplayName,
      email: cleanEmail,
      role: 'registered_user',
      photoURL: authUser.photoURL || undefined,
    };

    await createUserProfile(newProfile);

    const savedProfile = await getUserById(authUser.uid);

    return {
      user: authUser,
      profile: savedProfile || (newProfile as UserProfile),
    };
  } catch (error: any) {
    const { message, isProviderDisabled } = formatAuthError(error);
    return {
      user: null,
      profile: null,
      error: message,
      isProviderDisabled,
    };
  }
}

/**
 * Logs in an existing user with email and password.
 */
export async function loginWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    return {
      user: null,
      profile: null,
      error: 'Please provide your account email address.',
    };
  }

  if (!password) {
    return {
      user: null,
      profile: null,
      error: 'Please enter your password.',
    };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const authUser = userCredential.user;

    // Fetch user profile from Firestore
    let profile = await getUserById(authUser.uid);

    // If profile document does not exist yet (e.g. edge case), create default profile
    if (!profile) {
      const defaultUsername = (authUser.email?.split('@')[0] || 'scholar')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20);

      await createUserProfile({
        id: authUser.uid,
        username: defaultUsername,
        displayName: authUser.displayName || defaultUsername,
        email: authUser.email || '',
        role: 'registered_user',
      });
      profile = await getUserById(authUser.uid);
    }

    return {
      user: authUser,
      profile,
    };
  } catch (error: any) {
    const { message, isProviderDisabled } = formatAuthError(error);
    return {
      user: null,
      profile: null,
      error: message,
      isProviderDisabled,
    };
  }
}

/**
 * Signs out the current user.
 */
export async function logoutUser(): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured() || !auth) {
    return { success: true };
  }

  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Error logging out:', error);
    return { success: false, error: error?.message || 'Failed to log out.' };
  }
}
