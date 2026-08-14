import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  limit 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { validateUserProfile } from '../lib/validation';
import { getDbTimestamp } from '../lib/timestamps';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';

const USERS_COLLECTION = 'users';

function normalizeUserDoc(id: string, data: any): UserProfile {
  return {
    id: id || data.id,
    username: (data.username || 'user').toLowerCase().trim(),
    displayName: data.displayName || data.username || 'Scholar',
    email: data.email || '',
    role: (data.role as UserRole) || 'registered_user',
    photoURL: data.photoURL || undefined,
    bio: data.bio || undefined,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

/**
 * Checks if a preferred username is available (case-insensitive).
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const clean = (username || '').trim().toLowerCase();
  if (!clean || clean.length < 3 || clean.length > 30) return false;
  if (!isFirebaseConfigured() || !db) return true;

  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('username', '==', clean), limit(1));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch (error) {
    console.warn(`Error checking username availability for "${clean}":`, error);
    // If offline or error, allow progression so auth isn't completely blocked
    return true;
  }
}

/**
 * Retrieves a user profile by Firebase Auth UID.
 */
export async function getUserById(id: string): Promise<UserProfile | null> {
  if (!id || !isFirebaseConfigured() || !db) return null;

  try {
    const docRef = doc(db, USERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return normalizeUserDoc(docSnap.id, docSnap.data());
  } catch (error) {
    console.warn(`Error fetching user profile for ID "${id}":`, error);
    return null;
  }
}

/**
 * Retrieves a user profile by public username.
 */
export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  const clean = (username || '').trim().toLowerCase();
  if (!clean || !isFirebaseConfigured() || !db) return null;

  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('username', '==', clean), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    return normalizeUserDoc(docSnap.id, docSnap.data());
  } catch (error) {
    console.warn(`Error fetching user by username "${clean}":`, error);
    return null;
  }
}

/**
 * Creates a user profile record in Firestore during registration.
 * Default role is strictly 'registered_user'.
 */
export async function createUserProfile(
  userData: Partial<UserProfile>
): Promise<{ success: boolean; errors?: Record<string, string> }> {
  const cleanUsername = (userData.username || '').trim().toLowerCase();
  const preparedData: Partial<UserProfile> = {
    ...userData,
    username: cleanUsername,
    role: 'registered_user', // New users always receive registered_user role
  };

  const validation = validateUserProfile(preparedData);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  if (!isFirebaseConfigured() || !db) {
    return { success: true };
  }

  const docRef = doc(db, USERS_COLLECTION, userData.id!);
  const now = getDbTimestamp();

  const payload: UserProfile = {
    id: userData.id!,
    username: cleanUsername,
    displayName: (userData.displayName || cleanUsername).trim(),
    email: (userData.email || '').trim().toLowerCase(),
    role: 'registered_user',
    photoURL: userData.photoURL || undefined,
    bio: userData.bio || '',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(docRef, payload);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userData.id}`);
    return { success: false, errors: { general: 'Failed to write user profile to database.' } };
  }
}

/**
 * Updates a user profile. Prevents self-escalation of roles.
 */
export async function updateUserProfile(
  id: string,
  userData: Partial<UserProfile>
): Promise<{ success: boolean }> {
  if (!id || !isFirebaseConfigured() || !db) {
    throw new Error('User ID and configured Firestore are required.');
  }

  const docRef = doc(db, USERS_COLLECTION, id);
  // Never allow role modification via regular user profile update
  const sanitizedUpdates = { ...userData };
  delete sanitizedUpdates.role;
  delete sanitizedUpdates.id;

  try {
    await updateDoc(docRef, {
      ...sanitizedUpdates,
      updatedAt: getDbTimestamp(),
    });

    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    return { success: false };
  }
}

/**
 * Gets a user's role with fallback to 'guest'.
 */
export async function getUserRole(id: string): Promise<UserRole> {
  if (!id) return 'guest';
  const profile = await getUserById(id);
  return profile?.role || 'guest';
}
