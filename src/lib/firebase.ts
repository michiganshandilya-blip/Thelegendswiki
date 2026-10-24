import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import rawConfig from '../../firebase-applet-config.json';

// Helper interface for Firebase Configuration
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

// 1. Resolve configuration prioritizing provisioned applet config (firebase-applet-config.json)
const env = (import.meta as any).env || {};

const rawEnvDbId = (env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '').trim();
const isAnalyticsIdInDbField = /^G-[A-Z0-9]+$/i.test(rawEnvDbId);

// Authoritative production configuration: prioritize environment variables, fallback to rawConfig
const resolvedProjectId = (env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId || 'thelegendswiki').trim();
const resolvedApiKey = (env.VITE_FIREBASE_API_KEY || rawConfig.apiKey || '').trim();
const resolvedAuthDomain = (env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain || `${resolvedProjectId}.firebaseapp.com`).trim();
const resolvedStorageBucket = (env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket || `${resolvedProjectId}.firebasestorage.app`).trim();
const resolvedSenderId = (env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId || '').trim();
const resolvedAppId = (env.VITE_FIREBASE_APP_ID || rawConfig.appId || '').trim();

// Custom database ID: prioritize valid provisioned database ID, defaulting cleanly to '(default)'
let resolvedDbId: string = '(default)';
if (
  resolvedProjectId !== 'thelegendswiki' &&
  rawConfig.firestoreDatabaseId &&
  rawConfig.firestoreDatabaseId !== '(default)' &&
  !/^G-[A-Z0-9]+$/i.test(rawConfig.firestoreDatabaseId)
) {
  resolvedDbId = rawConfig.firestoreDatabaseId;
} else if (rawEnvDbId && rawEnvDbId !== '(default)' && !isAnalyticsIdInDbField && /^[a-z0-9-]+$/.test(rawEnvDbId)) {
  resolvedDbId = rawEnvDbId;
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: resolvedApiKey,
  authDomain: resolvedAuthDomain,
  projectId: resolvedProjectId,
  storageBucket: resolvedStorageBucket,
  messagingSenderId: resolvedSenderId,
  appId: resolvedAppId,
  measurementId: (isAnalyticsIdInDbField ? rawEnvDbId : '') || env.VITE_FIREBASE_MEASUREMENT_ID || rawConfig.measurementId || '',
  firestoreDatabaseId: resolvedDbId,
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};

// 2. Initialize Firebase instances safely
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  if (getApps().length === 0) {
    app = initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
      measurementId: firebaseConfig.measurementId,
    });
  } else {
    app = getApp();
  }

  auth = getAuth(app);

  // Initialize Firestore with specific databaseId and forced long polling
  // This prevents HTTP/2 RST_STREAM errors caused by Cloud Run / preview proxy environments
  const dbId = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

  try {
    db = initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        ignoreUndefinedProperties: true,
      },
      dbId
    );
  } catch {
    db = dbId ? getFirestore(app, dbId) : getFirestore(app);
  }

  storage = getStorage(app);
} catch (error) {
  console.warn('Failed to initialize Firebase SDK instance:', error);
  // Fallback assignments
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
}

// Validate connection asynchronously as recommended in skill
export async function testConnection(): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is in offline mode.');
    }
    return false;
  }
}

export async function getAuthBearerToken(forceRefresh = true): Promise<string | null> {
  if (!auth || typeof auth.currentUser?.getIdToken !== 'function') return null;
  try {
    return await auth.currentUser.getIdToken(forceRefresh);
  } catch {
    try {
      return await auth.currentUser.getIdToken(false);
    } catch {
      return null;
    }
  }
}

export { app, auth, db, storage };
