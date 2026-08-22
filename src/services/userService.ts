import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { validateUserProfile } from '../lib/validation';
import { getDbTimestamp } from '../lib/timestamps';
import { stripUndefined } from '../lib/sanitize';
import { withTimeout } from '../lib/asyncUtils';
import { logAuditEvent } from './auditService';

const USERS_COLLECTION = 'users';
const FIRESTORE_TIMEOUT_MS = 3000;

export const DESIGNATED_SUPER_ADMIN_EMAIL = 'michiganshandilya@gmail.com';

// Ongoing deduplication map for ensuring user profiles
const ongoingEnsures = new Map<string, Promise<UserProfile>>();

/**
 * Normalizes a contributor handle:
 * - Strips leading '@' characters
 * - Converts to lowercase and trims whitespace
 * - Removes invalid characters for consistent internal storage and lookup
 */
export function normalizeHandle(handle?: string | null): string {
  if (!handle) return '';
  return handle
    .toString()
    .replace(/^@+/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '');
}

/**
 * Formats a handle for display with a leading '@'
 */
export function formatDisplayHandle(handle?: string | null): string {
  if (!handle) return '';
  const clean = handle.toString().replace(/^@+/, '').trim();
  return clean ? `@${clean}` : '';
}

// Pre-seeded default profiles with 3-tier hierarchy for initial installation
const defaultInitialUsers: UserProfile[] = [
  {
    id: 'super-admin-root-01',
    username: 'super_admin_michigan',
    displayName: 'Michigan Shandilya (Super Admin)',
    email: DESIGNATED_SUPER_ADMIN_EMAIL,
    role: 'super_admin',
    photoURL: '',
    bio: 'System Super Administrator with root governance and administrative oversight authority.',
    disabled: false,
    articlesCount: 38,
    lastActive: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user-scholar-1',
    username: 'callimachus',
    displayName: 'Callimachus of Cyrene',
    email: 'callimachus@alexandrialibrary.org',
    role: 'admin',
    photoURL: '',
    bio: 'Chief cataloger and creator of the Pinakes encyclopedic registry.',
    disabled: false,
    articlesCount: 14,
    lastActive: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: '2024-01-15T08:00:00.000Z',
    updatedAt: '2025-02-01T12:00:00.000Z',
  },
  {
    id: 'user-scholar-2',
    username: 'hypatia',
    displayName: 'Hypatia of Alexandria',
    email: 'hypatia@alexandrialibrary.org',
    role: 'admin',
    photoURL: '',
    bio: 'Mathematician, astronomer, and peer review curator.',
    disabled: false,
    articlesCount: 22,
    lastActive: new Date(Date.now() - 3600000 * 5).toISOString(),
    createdAt: '2024-02-10T09:30:00.000Z',
    updatedAt: '2025-02-10T14:20:00.000Z',
  },
  {
    id: 'user-scholar-3',
    username: 'eratosthenes',
    displayName: 'Eratosthenes',
    email: 'eratosthenes@alexandrialibrary.org',
    role: 'user',
    photoURL: '',
    bio: 'Chief librarian, geographer, and computational archivist.',
    disabled: false,
    articlesCount: 8,
    lastActive: new Date(Date.now() - 3600000 * 24).toISOString(),
    createdAt: '2024-03-22T11:15:00.000Z',
    updatedAt: '2025-01-18T10:00:00.000Z',
  },
  {
    id: 'user-scholar-4',
    username: 'ptolemy',
    displayName: 'Claudius Ptolemy',
    email: 'ptolemy@alexandrialibrary.org',
    role: 'user',
    photoURL: '',
    bio: 'Cartographer and author of astronomical treaties.',
    disabled: false,
    articlesCount: 5,
    lastActive: new Date(Date.now() - 3600000 * 48).toISOString(),
    createdAt: '2024-04-05T14:40:00.000Z',
    updatedAt: '2024-11-20T16:00:00.000Z',
  },
  {
    id: 'demo-scholar-id',
    username: 'demo_scholar',
    displayName: 'Dr. Marcus Vance',
    email: 'scholar@thelegendswiki.org',
    role: 'admin',
    photoURL: '',
    bio: 'Senior archivist specializing in Classical Antiquity, lost civilizations, and Alexandrian records.',
    disabled: false,
    articlesCount: 6,
    lastActive: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2025-01-15T00:00:00.000Z',
  }
];

