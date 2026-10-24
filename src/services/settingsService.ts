import {
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, isFirebaseConfigured, getAuthBearerToken } from '../lib/firebase';
import { SystemSettings, UserRole } from '../types';
import { logAuditEvent } from './auditService';
import { withTimeout, withTimeoutOrReject } from '../lib/asyncUtils';
import { stripUndefined } from '../lib/sanitize';

export const SETTINGS_COLLECTION = 'system_settings';
export const DEFAULT_SETTINGS_DOC = 'global_config';
const FIRESTORE_TIMEOUT_MS = 6000;

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  id: DEFAULT_SETTINGS_DOC,
  siteName: 'TheLegendsWiki',
  requirePeerReview: true,
  allowPublicSubmissions: true,
  announcementBanner: 'Welcome to TheLegendsWiki Behind The Curtains — verified declassified files & primary source investigations.',
  announcementActive: true,
  autoFlagSpam: true,
  maintenanceMode: false,
  minCitationsRequired: 1,
  allowedRegions: ['Global', 'North America', 'Europe', 'Asia', 'Latin America', 'Middle East', 'Africa', 'Oceania'],
  featuredSeries: {
    id: 'series-who-taught-us-to-want-this',
    title: 'Who Taught Us to Want This?',
    slug: 'who-taught-us-to-want-this',
    subtitle: 'Behind manufactured desires, advertising psychology & algorithmic conditioning',
    tagline: 'Featured Investigation Series',
    description: 'An authoritative forensic deep-dive into the engineers, psychologists, and boardroom strategists who constructed modern consumer desire, engineered social status, and shaped what society craves behind closed doors.',
    bannerImageUrl: '',
    bannerImageAlt: 'Featured Series: Who Taught Us to Want This?',
    active: true,
    targetPath: '/series/who-taught-us-to-want-this',
    articleSlugs: ['harshad-mehta-1992', 'enron-arthur-andersen', 'bavarian-illuminati'],
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'michiganshandilya@gmail.com',
};

let cachedSettings: SystemSettings = { ...DEFAULT_SYSTEM_SETTINGS };

/**
 * Returns the currently cached system settings synchronously.
 */
function resolveApiUrl(urlPath: string): string {
  if (typeof window !== 'undefined') return urlPath;
  const port = process.env.PORT || 3000;
  return `http://127.0.0.1:${port}${urlPath}`;
}

export function getCachedSystemSettings(): SystemSettings {
  return cachedSettings;
}

/**
 * Retrieves the global system settings from the authoritative Firestore backend or server API.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, DEFAULT_SETTINGS_DOC);
      const snapshot = await withTimeout(
        getDocFromServer(docRef),
        FIRESTORE_TIMEOUT_MS,
        null
      );

      if (snapshot && snapshot.exists()) {
        const data = snapshot.data() as Partial<SystemSettings>;
        cachedSettings = {
          ...DEFAULT_SYSTEM_SETTINGS,
          ...data,
          id: DEFAULT_SETTINGS_DOC,
        };
        return cachedSettings;
      }
    } catch (err) {
      console.warn('[settingsService] Failed to load remote system settings from client Firestore, trying server API:', err);
    }
  }

  // Fallback to server API endpoint
  try {
    const res = await fetch(resolveApiUrl('/api/system-settings'));
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.settings) {
        cachedSettings = {
          ...DEFAULT_SYSTEM_SETTINGS,
          ...data.settings,
          id: DEFAULT_SETTINGS_DOC,
        };
      }
    }
  } catch (apiErr) {
    console.warn('[settingsService] Server API get failed, using local cached values:', apiErr);
  }

  return cachedSettings;
}

/**
 * Subscribes to real-time updates for global system configuration from Firestore.
 */
export function subscribeToSystemSettings(
  onUpdate: (settings: SystemSettings) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured() || !db) {
    onUpdate(cachedSettings);
    return () => {};
  }

  const docRef = doc(db, SETTINGS_COLLECTION, DEFAULT_SETTINGS_DOC);
  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<SystemSettings>;
        cachedSettings = {
          ...DEFAULT_SYSTEM_SETTINGS,
          ...data,
          id: DEFAULT_SETTINGS_DOC,
        };
        onUpdate(cachedSettings);
      } else {
        // Document does not exist in backend yet; fetch from server API
        getSystemSettings().then(onUpdate).catch(() => onUpdate(cachedSettings));
      }
    },
    (err) => {
      console.warn('[settingsService] Real-time system settings subscription error:', err);
      // Attempt recovery via server API
      fetch(resolveApiUrl('/api/system-settings'))
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.settings) {
            cachedSettings = {
              ...DEFAULT_SYSTEM_SETTINGS,
              ...data.settings,
              id: DEFAULT_SETTINGS_DOC,
            };
            onUpdate(cachedSettings);
          }
        })
        .catch(() => {});

      onError?.(err);
    }
  );

  return unsubscribe;
}

