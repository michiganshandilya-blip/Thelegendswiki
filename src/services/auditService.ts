import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  deleteDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { AuditLogEntry, UserRole } from '../types';
import { withTimeout } from '../lib/asyncUtils';

const AUDIT_COLLECTION = 'audit_logs';
const FIRESTORE_TIMEOUT_MS = 3500;

// In-memory / Mock Audit Logs for instant presentation & robust fallback
const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-init-001',
    actorUid: 'usr-super-admin-01',
    actorEmail: 'michiganshandilya@gmail.com',
    actorRole: 'super_admin',
    action: 'System Initialized',
    targetId: 'system-core',
    targetTitle: 'Role Based Access Control Hierarchy',
    targetType: 'system',
    details: 'Super Admin system initialized with 3-tier hierarchy: USER -> ADMIN -> SUPER ADMIN.',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    metadata: { version: '2.0.0', superAdmin: 'michiganshandilya@gmail.com' }
  },
  {
    id: 'audit-init-002',
    actorUid: 'usr-super-admin-01',
    actorEmail: 'michiganshandilya@gmail.com',
    actorRole: 'super_admin',
    action: 'Security Rules Enforced',
    targetId: 'firestore-rules',
    targetTitle: 'Backend Security Architecture',
    targetType: 'setting',
    details: 'Backend Firestore rules deployed with server-side role validation and immutable audit trails.',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'audit-init-003',
    actorUid: 'usr-admin-01',
    actorEmail: 'hypatia@alexandria-archive.org',
    actorRole: 'admin',
    action: 'Contribution Approved',
    targetId: 'manhattan-project-coverup',
    targetTitle: 'The Manhattan Project: Hidden Downwind Radiation Files',
    targetType: 'article',
    details: 'Contribution reviewed and approved for global publication under Behind the Evidence category.',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'audit-init-004',
    actorUid: 'usr-admin-01',
    actorEmail: 'hypatia@alexandria-archive.org',
    actorRole: 'admin',
    action: 'Article Edited',
    targetId: 'panama-papers-network',
    targetTitle: 'The Panama Papers & Mossack Fonseca Shells',
    targetType: 'article',
    details: 'Updated primary banking registry evidence figures and legal outcome documentation.',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
  }
];

let inMemoryAuditLogs: AuditLogEntry[] = [...INITIAL_AUDIT_LOGS];

/**
 * Logs an administrative event into the audit trail.
 */
export async function logAuditEvent(params: {
  actorUid: string;
  actorEmail: string;
  actorRole: UserRole | string;
  action: string;
  targetId?: string;
  targetTitle?: string;
  targetType?: 'article' | 'user' | 'role' | 'setting' | 'category' | 'system';
  details: string;
  metadata?: Record<string, any>;
}): Promise<AuditLogEntry> {
  const newEntry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    actorUid: params.actorUid,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    action: params.action,
    targetId: params.targetId,
    targetTitle: params.targetTitle,
    targetType: params.targetType || 'system',
    details: params.details,
    timestamp: new Date().toISOString(),
    metadata: params.metadata,
  };

  // Prepend in-memory for instant reactive UI
  inMemoryAuditLogs = [newEntry, ...inMemoryAuditLogs];

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, AUDIT_COLLECTION, newEntry.id);
      await withTimeout(
        setDoc(docRef, {
          ...newEntry,
          metadata: newEntry.metadata || {},
        }),
        FIRESTORE_TIMEOUT_MS,
        undefined
      );
    } catch (err) {
      console.warn('Audit log remote sync warning (cached locally):', err);
    }
  }

  return newEntry;
}

/**
 * Retrieves audit log entries with optional filtering.
 */
export async function getAuditLogs(
  filter?: {
    actorEmail?: string;
    actionType?: string;
    targetType?: string;
    searchTerm?: string;
  },
  limitCount: number = 100
): Promise<AuditLogEntry[]> {
  let logs = [...inMemoryAuditLogs];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, AUDIT_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const snapshot = await withTimeout(
        getDocs(q),
        FIRESTORE_TIMEOUT_MS,
        null
      );

      if (snapshot && !snapshot.empty) {
        const remoteLogs: AuditLogEntry[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<AuditLogEntry, 'id'>),
        }));

        // Merge remote logs with in-memory logs (dedup by ID)
        const logMap = new Map<string, AuditLogEntry>();
        [...remoteLogs, ...inMemoryAuditLogs].forEach((l) => logMap.set(l.id, l));
        logs = Array.from(logMap.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        inMemoryAuditLogs = logs;
      }
    } catch (err) {
      console.warn('Using local audit logs:', err);
    }
  }

  // Apply filters
  if (filter) {
    if (filter.actorEmail) {
      const emailLower = filter.actorEmail.toLowerCase();
      logs = logs.filter((l) => l.actorEmail?.toLowerCase().includes(emailLower));
    }
    if (filter.actionType && filter.actionType !== 'all') {
      const actionLower = filter.actionType.toLowerCase();
      logs = logs.filter((l) => l.action.toLowerCase().includes(actionLower));
    }
    if (filter.targetType && filter.targetType !== 'all') {
      logs = logs.filter((l) => l.targetType === filter.targetType);
    }
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(searchLower) ||
          l.details.toLowerCase().includes(searchLower) ||
          l.actorEmail.toLowerCase().includes(searchLower) ||
          (l.targetTitle && l.targetTitle.toLowerCase().includes(searchLower)) ||
          (l.targetId && l.targetId.toLowerCase().includes(searchLower))
      );
    }
  }

  return logs.slice(0, limitCount);
}

/**
 * Super Admin function to purge old audit logs if necessary.
 */
export async function deleteAuditLogEntry(id: string): Promise<boolean> {
  inMemoryAuditLogs = inMemoryAuditLogs.filter((l) => l.id !== id);

  if (isFirebaseConfigured && db) {
    try {
      await withTimeout(
        deleteDoc(doc(db, AUDIT_COLLECTION, id)),
        FIRESTORE_TIMEOUT_MS,
        undefined
      );
    } catch (err) {
      console.warn('Remote audit delete failed:', err);
    }
  }

  return true;
}