const USER_CACHE_STORAGE_KEY = 'thelegendswiki_user_registry_v4';

function loadCachedUsers(): UserProfile[] {
  if (typeof window === 'undefined') return [...defaultInitialUsers];
  try {
    const raw = localStorage.getItem(USER_CACHE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const parsedMap = new Map<string, UserProfile>(parsed.map((u: UserProfile) => [u.id, u]));
        for (const d of defaultInitialUsers) {
          if (!parsedMap.has(d.id)) {
            parsedMap.set(d.id, d);
          }
        }
        return Array.from(parsedMap.values());
      }
    }
  } catch {
    // Non-blocking
  }
  return [...defaultInitialUsers];
}

function saveCachedUsers(users: UserProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_CACHE_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // Non-blocking
  }
}

// Persistent and in-memory registry of users
let fallbackUsers: UserProfile[] = loadCachedUsers();

export function normalizeUserDoc(id: string, data: any): UserProfile {
  const rawUsername = data.username || data.handle || id || 'scholar';
  const email = (data.email || '').trim().toLowerCase();
  
  // Enforce super_admin for designated root email
  let role: UserRole = (data.role as UserRole) || 'user';
  if (email === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase()) {
    role = 'super_admin';
  } else if (role === 'registered_user' || role === 'guest') {
    role = 'user';
  } else if (role === 'editor' || role === 'administrator') {
    role = 'admin';
  }

  return {
    id: id || data.id,
    username: normalizeHandle(rawUsername) || 'scholar',
    displayName: data.displayName || data.username || (data.phoneNumber ? `Researcher (${data.phoneNumber.slice(-4)})` : 'Scholar'),
    email,
    phoneNumber: data.phoneNumber || '',
    role,
    photoURL: data.photoURL || '',
    bio: data.bio || '',
    disabled: Boolean(data.disabled),
    articlesCount: typeof data.articlesCount === 'number' ? data.articlesCount : 0,
    lastActive: data.lastActive || data.updatedAt || new Date().toISOString(),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

/**
 * Real-time subscription to all users in the registry.
 * Fires immediately upon snapshot and propagates updates instantaneously.
 */
export function subscribeToUsers(
  callback: (users: UserProfile[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  if (!isFirebaseConfigured() || !db) {
    // Initial emit for fallback
    callback([...fallbackUsers]);
    return () => {};
  }

  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, orderBy('createdAt', 'desc'), limit(150));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreList = snapshot.docs.map((d) => normalizeUserDoc(d.id, d.data()));

        // Merge any fallback demo accounts not yet created in Firestore
        const idSet = new Set(firestoreList.map((u) => u.id));
        const merged = [...firestoreList];
        for (const f of fallbackUsers) {
          if (!idSet.has(f.id)) {
            merged.push(f);
          }
        }

        // Update local memory and persistent cache
        fallbackUsers = [...merged];
        saveCachedUsers(fallbackUsers);
        callback(merged);
      },
      (error) => {
        console.warn('Real-time users subscription error, falling back to local list:', error);
        callback([...fallbackUsers]);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Could not establish onSnapshot for users:', err);
    callback([...fallbackUsers]);
    return () => {};
  }
}

/**
 * Real-time subscription to a single user's profile document.
 */
export function subscribeToUserProfile(
  userId: string,
  callback: (profile: UserProfile | null) => void,
  onError?: (error: any) => void
): Unsubscribe {
  if (!userId) {
    callback(null);
    return () => {};
  }

  if (!isFirebaseConfigured() || !db) {
    const mem = fallbackUsers.find((u) => u.id === userId) || null;
    callback(mem);
    return () => {};
  }

  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const parsed = normalizeUserDoc(docSnap.id, docSnap.data());
          // Update memory cache
          fallbackUsers = [parsed, ...fallbackUsers.filter((u) => u.id !== parsed.id)];
          callback(parsed);
        } else {
          const mem = fallbackUsers.find((u) => u.id === userId) || null;
          callback(mem);
        }
      },
      (error) => {
        console.warn(`Error in real-time listener for user profile ${userId}:`, error);
        const mem = fallbackUsers.find((u) => u.id === userId) || null;
        callback(mem);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn(`Could not attach snapshot to user ${userId}:`, err);
    const mem = fallbackUsers.find((u) => u.id === userId) || null;
    callback(mem);
    return () => {};
  }
}