/**
 * Updates the global system settings in the backend (Super Admin only).
 * Performs an authoritative write (via direct Firestore or server API proxy),
 * awaits confirmation, verifies persistence, and does not silently swallow errors.
 */
export async function updateSystemSettings(
  newSettings: Partial<SystemSettings>,
  actor: { uid: string; email: string; role: UserRole | string }
): Promise<SystemSettings> {
  const payloadToSave: SystemSettings = {
    ...DEFAULT_SYSTEM_SETTINGS,
    ...cachedSettings,
    ...newSettings,
    id: DEFAULT_SETTINGS_DOC,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.email || 'michiganshandilya@gmail.com',
  };

  let clientSaved = false;
  let clientError: any = null;

  // 1. First attempt direct Firestore write if client is configured
  if (isFirebaseConfigured() && db) {
    try {
      // Ensure Firebase Auth session is ready and has active currentUser
      if (auth && typeof auth.authStateReady === 'function') {
        await auth.authStateReady();
      }

      let activeUser = auth?.currentUser;
      if (!activeUser && auth) {
        // Wait up to 2500ms for onAuthStateChanged if session restoration is in progress
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 2500);
          const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
              activeUser = user;
              clearTimeout(timeout);
              unsub();
              resolve();
            }
          });
        });
      }

      if (!activeUser) {
        throw new Error('Authentication required: A valid administrative session is required to save system settings.');
      }

      const docRef = doc(db, SETTINGS_COLLECTION, DEFAULT_SETTINGS_DOC);
      await setDoc(docRef, stripUndefined(payloadToSave), { merge: true });

      // Verify remote persistence directly from the Firestore server, not uncommitted local cache
      const verifySnapshot = await getDocFromServer(docRef);
      if (verifySnapshot.exists()) {
        const verified = {
          ...DEFAULT_SYSTEM_SETTINGS,
          ...(verifySnapshot.data() as Partial<SystemSettings>),
          id: DEFAULT_SETTINGS_DOC,
        };
        cachedSettings = verified;
        clientSaved = true;

        // Sync with server API in background
        getAuthBearerToken(true).then((token) => {
          if (!token) return;
          fetch(resolveApiUrl('/api/system-settings'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ...payloadToSave, actor, clientSynced: true }),
          }).catch(() => {});
        });
      } else {
        throw new Error('Remote Firestore verification failed: Document does not exist on server after write.');
      }
    } catch (err: any) {
      clientError = err;
      console.warn('[settingsService] Direct client Firestore write failed, escalating to authoritative server endpoint:', err?.message || err);
    }
  }

  // 2. If direct client write did not succeed or threw permission/network error, use server API
  if (!clientSaved) {
    try {
      if (auth && typeof auth.authStateReady === 'function') {
        await auth.authStateReady();
      }
      const token = await getAuthBearerToken(true);
      if (!token) {
        throw new Error(
          clientError?.message ||
            'Authentication required: A valid Firebase Auth session is required to save system settings.'
        );
      }
      const res = await fetch(resolveApiUrl('/api/system-settings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...payloadToSave, actor }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(
          errorJson?.error || `Failed to persist system settings to backend: Server responded with status ${res.status}`
        );
      }

      const resData = await res.json();
      if (!resData.success || !resData.settings) {
        throw new Error(resData?.error || 'Failed to verify system settings in backend.');
      }

      cachedSettings = {
        ...DEFAULT_SYSTEM_SETTINGS,
        ...resData.settings,
        id: DEFAULT_SETTINGS_DOC,
      };
      clientSaved = true;
    } catch (serverErr: any) {
      console.error('[settingsService] Both direct Firestore and server API failed to persist settings:', serverErr);
      throw serverErr || clientError;
    }
  }

  // 3. Record in audit log (non-blocking)
  logAuditEvent({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'System Setting Changed',
    targetId: DEFAULT_SETTINGS_DOC,
    targetTitle: 'Global Governance Policies',
    targetType: 'setting',
    details: `Updated platform settings: PeerReview=${cachedSettings.requirePeerReview}, PublicSubmissions=${cachedSettings.allowPublicSubmissions}, MaintenanceMode=${cachedSettings.maintenanceMode}, AutoFlagSpam=${cachedSettings.autoFlagSpam}, AnnouncementActive=${cachedSettings.announcementActive}.`,
    metadata: { settings: cachedSettings },
  }).catch((err) => {
    console.warn('[settingsService] Audit log sync warning:', err);
  });

  return cachedSettings;
}

