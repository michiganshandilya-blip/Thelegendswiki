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
    authProvider: 'password',
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
    authProvider: 'password',
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
    authProvider: 'password',
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
    authProvider: 'password',
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
    authProvider: 'password',
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
    authProvider: 'password',
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
const USER_DELETED_TOMBSTONES_KEY = 'thelegendswiki_deleted_users_v1';

/**
 * Returns the set of all permanently deleted user IDs, emails, and usernames.
 */
export function getLocalDeletedUserIds(): Set<string> {
  const set = new Set<string>();
  if (typeof window === 'undefined' || !window.localStorage) return set;
  try {
    const raw = localStorage.getItem(USER_DELETED_TOMBSTONES_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item) set.add(String(item).trim().toLowerCase());
        }
      }
    }
  } catch {
    // Non-blocking
  }
  return set;
}

/**
 * Records deleted user identifiers in persistent tombstones.
 */
export function saveLocalDeletedUserId(...identifiers: (string | undefined | null)[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const set = getLocalDeletedUserIds();
    for (const item of identifiers) {
      if (item) {
        set.add(String(item).trim().toLowerCase());
      }
    }
    localStorage.setItem(USER_DELETED_TOMBSTONES_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Non-blocking
  }
}

/**
 * Removes user identifiers from tombstones when an account is legitimately re-registered.
 */
export function removeLocalDeletedUserId(...identifiers: (string | undefined | null)[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const set = getLocalDeletedUserIds();
    for (const item of identifiers) {
      if (item) {
        set.delete(String(item).trim().toLowerCase());
      }
    }
    localStorage.setItem(USER_DELETED_TOMBSTONES_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Non-blocking
  }
}

/**
 * Checks if a user identifier (UID, email, or handle) has been marked as deleted.
 */
export function isUserDeleted(idOrUser?: string | { id?: string; email?: string; username?: string } | null): boolean {
  if (!idOrUser) return false;
  const set = getLocalDeletedUserIds();
  if (set.size === 0) return false;
  if (typeof idOrUser === 'string') {
    return set.has(idOrUser.trim().toLowerCase());
  }
  if (idOrUser.id && set.has(idOrUser.id.trim().toLowerCase())) return true;
  if (idOrUser.email && set.has(idOrUser.email.trim().toLowerCase())) return true;
  if (idOrUser.username && set.has(idOrUser.username.trim().toLowerCase())) return true;
  return false;
}

function loadCachedUsers(): UserProfile[] {
  const deletedSet = getLocalDeletedUserIds();
  const filteredDefaults = defaultInitialUsers.filter(
    (d) =>
      !deletedSet.has(d.id.toLowerCase()) &&
      (!d.email || !deletedSet.has(d.email.toLowerCase())) &&
      (!d.username || !deletedSet.has(d.username.toLowerCase()))
  );

  if (typeof window === 'undefined') return [...filteredDefaults];
  try {
    const raw = localStorage.getItem(USER_CACHE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validParsed = parsed.filter(
          (u: UserProfile) =>
            u &&
            u.id &&
            !deletedSet.has(u.id.toLowerCase()) &&
            (!u.email || !deletedSet.has(u.email.toLowerCase())) &&
            (!u.username || !deletedSet.has(u.username.toLowerCase()))
        );
        const parsedMap = new Map<string, UserProfile>(validParsed.map((u: UserProfile) => [u.id, u]));
        for (const d of filteredDefaults) {
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
  return [...filteredDefaults];
}

function saveCachedUsers(users: UserProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    const deletedSet = getLocalDeletedUserIds();
    const cleanUsers = users.filter(
      (u) =>
        u &&
        u.id &&
        !deletedSet.has(u.id.toLowerCase()) &&
        (!u.email || !deletedSet.has(u.email.toLowerCase())) &&
        (!u.username || !deletedSet.has(u.username.toLowerCase()))
    );
    localStorage.setItem(USER_CACHE_STORAGE_KEY, JSON.stringify(cleanUsers));
  } catch {
    // Non-blocking
  }
}

// Persistent and in-memory registry of users
let fallbackUsers: UserProfile[] = loadCachedUsers();

// Helper to safely convert Firestore timestamps, Dates, or strings to ISO format
function toIsoDate(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString();
  if (typeof val.toDate === 'function') {
    try {
      return val.toDate().toISOString();
    } catch {
      // ignore
    }
  }
  if (typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000).toISOString();
  }
  if (typeof val === 'number') {
    return new Date(val).toISOString();
  }
  return new Date().toISOString();
}

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

  const bio = data.bio || data.scholarlyBiography || '';

  return {
    id: id || data.id,
    username: normalizeHandle(rawUsername) || 'scholar',
    displayName: data.displayName || data.username || (data.phoneNumber ? `Researcher (${data.phoneNumber.slice(-4)})` : 'Scholar'),
    email,
    phoneNumber: data.phoneNumber || '',
    role,
    photoURL: data.photoURL || '',
    bio,
    scholarlyBiography: data.scholarlyBiography || bio,
    disabled: Boolean(data.disabled),
    articlesCount: typeof data.articlesCount === 'number' ? data.articlesCount : 0,
    lastActive: toIsoDate(data.lastActive || data.updatedAt),
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
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
  // 1. Always emit authoritative cached records immediately (cache-first hydration)
  // This guarantees the UI has user records instantly without layout shift
  if (fallbackUsers && fallbackUsers.length > 0) {
    try {
      callback([...fallbackUsers]);
    } catch (e) {
      console.warn('[userService] Initial fallback emit error:', e);
    }
  }

  if (!isFirebaseConfigured() || !db) {
    return () => {};
  }

  try {
    const usersRef = collection(db, USERS_COLLECTION);
    // Fetch users up to 250 without rigid orderBy to avoid dropping records with mixed timestamp formats
    const q = query(usersRef, limit(250));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const deletedSet = getLocalDeletedUserIds();
        const firestoreList = snapshot.docs
          .map((d) => normalizeUserDoc(d.id, d.data()))
          .filter((u) => !deletedSet.has(u.id.toLowerCase()) && (!u.email || !deletedSet.has(u.email.toLowerCase())));
        console.log(`[userService] Real-time users query returned ${firestoreList.length} records from Firestore`);

        // Sort descending by registration date or recent activity
        firestoreList.sort((a, b) => {
          const timeA = new Date(a.createdAt || a.lastActive || 0).getTime();
          const timeB = new Date(b.createdAt || b.lastActive || 0).getTime();
          return timeB - timeA;
        });

        // Ensure critical bootstrap accounts from fallback remain available if not in Firestore and not deleted
        const firestoreIds = new Set(firestoreList.map((u) => u.id));
        const firestoreEmails = new Set(firestoreList.filter((u) => u.email).map((u) => u.email!.toLowerCase()));
        const missingFallbacks = fallbackUsers.filter(
          (u) =>
            !deletedSet.has(u.id.toLowerCase()) &&
            (!u.email || !deletedSet.has(u.email.toLowerCase())) &&
            !firestoreIds.has(u.id) &&
            (!u.email || !firestoreEmails.has(u.email.toLowerCase()))
        );
        const mergedList = [...firestoreList, ...missingFallbacks];

        // Update local memory and persistent cache with real Firestore records
        fallbackUsers = [...mergedList];
        saveCachedUsers(fallbackUsers);
        callback(mergedList);
      },
      (error) => {
        console.warn('[userService] Real-time users subscription notice from Firestore:', error?.message || error);
        // Ensure UI maintains cached user registry even if Firestore encounters temporary network or permission glitch
        if (fallbackUsers && fallbackUsers.length > 0) {
          try {
            callback([...fallbackUsers]);
          } catch {
            // Non-blocking
          }
        }
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.warn('[userService] Could not establish onSnapshot for users:', err?.message || err);
    if (fallbackUsers && fallbackUsers.length > 0) {
      try {
        callback([...fallbackUsers]);
      } catch {
        // Non-blocking
      }
    }
    if (onError) onError(err);
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
  if (!id || isUserDeleted(id)) return null;

  // 1. Check in-memory cache first
  const memoryUser = fallbackUsers.find((u) => u.id === id);
  if (memoryUser && isUserDeleted(memoryUser)) return null;

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
      if (isUserDeleted(parsed)) return null;
      // Update memory cache
      fallbackUsers = [parsed, ...fallbackUsers.filter((u) => u.id !== parsed.id)];
      saveCachedUsers(fallbackUsers);
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
  if (!clean || isUserDeleted(clean)) return null;

  const memoryMatch = fallbackUsers.find((u) => normalizeHandle(u.username) === clean || u.id === clean);
  if (memoryMatch && isUserDeleted(memoryMatch)) return null;

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
        if (isUserDeleted(parsed)) return null;
        fallbackUsers = [parsed, ...fallbackUsers.filter((u) => u.id !== parsed.id)];
        saveCachedUsers(fallbackUsers);
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
 * Authoritative Firestore backend is queried first to guarantee fresh, persisted profile data.
 */
export async function getUserByIdOrHandle(identifier: string): Promise<UserProfile | null> {
  if (!identifier || isUserDeleted(identifier)) return null;
  const clean = normalizeHandle(identifier);

  // 1. Try direct ID lookup from Firestore backend
  const byId = await getUserById(identifier);
  if (byId) return byId;

  // 2. Try by username from Firestore backend
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
            if (isUserDeleted(parsed)) return null;
            fallbackUsers = [parsed, ...fallbackUsers.filter((u) => u.id !== parsed.id)];
            saveCachedUsers(fallbackUsers);
            return parsed;
          }
          return null;
        };

        const byEmail = await withTimeout(emailFn(), FIRESTORE_TIMEOUT_MS, null);
        if (byEmail) return byEmail;
      }
    } catch (err) {
      console.warn('Error querying user by email:', err);
    }
  }

  // 4. Fallback to memory cache only if Firestore returned no document or is offline
  const memoryMatch = fallbackUsers.find(
    (u) =>
      !isUserDeleted(u) &&
      (u.id === identifier || normalizeHandle(u.username) === clean || (identifier.includes('@') && u.email === identifier.toLowerCase()))
  );
  if (memoryMatch) return memoryMatch;

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
    metadata?: {
      creationTime?: string;
      lastSignInTime?: string;
    };
  },
  preferredHandle?: string,
  preferredDisplayName?: string,
  preferredRole?: UserRole
): Promise<UserProfile> {
  if (!authUser || !authUser.uid) {
    throw new Error('Valid authenticated user is required to ensure profile.');
  }

  const existingPromise = ongoingEnsures.get(authUser.uid);
  if (existingPromise) {
    return existingPromise;
  }

  const execution = (async (): Promise<UserProfile> => {
    const email = (authUser.email || '').trim().toLowerCase();
    const phoneNumber = (authUser.phoneNumber || '').trim();
    const isSuperAdminEmail = email === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase();

    // Check if doc exists in Firestore first
    let existing: UserProfile | null = null;
    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, USERS_COLLECTION, authUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          existing = normalizeUserDoc(docSnap.id, docSnap.data());
        }
      } catch (err) {
        console.warn(`[userService] Could not fetch remote user profile for ${authUser.uid}:`, err);
      }
    }

    if (!existing) {
      existing = fallbackUsers.find((u) => u.id === authUser.uid) || null;
    }

    if (existing) {
      // If email is root super admin email, enforce super_admin role and clean up any placeholder records
      if (isSuperAdminEmail) {
        fallbackUsers = fallbackUsers.filter(
          (u) => u.id === authUser.uid || (u.email && u.email.toLowerCase() !== DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase())
        );
        if (existing.role !== 'super_admin') {
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
              console.warn('[userService] Could not sync super_admin role to Firestore:', e);
            }
          }
          saveCachedUsers(fallbackUsers);
          return corrected;
        }
      }

      // Refresh lastActive if older than 5 minutes
      const nowIso = new Date().toISOString();
      const lastActiveMs = new Date(existing.lastActive || 0).getTime();
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (!existing.lastActive || isNaN(lastActiveMs) || lastActiveMs < fiveMinutesAgo) {
        existing = { ...existing, lastActive: nowIso };
        if (isFirebaseConfigured() && db) {
          try {
            await setDoc(
              doc(db, USERS_COLLECTION, authUser.uid),
              { lastActive: getDbTimestamp(), updatedAt: getDbTimestamp() },
              { merge: true }
            );
          } catch (e) {
            // Non-blocking
          }
        }
      }

      // Update in-memory fallback cache with the authoritative Firestore profile
      fallbackUsers = [
        existing,
        ...fallbackUsers.filter((u) => u.id !== existing!.id && normalizeHandle(u.username) !== normalizeHandle(existing!.username)),
      ];
      saveCachedUsers(fallbackUsers);

      return existing;
    }

    // Derive a clean, valid handle
    let chosenHandle = normalizeHandle(preferredHandle);
    if (!chosenHandle) {
      if (preferredDisplayName) {
        chosenHandle = normalizeHandle(preferredDisplayName.replace(/\s+/g, '_'));
      } else if (authUser.displayName) {
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

    const nowIso = new Date().toISOString();
    const creationTimeIso = authUser.metadata?.creationTime
      ? new Date(authUser.metadata.creationTime).toISOString()
      : nowIso;
    const lastActiveIso = authUser.metadata?.lastSignInTime
      ? new Date(authUser.metadata.lastSignInTime).toISOString()
      : nowIso;

    const displayName = (
      preferredDisplayName ||
      authUser.displayName ||
      (phoneNumber ? `Scholar (${phoneNumber.slice(-4)})` : chosenHandle) ||
      'Scholar'
    ).trim();

    const assignedRole: UserRole = isSuperAdminEmail
      ? 'super_admin'
      : (preferredRole && (preferredRole === 'admin' || preferredRole === 'super_admin') ? preferredRole : 'user');

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
      lastActive: lastActiveIso,
      createdAt: creationTimeIso,
      updatedAt: nowIso,
    };

    removeLocalDeletedUserId(authUser.uid, authUser.email, chosenHandle);
    fallbackUsers = [newProfile, ...fallbackUsers.filter((u) => u.id !== newProfile.id)];
    saveCachedUsers(fallbackUsers);

    if (isFirebaseConfigured() && db) {
      const docRef = doc(db, USERS_COLLECTION, authUser.uid);
      const firestoreData = {
        ...stripUndefined(newProfile),
        createdAt: creationTimeIso,
        updatedAt: getDbTimestamp(),
        lastActive: getDbTimestamp(),
      };

      try {
        await setDoc(docRef, firestoreData, { merge: true });
        console.log(`[userService] User profile successfully created and persisted in Firestore: users/${authUser.uid}`);
      } catch (err: any) {
        console.warn(`[userService] Notice: Initial Firestore document sync for users/${authUser.uid} encountered issue, profile is cached locally:`, err);
        // Non-blocking background retry to persist to Firestore
        setTimeout(async () => {
          try {
            const retryDocRef = doc(db, USERS_COLLECTION, authUser.uid);
            await setDoc(retryDocRef, firestoreData, { merge: true });
            console.log(`[userService] Retry sync succeeded for users/${authUser.uid}`);
          } catch (retryErr) {
            console.warn(`[userService] Background sync retry for users/${authUser.uid}:`, retryErr);
          }
        }, 1500);
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
  const deletedSet = getLocalDeletedUserIds();
  if (!isFirebaseConfigured() || !db) {
    return fallbackUsers.filter(
      (u) =>
        !deletedSet.has(u.id.toLowerCase()) &&
        (!u.email || !deletedSet.has(u.email.toLowerCase())) &&
        (!u.username || !deletedSet.has(u.username.toLowerCase()))
    );
  }

  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, limit(250));
    const snapshot = await getDocs(q);
    const list = snapshot.docs
      .map((d) => normalizeUserDoc(d.id, d.data()))
      .filter(
        (u) =>
          !deletedSet.has(u.id.toLowerCase()) &&
          (!u.email || !deletedSet.has(u.email.toLowerCase())) &&
          (!u.username || !deletedSet.has(u.username.toLowerCase()))
      );

    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.lastActive || 0).getTime();
      const timeB = new Date(b.createdAt || b.lastActive || 0).getTime();
      return timeB - timeA;
    });

    return list;
  } catch (error) {
    console.warn('[userService] Notice fetching all users from Firestore, using authoritative cached registry:', error);
    return fallbackUsers.filter(
      (u) =>
        !deletedSet.has(u.id.toLowerCase()) &&
        (!u.email || !deletedSet.has(u.email.toLowerCase())) &&
        (!u.username || !deletedSet.has(u.username.toLowerCase()))
    );
  }
}