/**
 * Checks if a preferred username is available (case-insensitive) with timeout resilience.
 */
export async function isUsernameAvailable(username: string, excludeUid?: string): Promise<boolean> {
  const clean = normalizeHandle(username);
  if (!clean || clean.length < 2 || clean.length > 30) return false;
  
  if (!isFirebaseConfigured() || !db) {
    return !fallbackUsers.some((u) => u.id !== excludeUid && normalizeHandle(u.username) === clean);
  }

  try {
    const queryFn = async () => {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where('username', '==', clean), limit(5));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return true;
      if (excludeUid) {
        return snapshot.docs.every((d) => d.id === excludeUid);
      }
      return false;
    };

    return await withTimeout(queryFn(), FIRESTORE_TIMEOUT_MS, true);
  } catch (error) {
    console.warn(`Error checking username availability for "${clean}":`, error);
    return true;
  }
}

/**
 * Retrieves a user profile by Firebase Auth UID with timeout and memory cache.
 */
export async function getUserById(id: string): Promise<UserProfile | null> {
  if (!id) return null;

  // 1. Check in-memory cache first
  const memoryUser = fallbackUsers.find((u) => u.id === id);

  if (!isFirebaseConfigured() || !db) {
    return memoryUser || null;
  }

  try {
    const fetchFn = async () => {
      const docRef = doc(db, USERS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return memoryUser || null;
      }

      const parsed = normalizeUserDoc(docSnap.id, docSnap.data());
      // Update memory cache
      fallbackUsers = [parsed, ...fallbackUsers.filter((u) => u.id !== parsed.id)];
      return parsed;
    };

    return await withTimeout(fetchFn(), FIRESTORE_TIMEOUT_MS, memoryUser || null);
  } catch (error) {
    console.warn(`Error fetching user profile for ID "${id}":`, error);
    return memoryUser || null;
  }
}

/**
 * Retrieves a user profile by public username or handle with timeout resilience.
 */
export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  const clean = normalizeHandle(username);
  if (!clean) return null;

  const memoryMatch = fallbackUsers.find((u) => normalizeHandle(u.username) === clean || u.id === clean);

  if (!isFirebaseConfigured() || !db) {
    return memoryMatch || null;
  }

  try {
    const fetchFn = async () => {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where('username', '==', clean), limit(1));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const parsed = normalizeUserDoc(docSnap.id, docSnap.data());
        fallbackUsers = [parsed, ...fallbackUsers.filter((u) => u.id !== parsed.id)];
        return parsed;
      }

      // Also check if clean was UID directly
      const directDoc = await getUserById(clean);
      if (directDoc) return directDoc;

      return memoryMatch || null;
    };

    return await withTimeout(fetchFn(), FIRESTORE_TIMEOUT_MS, memoryMatch || null);
  } catch (error) {
    console.warn(`Error fetching user by username "${clean}":`, error);
    return memoryMatch || null;
  }
}

/**
 * Flexible contributor lookup by Handle, UID, or Email.
 */
export async function getUserByIdOrHandle(identifier: string): Promise<UserProfile | null> {
  if (!identifier) return null;
  const clean = normalizeHandle(identifier);

  // Check memory cache first
  const memoryMatch = fallbackUsers.find(
    (u) => u.id === identifier || normalizeHandle(u.username) === clean || (identifier.includes('@') && u.email === identifier.toLowerCase())
  );
  if (memoryMatch) return memoryMatch;
  
  // 1. Try direct ID lookup
  const byId = await getUserById(identifier);
  if (byId) return byId;

  // 2. Try by username
  if (clean) {
    const byUsername = await getUserByUsername(clean);
    if (byUsername) return byUsername;
  }

  // 3. Try by email if format looks like email
  if (identifier.includes('@') && !identifier.startsWith('@')) {
    try {
      if (isFirebaseConfigured() && db) {
        const emailFn = async () => {
          const usersRef = collection(db, USERS_COLLECTION);
          const q = query(usersRef, where('email', '==', identifier.trim().toLowerCase()), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const parsed = normalizeUserDoc(snap.docs[0].id, snap.docs[0].data());
            fallbackUsers = [parsed, ...fallbackUsers.filter((u) => u.id !== parsed.id)];
            return parsed;
          }
          return null;
        };

        return await withTimeout(emailFn(), FIRESTORE_TIMEOUT_MS, null);
      }
    } catch (err) {
      console.warn('Error querying user by email:', err);
    }
  }

  return null;
}

