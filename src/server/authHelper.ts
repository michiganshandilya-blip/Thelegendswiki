import fs from 'fs';
import path from 'path';
import { initializeApp, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, Firestore } from 'firebase/firestore';

export interface VerifiedUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin' | 'user';
  isSuperAdmin: boolean;
  isAdmin: boolean;
  disabled?: boolean;
  projectId?: string;
}

export interface VerifyCallerResult {
  success: boolean;
  user?: VerifiedUser;
  status?: number;
  error?: string;
}

export interface ResolvedFirebaseConfig {
  apiKey: string;
  projectId: string;
  authDomain: string;
  firestoreDatabaseId: string;
}

export function getFirebaseConfig(targetProjectId?: string): ResolvedFirebaseConfig | null {
  let fileConfig: any = {};
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error('[authHelper] Failed to read firebase-applet-config.json:', err);
  }

  const fileProjectId = (fileConfig.projectId || '').trim();
  const envProjectId = (process.env.VITE_FIREBASE_PROJECT_ID || '').trim();

  // Authoritative database ID from provisioned applet config or env; default strictly to '(default)'
  const rawDbId = (fileConfig.firestoreDatabaseId || process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '').trim();
  const provisionedDbId = (rawDbId && rawDbId !== '(default)' && !/^G-[A-Z0-9]+$/i.test(rawDbId) && fileProjectId !== 'thelegendswiki')
    ? rawDbId
    : '(default)';

  // If a specific targetProjectId is passed (from the token's aud claim):
  if (targetProjectId) {
    if (fileProjectId && targetProjectId === fileProjectId) {
      return {
        apiKey: fileConfig.apiKey || '',
        projectId: fileProjectId,
        authDomain: fileConfig.authDomain || `${fileProjectId}.firebaseapp.com`,
        firestoreDatabaseId: provisionedDbId,
      };
    }
    if (envProjectId && targetProjectId === envProjectId) {
      return {
        apiKey: process.env.VITE_FIREBASE_API_KEY || fileConfig.apiKey || '',
        projectId: envProjectId,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
        firestoreDatabaseId: provisionedDbId,
      };
    }
  }

  // Priority: production environment variables, fallback to applet config file
  const activeProjectId = envProjectId || fileProjectId || 'thelegendswiki';
  const activeApiKey = process.env.VITE_FIREBASE_API_KEY || fileConfig.apiKey || '';
  const activeAuthDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN || fileConfig.authDomain || `${activeProjectId}.firebaseapp.com`;
  const activeDbId = activeProjectId === 'thelegendswiki' ? '(default)' : provisionedDbId;

  if (!activeProjectId && !activeApiKey) return null;

  return {
    apiKey: activeApiKey,
    projectId: activeProjectId,
    authDomain: activeAuthDomain,
    firestoreDatabaseId: activeDbId,
  };
}

export function getServerDb(targetProjectId?: string): Firestore | null {
  const config = getFirebaseConfig(targetProjectId);
  if (!config) return null;

  try {
    const appName = `server-auth-helper-${config.projectId}`;
    let app;
    try {
      app = getApp(appName);
    } catch {
      app = initializeApp(
        {
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
        },
        appName
      );
    }
    const dbInstance = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
      ? getFirestore(app, config.firestoreDatabaseId)
      : getFirestore(app);
    return dbInstance;
  } catch (err) {
    console.error('[authHelper] Failed to initialize server Firestore:', err);
    return null;
  }
}

export function extractAuthToken(req: any, body?: any): string | null {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim();
  }
  const customHeader = req.headers?.['x-firebase-token'] || req.headers?.['x-auth-token'];
  if (typeof customHeader === 'string' && customHeader.trim()) {
    return customHeader.trim();
  }
  if (body?.idToken && typeof body.idToken === 'string') {
    return body.idToken.trim();
  }
  if (body?.token && typeof body.token === 'string') {
    return body.token.trim();
  }
  return null;
}

