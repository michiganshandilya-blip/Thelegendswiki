import fs from 'fs';
import path from 'path';
import { initializeApp, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { VerifiedUser, getServerDb as getAuthServerDb, getFirebaseConfig } from './authHelper';

function toFirestoreRestValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: val.length > 0 ? { values: val.map(toFirestoreRestValue) } : {},
    };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreRestValue(v);
      }
    }
    return { mapValue: Object.keys(fields).length > 0 ? { fields } : {} };
  }
  return { stringValue: String(val) };
}

function fromFirestoreRestValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    const list = val.arrayValue?.values || [];
    return list.map(fromFirestoreRestValue);
  }
  if ('mapValue' in val) {
    const res: Record<string, any> = {};
    const subFields = val.mapValue?.fields || {};
    for (const [k, v] of Object.entries(subFields)) {
      res[k] = fromFirestoreRestValue(v);
    }
    return res;
  }
  return val;
}

export function parseFirestoreRestDoc(fields: Record<string, any>): Partial<ServerSystemSettings> {
  const result: Record<string, any> = {};
  if (!fields || typeof fields !== 'object') return result;
  for (const [k, v] of Object.entries(fields)) {
    result[k] = fromFirestoreRestValue(v);
  }
  return result;
}

export interface ServerSystemSettings {
  id: string;
  siteName: string;
  requirePeerReview: boolean;
  allowPublicSubmissions: boolean;
  announcementBanner: string;
  announcementActive: boolean;
  autoFlagSpam: boolean;
  maintenanceMode: boolean;
  minCitationsRequired: number;
  allowedRegions: string[];
  featuredSeries?: any;
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_SERVER_SETTINGS: ServerSystemSettings = {
  id: 'global_config',
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

const DISK_SETTINGS_PATH = path.resolve(process.cwd(), '.data', 'system_settings.json');

function loadSettingsFromDisk(): ServerSystemSettings | null {
  try {
    if (fs.existsSync(DISK_SETTINGS_PATH)) {
      const content = fs.readFileSync(DISK_SETTINGS_PATH, 'utf8');
      const parsed = JSON.parse(content);
      return { ...DEFAULT_SERVER_SETTINGS, ...parsed, id: 'global_config' };
    }
  } catch (err) {
    console.warn('[systemSettingsRouter] Could not read settings from disk:', err);
  }
  return null;
}

function saveSettingsToDisk(settings: ServerSystemSettings): void {
  try {
    const dir = path.dirname(DISK_SETTINGS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DISK_SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');
  } catch (err) {
    console.warn('[systemSettingsRouter] Could not save settings to disk:', err);
  }
}

let cachedSettings: ServerSystemSettings = loadSettingsFromDisk() || { ...DEFAULT_SERVER_SETTINGS };
let serverDb: Firestore | null = null;

function getServerDb(targetProjectId?: string): Firestore | null {
  const authDb = getAuthServerDb(targetProjectId);
  if (authDb) {
    return authDb;
  }

  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      console.warn('[systemSettingsRouter] firebase-applet-config.json not found on disk.');
      return null;
    }

    const rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const appName = 'server-system-settings';
    
    let app;
    try {
      app = getApp(appName);
    } catch {
      app = initializeApp(
        {
          apiKey: rawConfig.apiKey,
          authDomain: rawConfig.authDomain,
          projectId: rawConfig.projectId,
        },
        appName
      );
    }

    serverDb = (rawConfig.firestoreDatabaseId && rawConfig.firestoreDatabaseId !== '(default)')
      ? getFirestore(app, rawConfig.firestoreDatabaseId)
      : getFirestore(app);
    return serverDb;
  } catch (err) {
    console.error('[systemSettingsRouter] Failed to initialize server Firestore:', err);
    return null;
  }
}

export async function handleGetSystemSettings(): Promise<ServerSystemSettings> {
  const config = getFirebaseConfig();
  if (config?.projectId && config?.firestoreDatabaseId) {
    try {
      const dbParam = config.firestoreDatabaseId || '(default)';
      const restUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbParam}/documents/system_settings/global_config`;
      const res = await fetch(restUrl);
      if (res.ok) {
        const docJson = await res.json();
        if (docJson?.fields) {
          const parsed = parseFirestoreRestDoc(docJson.fields);
          cachedSettings = {
            ...DEFAULT_SERVER_SETTINGS,
            ...parsed,
            id: 'global_config',
          };
          saveSettingsToDisk(cachedSettings);
          return cachedSettings;
        }
      }
    } catch (restErr) {
      console.warn('[systemSettingsRouter] REST fetch of system_settings failed, falling back:', restErr);
    }
  }

  const db = getServerDb(config?.projectId);
  if (!db) {
    return cachedSettings;
  }

  try {
    const docRef = doc(db, 'system_settings', 'global_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      cachedSettings = {
        ...DEFAULT_SERVER_SETTINGS,
        ...(snap.data() as Partial<ServerSystemSettings>),
        id: 'global_config',
      };
      saveSettingsToDisk(cachedSettings);
    }
  } catch (err) {
    console.warn('[systemSettingsRouter] Failed to fetch system_settings from Firestore, using cache:', err);
  }

  return cachedSettings;
}

export async function handleUpdateSystemSettings(
  body: any,
  verifiedUser: VerifiedUser,
  authHeader?: string
): Promise<{ success: boolean; settings?: ServerSystemSettings; error?: string; status?: number }> {
  try {
    if (!verifiedUser.isSuperAdmin && !verifiedUser.isAdmin) {
      return {
        success: false,
        status: 403,
        error: 'Forbidden: Super Admin or Administrator authorization is required to modify system settings.',
      };
    }

    const config = getFirebaseConfig(verifiedUser.projectId);
    if (!config?.projectId || !config?.firestoreDatabaseId) {
      return {
        success: false,
        status: 500,
        error: 'Server configuration error: Missing Firebase project configuration for Firestore persistence.',
      };
    }

    const allowedRegions = Array.isArray(body?.allowedRegions) && body.allowedRegions.length > 0
      ? body.allowedRegions.map((r: any) => String(r).trim()).filter(Boolean)
      : cachedSettings.allowedRegions;

    const payload: ServerSystemSettings = {
      id: 'global_config',
      siteName: typeof body?.siteName === 'string' && body.siteName.trim() ? body.siteName.trim() : cachedSettings.siteName,
      requirePeerReview: typeof body?.requirePeerReview === 'boolean' ? body.requirePeerReview : cachedSettings.requirePeerReview,
      allowPublicSubmissions: typeof body?.allowPublicSubmissions === 'boolean' ? body.allowPublicSubmissions : cachedSettings.allowPublicSubmissions,
      announcementBanner: typeof body?.announcementBanner === 'string' ? body.announcementBanner : cachedSettings.announcementBanner,
      announcementActive: typeof body?.announcementActive === 'boolean' ? body.announcementActive : cachedSettings.announcementActive,
      autoFlagSpam: typeof body?.autoFlagSpam === 'boolean' ? body.autoFlagSpam : cachedSettings.autoFlagSpam,
      maintenanceMode: typeof body?.maintenanceMode === 'boolean' ? body.maintenanceMode : cachedSettings.maintenanceMode,
      minCitationsRequired: typeof body?.minCitationsRequired === 'number' && !isNaN(body.minCitationsRequired) ? body.minCitationsRequired : cachedSettings.minCitationsRequired,
      allowedRegions,
      featuredSeries: body?.featuredSeries !== undefined ? body.featuredSeries : (cachedSettings as any).featuredSeries,
      updatedAt: new Date().toISOString(),
      updatedBy: verifiedUser.email,
    };

    const dbParam = config.firestoreDatabaseId || '(default)';
    const docRestUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbParam}/documents/system_settings/global_config`;

    // 1. If client attempted remote persistence directly via Firestore SDK
    if (body?.clientSynced) {
      try {
        const verifyRes = await fetch(docRestUrl);
        if (verifyRes.ok) {
          const verifyJson = await verifyRes.json();
          if (verifyJson?.fields) {
            const confirmedSettings: ServerSystemSettings = {
              ...DEFAULT_SERVER_SETTINGS,
              ...parseFirestoreRestDoc(verifyJson.fields),
              id: 'global_config',
            };
            cachedSettings = confirmedSettings;
            saveSettingsToDisk(confirmedSettings);
            return { success: true, settings: confirmedSettings };
          }
        }
        return {
          success: false,
          status: verifyRes.status || 500,
          error: 'Remote Firestore verification failed: Document could not be verified on remote server.',
        };
      } catch (verifyErr: any) {
        return {
          success: false,
          status: 500,
          error: `Remote Firestore read-back verification failed: ${verifyErr?.message || verifyErr}`,
        };
      }
    }

    // 2. Client did not persist directly; perform authoritative remote Firestore REST write
    const authHead = authHeader || (body?.token ? `Bearer ${body.token}` : undefined);
    const rawToken = authHead ? (authHead.startsWith('Bearer ') ? authHead.slice(7).trim() : authHead.trim()) : '';
    const isGoogleJwt = rawToken.startsWith('eyJ') && rawToken.split('.').length === 3;

    if (!isGoogleJwt) {
      return {
        success: false,
        status: 401,
        error: 'Authentication required: A valid Google/Firebase OAuth Bearer token is required for remote Firestore persistence.',
      };
    }

    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (v !== undefined) {
        fields[k] = toFirestoreRestValue(v);
      }
    }

    const updateMaskParams = Object.keys(fields)
      .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
      .join('&');
    const patchUrl = `${docRestUrl}?${updateMaskParams}`;

    const restRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHead,
      },
      body: JSON.stringify({ fields }),
    });

    if (!restRes.ok) {
      const errorData = await restRes.json().catch(() => ({}));
      const firestoreErrMsg = errorData?.error?.message || `Firestore REST responded with HTTP ${restRes.status}`;
      console.warn(`[systemSettingsRouter] Firestore REST write rejected: status=${restRes.status}, error=${firestoreErrMsg}, patchUrl=${patchUrl}`);
      return {
        success: false,
        status: restRes.status || 500,
        error: `Remote Firestore persistence failed: ${firestoreErrMsg}`,
      };
    }

    // Read back and confirm from remote server response or GET verification
    const restData = await restRes.json().catch(() => null);
    let verifiedSettings: ServerSystemSettings;

    if (restData?.fields) {
      verifiedSettings = {
        ...DEFAULT_SERVER_SETTINGS,
        ...parseFirestoreRestDoc(restData.fields),
        id: 'global_config',
      };
    } else {
      // Direct GET verification from Firestore
      const verifyRes = await fetch(docRestUrl);
      if (!verifyRes.ok) {
        return {
          success: false,
          status: 500,
          error: 'Remote Firestore write could not be verified from the server.',
        };
      }
      const verifyJson = await verifyRes.json();
      verifiedSettings = {
        ...DEFAULT_SERVER_SETTINGS,
        ...parseFirestoreRestDoc(verifyJson?.fields || {}),
        id: 'global_config',
      };
    }

    // Authoritative cache update ONLY after remote verification confirms persistence
    cachedSettings = verifiedSettings;
    saveSettingsToDisk(verifiedSettings);

    return { success: true, settings: verifiedSettings };
  } catch (err: any) {
    console.error('[systemSettingsRouter] Error persisting system settings:', err);
    return { success: false, status: 500, error: err?.message || 'Failed to save system settings' };
  }
}