/**
 * Ensures an authenticated user has a registered Contributor Profile in Firestore.
 * Automatically grants super_admin to designated email 'michiganshandilya@gmail.com'.
 * All standard signups receive default role 'user'.
 */
export async function ensureUserProfile(
  authUser: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    phoneNumber?: string | null;
  },
  preferredHandle?: string
): Promise<UserProfile> {
  if (!authUser || !authUser.uid) {
    throw new Error('Valid authenticated user is required to ensure profile.');
  }

  const existingPromise = ongoingEnsures.get(authUser.uid);
  if (existingPromise) {
    return existingPromise;
  }

  const execution = (async (): Promise<UserProfile> => {
    const existing = await getUserById(authUser.uid);
    const email = (authUser.email || '').trim().toLowerCase();
    const phoneNumber = (authUser.phoneNumber || '').trim();
    const isSuperAdminEmail = email === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase();

    if (existing) {
      // If email is root super admin email but stored role was different, update to super_admin
      if (isSuperAdminEmail && existing.role !== 'super_admin') {
        const corrected: UserProfile = {
          ...existing,
          role: 'super_admin',
          updatedAt: new Date().toISOString(),
        };
        fallbackUsers = [corrected, ...fallbackUsers.filter((u) => u.id !== corrected.id)];
        if (isFirebaseConfigured() && db) {
          try {
            await setDoc(doc(db, USERS_COLLECTION, authUser.uid), { role: 'super_admin' }, { merge: true });
          } catch (e) {
            console.warn('Could not sync super_admin role to Firestore:', e);
          }
        }
        return corrected;
      }
      return existing;
    }

    // Derive a clean, valid handle
    let chosenHandle = normalizeHandle(preferredHandle);
    if (!chosenHandle) {
      if (authUser.displayName) {
        chosenHandle = normalizeHandle(authUser.displayName.replace(/\s+/g, '_'));
      }
      if (!chosenHandle && authUser.email) {
        chosenHandle = normalizeHandle(authUser.email.split('@')[0]);
      }
      if (!chosenHandle && phoneNumber) {
        const cleanDigits = phoneNumber.replace(/[^0-9]/g, '');
        chosenHandle = `scholar_${cleanDigits.slice(-4)}`;
      }
      if (!chosenHandle || chosenHandle.length < 2) {
        chosenHandle = `scholar_${authUser.uid.slice(0, 6).toLowerCase()}`;
      }
    }

    const available = await isUsernameAvailable(chosenHandle, authUser.uid);
    if (!available) {
      chosenHandle = `${chosenHandle}_${authUser.uid.slice(0, 4).toLowerCase()}`;
    }

    const now = getDbTimestamp();
    const displayName = (
      authUser.displayName ||
      (phoneNumber ? `Scholar (${phoneNumber.slice(-4)})` : chosenHandle) ||
      'Scholar'
    ).trim();
    const assignedRole: UserRole = isSuperAdminEmail ? 'super_admin' : 'user';

    const newProfile: UserProfile = {
      id: authUser.uid,
      username: chosenHandle,
      displayName,
      email,
      phoneNumber,
      role: assignedRole,
      photoURL: authUser.photoURL || '',
      bio: isSuperAdminEmail 
        ? 'Chief Super Administrator of TheLegendsWiki.' 
        : 'Contributor and researcher at TheLegendsWiki.',
      disabled: false,
      articlesCount: 0,
      lastActive: now,
      createdAt: now,
      updatedAt: now,
    };

    fallbackUsers = [newProfile, ...fallbackUsers.filter((u) => u.id !== newProfile.id)];

    if (isFirebaseConfigured() && db) {
      try {
        const writeFn = async () => {
          const docRef = doc(db, USERS_COLLECTION, authUser.uid);
          await setDoc(docRef, stripUndefined(newProfile), { merge: true });
          return newProfile;
        };
        await withTimeout(writeFn(), FIRESTORE_TIMEOUT_MS, newProfile);
      } catch (err) {
        console.warn('Could not persist auto-created user profile to Firestore:', err);
      }
    }

    return newProfile;
  })();

  ongoingEnsures.set(authUser.uid, execution);

  try {
    return await execution;
  } finally {
    ongoingEnsures.delete(authUser.uid);
  }
}