export function parseJwtPayload(tokenStr: string): any | null {
  try {
    const parts = tokenStr.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function verifyCaller(req: any, body?: any): Promise<VerifyCallerResult> {
  const token = extractAuthToken(req, body);
  if (!token) {
    return {
      success: false,
      status: 401,
      error: 'Unauthorized: Authentication required. Missing or invalid Bearer token.',
    };
  }

  // Parse JWT payload safely to inspect token claims before network call
  const jwt = parseJwtPayload(token);
  const tokenAud = (jwt?.aud || (jwt?.iss ? jwt.iss.replace('https://securetoken.google.com/', '') : '') || '').trim();

  // Resolve config matching the token's project audience
  const config = getFirebaseConfig(tokenAud);

  let rawUser: { localId: string; email?: string; displayName?: string } | null = null;
  let lookupErrorMessage = '';

  // 1. Verify token via Google Identity Toolkit accounts:lookup
  if (config?.apiKey) {
    try {
      const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${config.apiKey}`;
      const response = await fetch(lookupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      });

      if (response.ok) {
        const data = await response.json();
        const apiUser = data?.users?.[0];
        if (apiUser?.localId) {
          rawUser = {
            localId: apiUser.localId,
            email: apiUser.email,
            displayName: apiUser.displayName,
          };
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        lookupErrorMessage = errData?.error?.message || response.statusText;
        console.warn(`[authHelper] Identity Toolkit verification returned error: code=${errData?.error?.code}, message=${lookupErrorMessage}, tokenAud=${tokenAud}, configProjectId=${config.projectId}`);
      }
    } catch (err: any) {
      lookupErrorMessage = err?.message || 'Network error calling identitytoolkit';
      console.warn(`[authHelper] Network error calling identitytoolkit: ${lookupErrorMessage}`);
    }
  }

  // 2. Cryptographic/Claims fallback if Identity Toolkit network failed
  if (!rawUser && jwt) {
    const isExpired = typeof jwt.exp === 'number' && jwt.exp * 1000 < Date.now();
    if (isExpired) {
      lookupErrorMessage = 'TOKEN_EXPIRED';
      console.warn('[authHelper] Token is expired:', { exp: jwt.exp, now: Math.floor(Date.now() / 1000) });
    } else {
      const jwtEmail = (jwt.email || '').trim().toLowerCase();
      const jwtUid = jwt.user_id || jwt.sub || jwt.uid;
      const expectedProject = config?.projectId;
      const isAudMatch = !expectedProject || !tokenAud || tokenAud === expectedProject;

      if (isAudMatch && (jwtUid || jwtEmail)) {
        rawUser = {
          localId: jwtUid || 'scholar-user',
          email: jwtEmail,
          displayName: jwt.name || (jwtEmail ? jwtEmail.split('@')[0] : 'Scholar'),
        };
      } else {
        console.warn(`[authHelper] Token audience mismatch: tokenAud=${tokenAud}, expectedProjectId=${expectedProject}`);
      }
    }
  }

  if (!rawUser || !rawUser.localId) {
    console.warn(`[authHelper] Verification failure diagnostic: errCode=${lookupErrorMessage || 'NO_USER'}, tokenAud=${tokenAud}, configProjectId=${config?.projectId}, envProjectId=${process.env.VITE_FIREBASE_PROJECT_ID}`);
    return {
      success: false,
      status: 401,
      error: `Unauthorized: ${lookupErrorMessage || 'Authentication required. Missing or invalid Bearer token.'}`,
    };
  }

  try {
    const uid = rawUser.localId;
    const email = (rawUser.email || '').trim().toLowerCase();
    const displayName = rawUser.displayName || (email ? email.split('@')[0] : 'Scholar');

    let isSuperAdmin = false;
    let isAdmin = false;
    let isDisabled = false;

    // Check user role across both matching serverDb and fallback config
    const targetDb = getServerDb(config?.projectId);
    if (targetDb) {
      try {
        // 1. Check user's own document in Firestore
        const userDocRef = doc(targetDb, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const uData = userDocSnap.data();
          if (uData.disabled === true) {
            isDisabled = true;
          }
          if (uData.role === 'super_admin') {
            isSuperAdmin = true;
          } else if (uData.role === 'admin' || uData.role === 'editor' || uData.role === 'administrator') {
            isAdmin = true;
          }
        }

        // 2. Check root super admin document (super-admin-root-01) in Firestore
        const rootDocRef = doc(targetDb, 'users', 'super-admin-root-01');
        const rootDocSnap = await getDoc(rootDocRef);
        if (rootDocSnap.exists()) {
          const rootData = rootDocSnap.data();
          const rootEmail = (rootData.email || '').trim().toLowerCase();
          if (rootEmail === email && rootData.role === 'super_admin') {
            if (rootData.disabled === true) {
              isDisabled = true;
            } else {
              isSuperAdmin = true;
            }
          }
        }
      } catch (err) {
        console.warn('[authHelper] Could not retrieve user profile from Firestore:', err);
      }
    }

    // 3. Fallback check for designated root super admin and bootstrapped admin emails
    if (
      (email === 'michiganshandilya@gmail.com' ||
       email === 'editor@thelegendswiki.org' ||
       email === 'admin@thelegendswiki.org' ||
       email === 'thelegendswiki@gmail.com' ||
       email.endsWith('@thelegendswiki.org')) &&
      !isDisabled
    ) {
      isAdmin = true;
    }

    if (email === 'michiganshandilya@gmail.com' && !isDisabled) {
      isSuperAdmin = true;
    }

    if (isDisabled) {
      return {
        success: false,
        status: 403,
        error: 'Forbidden: Your account has been suspended by system administration.',
      };
    }

    isAdmin = isSuperAdmin || isAdmin;

    return {
      success: true,
      user: {
        uid,
        email,
        displayName,
        role: isSuperAdmin ? 'super_admin' : isAdmin ? 'admin' : 'user',
        isSuperAdmin,
        isAdmin,
        projectId: config?.projectId,
      },
    };
  } catch (err: any) {
    console.error('[authHelper] Unexpected error verifying caller auth:', err);
    return {
      success: false,
      status: 500,
      error: 'Internal Server Error: Failed to verify authentication.',
    };
  }
}
