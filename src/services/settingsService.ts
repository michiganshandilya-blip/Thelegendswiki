import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { SystemSettings, UserRole } from '../types';
import { logAuditEvent } from './auditService';
import { withTimeout } from '../lib/asyncUtils';

const SETTINGS_COLLECTION = 'system_settings';
const DEFAULT_SETTINGS_DOC = 'global_config';
const FIRESTORE_TIMEOUT_MS = 3500;

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
  updatedAt: new Date().toISOString(),
  updatedBy: 'michiganshandilya@gmail.com',
};

let cachedSettings: SystemSettings = { ...DEFAULT_SYSTEM_SETTINGS };

/**
 * Retrieves the global system settings.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, DEFAULT_SETTINGS_DOC);
      const snapshot = await withTimeout(
        getDoc(docRef),
        FIRESTORE_TIMEOUT_MS,
        null
      );

      if (snapshot && snapshot.exists()) {
        cachedSettings = {
          ...DEFAULT_SYSTEM_SETTINGS,
          ...(snapshot.data() as Partial<SystemSettings>),
        };
      }
    } catch (err) {
      console.warn('Using cached system settings:', err);
    }
  }

  return cachedSettings;
}

/**
 * Updates the global system settings (Super Admin only).
 */
export async function updateSystemSettings(
  newSettings: Partial<SystemSettings>,
  actor: { uid: string; email: string; role: UserRole | string }
): Promise<SystemSettings> {
  const updated: SystemSettings = {
    ...cachedSettings,
    ...newSettings,
    id: DEFAULT_SETTINGS_DOC,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.email,
  };

  cachedSettings = updated;

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, DEFAULT_SETTINGS_DOC);
      await withTimeout(
        setDoc(docRef, updated),
        FIRESTORE_TIMEOUT_MS,
        undefined
      );
    } catch (err) {
      console.warn('Failed to sync system settings remotely:', err);
    }
  }

  // Record in audit log
  await logAuditEvent({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'System Setting Changed',
    targetId: DEFAULT_SETTINGS_DOC,
    targetTitle: 'Global Governance Policies',
    targetType: 'setting',
    details: `Updated platform settings: PeerReview=${updated.requirePeerReview}, PublicSubmissions=${updated.allowPublicSubmissions}, MaintenanceMode=${updated.maintenanceMode}.`,
    metadata: { settings: updated },
  });

  return updated;
}