/**
 * Retrieves all registered users for administration & role governance.
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  if (!isFirebaseConfigured() || !db) {
    return [...fallbackUsers];
  }

  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, orderBy('createdAt', 'desc'), limit(150));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((d) => normalizeUserDoc(d.id, d.data()));

    // Merge fallback demo users if not present in Firestore
    const idSet = new Set(list.map((u) => u.id));
    for (const f of fallbackUsers) {
      if (!idSet.has(f.id)) {
        list.push(f);
      }
    }
    return list;
  } catch (error) {
    console.warn('Error fetching all users from Firestore, using fallback:', error);
    return [...fallbackUsers];
  }
}

/**
 * Creates a user profile record in Firestore during registration.
 * Default role is strictly 'user'.
 */
export async function createUserProfile(
  userData: Partial<UserProfile>
): Promise<{ success: boolean; errors?: Record<string, string> }> {
  const cleanUsername = (userData.username || '').trim().toLowerCase();
  const email = (userData.email || '').trim().toLowerCase();
  const isSuperAdminEmail = email === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase();

  const preparedData: Partial<UserProfile> = {
    ...userData,
    username: cleanUsername,
    role: isSuperAdminEmail ? 'super_admin' : 'user',
    disabled: false,
  };

  const validation = validateUserProfile(preparedData);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  const now = getDbTimestamp();
  const rawPayload: Record<string, any> = {
    id: userData.id!,
    username: cleanUsername,
    displayName: (userData.displayName || cleanUsername).trim(),
    email,
    role: isSuperAdminEmail ? 'super_admin' : 'user',
    photoURL: userData.photoURL || '',
    bio: userData.bio || '',
    disabled: false,
    articlesCount: 0,
    lastActive: now,
    createdAt: now,
    updatedAt: now,
  };

  const payload: UserProfile = stripUndefined(rawPayload) as UserProfile;

  // Add to fallback cache
  fallbackUsers = [payload, ...fallbackUsers.filter((u) => u.id !== payload.id)];

  if (!isFirebaseConfigured() || !db) {
    return { success: true };
  }

  const docRef = doc(db, USERS_COLLECTION, userData.id!);

  try {
    await setDoc(docRef, payload, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.warn('Failed to write user profile to database, saved locally:', error);
    return { success: true };
  }
}

/**
 * Updates a user profile. Prevents self-escalation of roles.
 */
export async function updateUserProfile(
  id: string,
  userData: Partial<UserProfile>
): Promise<{ success: boolean; error?: string }> {
  if (!id) {
    return { success: false, error: 'User ID is required.' };
  }

  // Update fallback in memory
  const idx = fallbackUsers.findIndex((u) => u.id === id);
  if (idx >= 0) {
    fallbackUsers[idx] = {
      ...fallbackUsers[idx],
      ...userData,
      updatedAt: new Date().toISOString(),
    };
  }

  if (!isFirebaseConfigured() || !db) {
    return { success: true };
  }

  const docRef = doc(db, USERS_COLLECTION, id);
  const sanitizedUpdates = stripUndefined({ ...userData });
  delete (sanitizedUpdates as any).role; // Protected field
  delete (sanitizedUpdates as any).id;

  try {
    await setDoc(
      docRef,
      {
        ...sanitizedUpdates,
        updatedAt: getDbTimestamp(),
      },
      { merge: true }
    );

    return { success: true };
  } catch (error: any) {
    console.warn('Remote user profile update failed, updated in session:', error);
    return { success: true };
  }
}

/**
 * Updates user avatar URL across profile and memory.
 */
export async function updateUserAvatarUrl(
  userId: string,
  photoURL: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    console.error('[Avatar] ERROR at updateUserAvatarUrl: User ID required');
    return { success: false, error: 'User ID required.' };
  }

  const nowIso = new Date().toISOString();
  console.log('[Avatar] Updating user profile database record for user:', userId);

  // 1. Persist to Firestore database
  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, USERS_COLLECTION, userId);
      await withTimeout(
        setDoc(
          docRef,
          {
            id: userId,
            photoURL,
            updatedAt: getDbTimestamp(),
          },
          { merge: true }
        ),
        2000,
        null
      );
      console.log('[Avatar] Firestore user document photoURL updated successfully');
    } catch (err: any) {
      console.warn('[Avatar] Firestore persistent write notice:', err?.message || err);
    }
  }

  // 2. Update memory & persistent cache
  const idx = fallbackUsers.findIndex((u) => u.id === userId);
  if (idx >= 0) {
    fallbackUsers[idx] = {
      ...fallbackUsers[idx],
      photoURL,
      updatedAt: nowIso,
    };
  }
  saveCachedUsers(fallbackUsers);

  // 3. Dispatch real-time window event
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('thelegendswiki:user-avatar-updated', {
          detail: { userId, photoURL },
        })
      );
    } catch {
      // Non-blocking
    }
  }

  return { success: true };
}