/**
 * Creates a user profile record in Firestore during registration.
 * Default role is strictly 'user'.
 */
export async function createUserProfile(
  userData: Partial<UserProfile>
): Promise<{ success: boolean; errors?: Record<string, string>; error?: string }> {
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

  try {
    await ensureUserProfile(
      {
        uid: userData.id!,
        email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        phoneNumber: userData.phoneNumber,
      },
      cleanUsername,
      userData.displayName,
      isSuperAdminEmail ? 'super_admin' : 'user'
    );
    return { success: true };
  } catch (err: any) {
    console.error(`[userService] createUserProfile failed for users/${userData.id}:`, err);
    return { success: false, error: err?.message || 'Database write error' };
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

  // Synchronize bio and scholarlyBiography so both fields are stored and retrieved consistently
  const updatesToApply = { ...userData };
  if (updatesToApply.bio !== undefined && updatesToApply.scholarlyBiography === undefined) {
    updatesToApply.scholarlyBiography = updatesToApply.bio;
  } else if (updatesToApply.scholarlyBiography !== undefined && updatesToApply.bio === undefined) {
    updatesToApply.bio = updatesToApply.scholarlyBiography;
  }

  // Update fallback in memory and persistent cache
  const idx = fallbackUsers.findIndex((u) => u.id === id);
  if (idx >= 0) {
    fallbackUsers[idx] = {
      ...fallbackUsers[idx],
      ...updatesToApply,
      updatedAt: new Date().toISOString(),
    };
    saveCachedUsers(fallbackUsers);
  }

  if (!isFirebaseConfigured() || !db) {
    return { success: true };
  }

  const docRef = doc(db, USERS_COLLECTION, id);
  const sanitizedUpdates = stripUndefined({ ...updatesToApply });
  delete (sanitizedUpdates as any).role; // Protected field
  delete (sanitizedUpdates as any).id;
  delete (sanitizedUpdates as any).createdAt; // Never overwrite registration creation date

  try {
    await setDoc(
      docRef,
      {
        ...sanitizedUpdates,
        updatedAt: getDbTimestamp(),
      },
      { merge: true }
    );

    // Keep memory fallback in sync with newly persisted fields
    const memoryItem = fallbackUsers.find((u) => u.id === id);
    if (memoryItem) {
      Object.assign(memoryItem, sanitizedUpdates, { updatedAt: new Date().toISOString() });
      saveCachedUsers(fallbackUsers);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Remote user profile update failed in Firestore:', error);
    return { success: false, error: error?.message || 'Remote user profile update failed' };
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
  newRole: UserRole | string,
  actor?: { uid: string; email: string; role: string }
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User ID is required.' };

  // Normalize role strictly to standard UserRole ('user' | 'admin' | 'super_admin')
  const cleanRoleStr = (newRole || '').toString().trim().toLowerCase();
  const targetRole: UserRole =
    cleanRoleStr === 'admin' || cleanRoleStr === 'administrator' || cleanRoleStr === 'editor'
      ? 'admin'
      : cleanRoleStr === 'super_admin'
      ? 'super_admin'
      : 'user';

  // Authorization check: Actor must have administrative privileges
  const actorRole = (actor?.role || '').toLowerCase();
  const isActorSuperAdmin = actorRole === 'super_admin' || (actor?.email || '').toLowerCase() === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase();
  const isActorAdmin = isActorSuperAdmin || actorRole === 'admin' || actorRole === 'administrator' || actorRole === 'editor';
  
  if (actor) {
    if (!isActorAdmin) {
      return {
        success: false,
        error: 'Unauthorized. Administrative credentials are required to manage scholar roles.',
      };
    }
    // Only super administrators can elevate users to super_admin or modify existing super_admin accounts
    if (targetRole === 'super_admin' && !isActorSuperAdmin) {
      return {
        success: false,
        error: 'Unauthorized. Only Super Administrators can assign the Super Administrator role.',
      };
    }
  }

  // Look up existing user in memory or fetch from Firestore if not yet loaded
  let targetUser = fallbackUsers.find(
    (u) => u.id === userId || u.username === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase())
  );
  if (!targetUser) {
    targetUser = (await getUserById(userId)) || (await getUserByUsername(userId)) || undefined;
  }

  // Self protection: Super Admin cannot demote their own account
  const targetEmailLower = (targetUser?.email || '').trim().toLowerCase();
  const actorEmailLower = (actor?.email || '').trim().toLowerCase();
  if (
    actor &&
    (actor.uid === userId || (actorEmailLower && targetEmailLower && actorEmailLower === targetEmailLower)) &&
    (isActorSuperAdmin || actorRole === 'super_admin') &&
    targetRole !== 'super_admin'
  ) {
    return {
      success: false,
      error: 'Super Administrators cannot demote their own account.',
    };
  }

  // Security guard: Designated Super Admin email / Super Admin accounts cannot be demoted
  if (
    (targetEmailLower === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase() || targetUser?.role === 'super_admin') &&
    targetRole !== 'super_admin'
  ) {
    return {
      success: false,
      error: 'Super Administrator accounts are protected and cannot be demoted.',
    };
  }

  const oldRole = targetUser ? targetUser.role : 'user';
  const resolvedTargetId = targetUser?.id || userId;

  // 1. Update memory & persistent cache immediately (optimistic UI sync)
  const nowIso = new Date().toISOString();
  if (targetUser) {
    targetUser.role = targetRole;
    targetUser.updatedAt = nowIso;
    fallbackUsers = fallbackUsers.map((u) =>
      u.id === resolvedTargetId || (targetUser && u.email && u.email.toLowerCase() === targetUser.email.toLowerCase())
        ? { ...u, role: targetRole, updatedAt: nowIso }
        : u
    );
  } else {
    targetUser = {
      id: resolvedTargetId,
      username: `scholar_${resolvedTargetId.slice(0, 6)}`,
      displayName: `Scholar ${resolvedTargetId.slice(0, 6)}`,
      email: '',
      role: targetRole,
      photoURL: '',
      bio: '',
      disabled: false,
      articlesCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    fallbackUsers = [targetUser, ...fallbackUsers.filter((u) => u.id !== resolvedTargetId)];
  }

  saveCachedUsers(fallbackUsers);

  // 2. Dispatch window event for immediate UI synchronization across components
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('thelegendswiki:user-role-changed', {
          detail: {
            userId: resolvedTargetId,
            oldRole,
            newRole: targetRole,
            user: targetUser,
          },
        })
      );
    }
  } catch {
    // Non-blocking event dispatch
  }

  // 3. Persist to Firestore database with timeout resilience
  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, USERS_COLLECTION, resolvedTargetId);
      const updatePayload: Record<string, any> = {
        id: resolvedTargetId,
        role: targetRole,
        updatedAt: getDbTimestamp(),
      };

      // If document was from demo data and might not exist in Firestore, provide essential base fields
      if (targetUser) {
        if (targetUser.username) updatePayload.username = targetUser.username;
        if (targetUser.displayName) updatePayload.displayName = targetUser.displayName;
        if (targetUser.email) updatePayload.email = targetUser.email;
        if (targetUser.photoURL) updatePayload.photoURL = targetUser.photoURL;
        if (targetUser.bio) updatePayload.bio = targetUser.bio;
        updatePayload.disabled = Boolean(targetUser.disabled);
      }

      await withTimeout(
        setDoc(docRef, stripUndefined(updatePayload), { merge: true }),
        FIRESTORE_TIMEOUT_MS,
        undefined
      );
      console.log(`[userService] User ${resolvedTargetId} role successfully synced to Firestore as ${targetRole}.`);
    } catch (error: any) {
      console.warn('[userService] Firestore database write notice during user role update. Role was updated in local cache and active session:', error);
      // Non-fatal fallback: the role is reliably updated in memory, local storage, and via events
    }
  }

  // 4. Log in administrative audit trail
  if (actor) {
    const isPromotion = targetRole === 'admin' && oldRole === 'user';
    const isDemotion = targetRole === 'user' && (oldRole === 'admin' || oldRole === 'editor' || oldRole === 'administrator');
    const actionLabel = isPromotion
      ? 'Admin Created / Promoted'
      : isDemotion
      ? 'Admin Removed / Demoted'
      : 'Role Changed';

    try {
      await logAuditEvent({
        actorUid: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: actionLabel,
        targetId: resolvedTargetId,
        targetTitle: targetUser?.displayName || targetUser?.username || resolvedTargetId,
        targetType: 'role',
        details: `Role for ${targetUser?.email || resolvedTargetId} changed from ${oldRole.toUpperCase()} to ${targetRole.toUpperCase()}.`,
        metadata: { previousRole: oldRole, newRole: targetRole, targetEmail: targetUser?.email },
      });
    } catch (auditErr) {
      console.warn('Audit trail log warning during role update:', auditErr);
    }
  }

  return { success: true };
}