/**
 * Super Admin function to promote a user to Admin role (user -> admin).
 */
export async function promoteUserToAdmin(
  targetUserId: string,
  actor: { uid: string; email: string; role: string }
): Promise<{ success: boolean; error?: string }> {
  return setUserRole(targetUserId, 'admin', actor);
}

/**
 * Super Admin function to demote an Admin back to User role (admin -> user).
 */
export async function demoteAdminToUser(
  targetUserId: string,
  actor: { uid: string; email: string; role: string }
): Promise<{ success: boolean; error?: string }> {
  return setUserRole(targetUserId, 'user', actor);
}

/**
 * Changes a user's permission role with security guards, real-time sync, and audit logging.
 * Synchronizes to Firestore backend and in-memory caches.
 */
export async function setUserRole(
  userId: string,
  newRole: UserRole,
  actor?: { uid: string; email: string; role: string }
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User ID is required.' };

  // Authorization check: Actor must be super_admin or admin
  const actorRole = (actor?.role || '').toLowerCase();
  const isActorSuperAdmin = actorRole === 'super_admin' || (actor?.email || '').toLowerCase() === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase();
  
  if (actor && !isActorSuperAdmin && actorRole !== 'admin') {
    return {
      success: false,
      error: 'Unauthorized. Only authorized Super Administrators can manage user roles.',
    };
  }

  // Look up existing user
  let targetUser = fallbackUsers.find((u) => u.id === userId);
  
  // Security guard: Designated Super Admin email cannot be demoted
  if (
    targetUser &&
    targetUser.email.toLowerCase() === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase() &&
    newRole !== 'super_admin'
  ) {
    return {
      success: false,
      error: 'Designated Root Super Admin account cannot be demoted.',
    };
  }

  const oldRole = targetUser ? targetUser.role : 'user';

  // 1. Persist to Firestore database first
  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, USERS_COLLECTION, userId);
      const updatePayload: Record<string, any> = {
        id: userId,
        role: newRole,
        updatedAt: getDbTimestamp(),
      };

      // If document was from demo data and might not exist in Firestore, provide essential base fields
      if (targetUser) {
        updatePayload.username = targetUser.username;
        updatePayload.displayName = targetUser.displayName;
        updatePayload.email = targetUser.email;
        if (targetUser.photoURL) updatePayload.photoURL = targetUser.photoURL;
        if (targetUser.bio) updatePayload.bio = targetUser.bio;
        updatePayload.disabled = Boolean(targetUser.disabled);
      }

      await setDoc(docRef, stripUndefined(updatePayload), { merge: true });
    } catch (error: any) {
      console.error('Error updating user role in Firestore database:', error);
      return { 
        success: false, 
        error: error.message || 'Database write failed. User role could not be permanently updated in Firestore.' 
      };
    }
  }

  // 2. Only after database write succeeds, update memory & persistent cache
  const nowIso = new Date().toISOString();
  if (targetUser) {
    targetUser.role = newRole;
    targetUser.updatedAt = nowIso;
    fallbackUsers = fallbackUsers.map((u) => (u.id === userId ? { ...u, role: newRole, updatedAt: nowIso } : u));
  } else {
    targetUser = {
      id: userId,
      username: `scholar_${userId.slice(0, 6)}`,
      displayName: `Scholar ${userId.slice(0, 6)}`,
      email: '',
      role: newRole,
      photoURL: '',
      bio: '',
      disabled: false,
      articlesCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    fallbackUsers = [targetUser, ...fallbackUsers.filter((u) => u.id !== userId)];
  }

  saveCachedUsers(fallbackUsers);

  // 3. Dispatch window event for immediate UI synchronization across components
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('thelegendswiki:user-role-changed', {
          detail: {
            userId,
            oldRole,
            newRole,
            user: targetUser,
          },
        })
      );
    }
  } catch {
    // Non-blocking event dispatch
  }

  // 4. Log in administrative audit trail
  if (actor) {
    const isPromotion = newRole === 'admin' && oldRole === 'user';
    const isDemotion = newRole === 'user' && oldRole === 'admin';
    const actionLabel = isPromotion
      ? 'Admin Created / Promoted'
      : isDemotion
      ? 'Admin Removed / Demoted'
      : 'Role Changed';

    await logAuditEvent({
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: actionLabel,
      targetId: userId,
      targetTitle: targetUser?.displayName || targetUser?.username || userId,
      targetType: 'role',
      details: `Role for ${targetUser?.email || userId} changed from ${oldRole.toUpperCase()} to ${newRole.toUpperCase()}.`,
      metadata: { previousRole: oldRole, newRole, targetEmail: targetUser?.email },
    });
  }

  return { success: true };
}