/**
 * Backward compatibility alias for setUserRole.
 */
export const updateUserRole = setUserRole;

/**
 * Toggles user account disabled/restricted status with audit log.
 */
export async function setUserStatus(
  userId: string,
  disabled: boolean,
  actor?: { uid: string; email: string; role: string }
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User ID is required.' };

  let targetUser = fallbackUsers.find((u) => u.id === userId);
  if (!targetUser) {
    targetUser = (await getUserById(userId)) || undefined;
  }

  // Guard against disabling Super Admin accounts or self
  const targetEmailLower = (targetUser?.email || '').trim().toLowerCase();
  if (
    (targetEmailLower === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase() || targetUser?.role === 'super_admin' || userId === actor?.uid) &&
    disabled
  ) {
    return {
      success: false,
      error: 'Super Administrator accounts are protected and cannot be disabled.',
    };
  }

  const idx = fallbackUsers.findIndex((u) => u.id === userId);
  if (idx >= 0) {
    fallbackUsers[idx] = {
      ...fallbackUsers[idx],
      disabled,
      updatedAt: new Date().toISOString(),
    };
    saveCachedUsers(fallbackUsers);
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
      console.warn('[userService] Firestore database write notice during user status update. Account status updated in local cache:', error);
    }
  }

  if (actor) {
    try {
      await logAuditEvent({
        actorUid: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: disabled ? 'User Restricted / Suspended' : 'User Re-enabled',
        targetId: userId,
        targetTitle: targetUser?.displayName || targetUser?.username || userId,
        targetType: 'user',
        details: `User account ${targetUser?.email || userId} was ${disabled ? 'restricted' : 're-activated'}.`,
        metadata: { disabled, targetEmail: targetUser?.email },
      });
    } catch (auditErr) {
      console.warn('Audit trail log warning during status toggle:', auditErr);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('thelegendswiki:user-status-changed', {
          detail: { userId, disabled },
        })
      );
    } catch {
      // Non-blocking
    }
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

  let targetUser = fallbackUsers.find((u) => u.id === userId);
  if (!targetUser) {
    targetUser = (await getUserById(userId)) || undefined;
  }

  const targetEmailLower = (targetUser?.email || '').trim().toLowerCase();
  if (
    targetEmailLower === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase() ||
    targetUser?.role === 'super_admin' ||
    userId === actor?.uid
  ) {
    return {
      success: false,
      error: 'Super Administrator accounts are protected and cannot be deleted.',
    };
  }

  // 1. Persist deletion tombstones to prevent resurrection from default seeds or stale caches
  saveLocalDeletedUserId(userId, targetUser?.email, targetUser?.username);

  // 2. Remove from fallback memory and persistent local cache
  fallbackUsers = fallbackUsers.filter(
    (u) => u.id !== userId && (!targetEmailLower || u.email?.toLowerCase() !== targetEmailLower)
  );
  saveCachedUsers(fallbackUsers);

  // 3. Delete remote document in Firestore
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, USERS_COLLECTION, userId));
    } catch (err: any) {
      console.warn('Delete user failed on remote:', err);
    }
  }

  // 4. Dispatch immediate in-app synchronization event
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('thelegendswiki:user-deleted', {
          detail: { userId, user: targetUser },
        })
      );
    } catch {
      // Non-blocking
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