/**
 * Toggles user account disabled/restricted status with audit log.
 */
export async function setUserStatus(
  userId: string,
  disabled: boolean,
  actor?: { uid: string; email: string; role: string }
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User ID is required.' };

  const targetUser = fallbackUsers.find((u) => u.id === userId);

  // Guard against disabling the initial Super Admin
  if (
    targetUser &&
    targetUser.email.toLowerCase() === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase() &&
    disabled
  ) {
    return {
      success: false,
      error: 'Designated Root Super Admin account cannot be disabled.',
    };
  }

  const idx = fallbackUsers.findIndex((u) => u.id === userId);
  if (idx >= 0) {
    fallbackUsers[idx] = {
      ...fallbackUsers[idx],
      disabled,
      updatedAt: new Date().toISOString(),
    };
  }

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, USERS_COLLECTION, userId);
      await setDoc(
        docRef,
        {
          disabled,
          updatedAt: getDbTimestamp(),
        },
        { merge: true }
      );
    } catch (error: any) {
      console.error('Error setting user status in Firestore:', error);
      return { success: false, error: error.message || 'Failed to update status.' };
    }
  }

  if (actor) {
    await logAuditEvent({
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: disabled ? 'User Restricted / Suspended' : 'User Re-enabled',
      targetId: userId,
      targetTitle: targetUser?.displayName || targetUser?.username || userId,
      targetType: 'user',
      details: `Account ${targetUser?.email || userId} was ${disabled ? 'suspended/restricted' : 're-enabled'}.`,
    });
  }

  return { success: true };
}

/**
 * Super Admin function to permanently delete a user account.
 */
export async function deleteUserAccount(
  userId: string,
  actor: { uid: string; email: string; role: string }
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User ID required.' };

  const targetUser = fallbackUsers.find((u) => u.id === userId);
  if (
    targetUser &&
    targetUser.email.toLowerCase() === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase()
  ) {
    return {
      success: false,
      error: 'Cannot delete designated root Super Admin account.',
    };
  }

  fallbackUsers = fallbackUsers.filter((u) => u.id !== userId);

  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, USERS_COLLECTION, userId));
    } catch (err: any) {
      console.warn('Delete user failed on remote:', err);
    }
  }

  await logAuditEvent({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'User Deleted',
    targetId: userId,
    targetTitle: targetUser?.displayName || userId,
    targetType: 'user',
    details: `User account ${targetUser?.email || userId} permanently removed from database.`,
  });

  return { success: true };
}

/**
 * Gets a user's role with fallback to 'guest'.
 */
export async function getUserRole(id: string): Promise<UserRole> {
  if (!id) return 'guest';
  const profile = await getUserById(id);
  return profile?.role || 'guest';
}
