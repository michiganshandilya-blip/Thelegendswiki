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
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  InvestigationRecord,
  EvidenceItem,
  ClaimItem,
  InvestigationStatus,
  ClaimStatus,
  EvidenceVerificationStatus,
  UserRole,
} from '../types';
import { INITIAL_INVESTIGATIONS, INITIAL_EVIDENCE, INITIAL_CLAIMS } from '../data/investigationData';
import { logAuditEvent } from './auditService';
import { withTimeout } from '../lib/asyncUtils';

const INVESTIGATIONS_COLLECTION = 'investigations';
const EVIDENCE_COLLECTION = 'evidence';
const FIRESTORE_TIMEOUT_MS = 3500;

// Reactive In-Memory Caches
let inMemoryInvestigations: InvestigationRecord[] = [...INITIAL_INVESTIGATIONS];
let inMemoryEvidence: EvidenceItem[] = [...INITIAL_EVIDENCE];
let inMemoryClaims: ClaimItem[] = [...INITIAL_CLAIMS];

// Local Storage Keys
const LOCAL_INVESTIGATIONS_KEY = 'thelegendswiki:investigations';
const LOCAL_EVIDENCE_KEY = 'thelegendswiki:evidence';

function syncToLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(LOCAL_INVESTIGATIONS_KEY, JSON.stringify(inMemoryInvestigations));
    localStorage.setItem(LOCAL_EVIDENCE_KEY, JSON.stringify(inMemoryEvidence));
  } catch (err) {
    console.warn('Could not cache investigations locally:', err);
  }
}

function loadFromLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const rawInv = localStorage.getItem(LOCAL_INVESTIGATIONS_KEY);
    if (rawInv) {
      const parsed = JSON.parse(rawInv);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with initial data
        const map = new Map<string, InvestigationRecord>();
        INITIAL_INVESTIGATIONS.forEach(i => map.set(i.id, i));
        parsed.forEach((i: InvestigationRecord) => map.set(i.id, i));
        inMemoryInvestigations = Array.from(map.values());
      }
    }

    const rawEvi = localStorage.getItem(LOCAL_EVIDENCE_KEY);
    if (rawEvi) {
      const parsed = JSON.parse(rawEvi);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const map = new Map<string, EvidenceItem>();
        INITIAL_EVIDENCE.forEach(e => map.set(e.id, e));
        parsed.forEach((e: EvidenceItem) => map.set(e.id, e));
        inMemoryEvidence = Array.from(map.values());
      }
    }
  } catch (err) {
    console.warn('Could not load cached investigations:', err);
  }
}

loadFromLocalStorage();

// ==========================================
// 1. QUERY & FETCH OPERATIONS
// ==========================================

export async function getAllInvestigations(filters?: {
  status?: InvestigationStatus | 'all';
  searchQuery?: string;
  articleSlug?: string;
}): Promise<InvestigationRecord[]> {
  let records = [...inMemoryInvestigations];

  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, INVESTIGATIONS_COLLECTION);
      const snapshot = await withTimeout(getDocs(colRef), FIRESTORE_TIMEOUT_MS, null);
      if (snapshot && !snapshot.empty) {
        const remoteData: InvestigationRecord[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<InvestigationRecord, 'id'>),
        }));

        const map = new Map<string, InvestigationRecord>();
        inMemoryInvestigations.forEach(inv => map.set(inv.id, inv));
        remoteData.forEach(inv => map.set(inv.id, inv));
        records = Array.from(map.values());
        inMemoryInvestigations = records;
        syncToLocalStorage();
      }
    } catch (err) {
      console.warn('Investigation remote fetch fallback to memory:', err);
    }
  }

  // Hydrate evidence for each investigation
  records = records.map(inv => {
    const matchedEvidence = inMemoryEvidence.filter(e => e.investigationId === inv.id);
    return {
      ...inv,
      evidence: matchedEvidence,
      evidenceCount: matchedEvidence.length,
    };
  });

  // Apply filters
  if (filters?.status && filters.status !== 'all') {
    records = records.filter(i => i.status === filters.status);
  }

  if (filters?.articleSlug) {
    records = records.filter(i => i.articleSlug === filters.articleSlug);
  }

  if (filters?.searchQuery?.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    records = records.filter(
      i =>
        i.title.toLowerCase().includes(q) ||
        i.subject.toLowerCase().includes(q) ||
        i.summary.toLowerCase().includes(q) ||
        i.leadInvestigator.toLowerCase().includes(q)
    );
  }

  return records.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

export async function getInvestigationById(id: string): Promise<InvestigationRecord | null> {
  const local = inMemoryInvestigations.find(i => i.id === id);
  if (local) {
    const matchedEvidence = inMemoryEvidence.filter(e => e.investigationId === local.id);
    return { ...local, evidence: matchedEvidence, evidenceCount: matchedEvidence.length };
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, INVESTIGATIONS_COLLECTION, id);
      const snapshot = await withTimeout(getDoc(docRef), FIRESTORE_TIMEOUT_MS, null);
      if (snapshot && snapshot.exists()) {
        const inv = { id: snapshot.id, ...(snapshot.data() as Omit<InvestigationRecord, 'id'>) };
        const matchedEvidence = inMemoryEvidence.filter(e => e.investigationId === inv.id);
        return { ...inv, evidence: matchedEvidence, evidenceCount: matchedEvidence.length };
      }
    } catch (err) {
      console.warn('Error fetching investigation by ID:', err);
    }
  }

  return null;
}

export async function getInvestigationByArticleSlug(slug: string): Promise<InvestigationRecord | null> {
  const match = inMemoryInvestigations.find(
    i => i.articleSlug === slug || i.slug === slug
  );
  if (match) {
    const matchedEvidence = inMemoryEvidence.filter(e => e.investigationId === match.id);
    return { ...match, evidence: matchedEvidence, evidenceCount: matchedEvidence.length };
  }

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, INVESTIGATIONS_COLLECTION), where('articleSlug', '==', slug), limit(1));
      const snapshot = await withTimeout(getDocs(q), FIRESTORE_TIMEOUT_MS, null);
      if (snapshot && !snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const inv = { id: docSnap.id, ...(docSnap.data() as Omit<InvestigationRecord, 'id'>) };
        const matchedEvidence = inMemoryEvidence.filter(e => e.investigationId === inv.id);
        return { ...inv, evidence: matchedEvidence, evidenceCount: matchedEvidence.length };
      }
    } catch (err) {
      console.warn('Error fetching investigation by article slug:', err);
    }
  }

  return null;
}

export async function getAllEvidence(investigationId?: string): Promise<EvidenceItem[]> {
  if (investigationId) {
    return inMemoryEvidence.filter(e => e.investigationId === investigationId);
  }
  return [...inMemoryEvidence];
}

// ==========================================
// 2. CREATION & WORKFLOW OPERATIONS
// ==========================================

export async function createInvestigation(
  payload: Omit<InvestigationRecord, 'id' | 'createdAt' | 'updatedAt'>,
  actor: { uid: string; email: string; role: UserRole | string; displayName?: string }
): Promise<{ success: boolean; data?: InvestigationRecord; error?: string }> {
  try {
    const now = new Date().toISOString();
    const newId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newInvestigation: InvestigationRecord = {
      ...payload,
      id: newId,
      claims: payload.claims || [],
      evidenceCount: 0,
      createdAt: now,
      updatedAt: now,
      isPublished: payload.status === 'published',
    };

    inMemoryInvestigations = [newInvestigation, ...inMemoryInvestigations];
    syncToLocalStorage();

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, INVESTIGATIONS_COLLECTION, newId);
        await withTimeout(setDoc(docRef, newInvestigation), FIRESTORE_TIMEOUT_MS, undefined);
      } catch (err) {
        console.warn('Investigation remote save warning:', err);
      }
    }

    // Audit Logging
    await logAuditEvent({
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'Investigation Created',
      targetId: newId,
      targetTitle: newInvestigation.title,
      targetType: 'article',
      details: `Created new investigation dossier "${newInvestigation.title}" under subject "${newInvestigation.subject}" with status [${newInvestigation.status}].`,
    });

    return { success: true, data: newInvestigation };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create investigation.' };
  }
}

export async function updateInvestigation(
  id: string,
  updates: Partial<InvestigationRecord>,
  actor: { uid: string; email: string; role: UserRole | string; displayName?: string }
): Promise<{ success: boolean; data?: InvestigationRecord; error?: string }> {
  try {
    const existingIndex = inMemoryInvestigations.findIndex(i => i.id === id);
    if (existingIndex === -1) {
      return { success: false, error: 'Investigation not found.' };
    }

    const now = new Date().toISOString();
    const updated: InvestigationRecord = {
      ...inMemoryInvestigations[existingIndex],
      ...updates,
      updatedAt: now,
      isPublished: updates.status ? updates.status === 'published' : inMemoryInvestigations[existingIndex].isPublished,
    };

    inMemoryInvestigations[existingIndex] = updated;
    syncToLocalStorage();

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, INVESTIGATIONS_COLLECTION, id);
        await withTimeout(updateDoc(docRef, { ...updates, updatedAt: now }), FIRESTORE_TIMEOUT_MS, undefined);
      } catch (err) {
        console.warn('Investigation remote update warning:', err);
      }
    }

    await logAuditEvent({
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'Investigation Updated',
      targetId: id,
      targetTitle: updated.title,
      targetType: 'article',
      details: `Updated investigation dossier "${updated.title}" (Status: ${updated.status}).`,
    });

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update investigation.' };
  }
}

// ==========================================
// 3. EVIDENCE MANAGEMENT & LINKING
// ==========================================

export async function addEvidenceItem(
  payload: Omit<EvidenceItem, 'id' | 'createdAt' | 'updatedAt'>,
  actor: { uid: string; email: string; role: UserRole | string; displayName?: string }
): Promise<{ success: boolean; data?: EvidenceItem; error?: string }> {
  try {
    const now = new Date().toISOString();
    const newId = `evi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newEvidence: EvidenceItem = {
      ...payload,
      id: newId,
      createdAt: now,
      updatedAt: now,
      authorId: actor.uid,
      authorName: actor.displayName || actor.email,
    };

    inMemoryEvidence = [newEvidence, ...inMemoryEvidence];
    syncToLocalStorage();

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, EVIDENCE_COLLECTION, newId);
        await withTimeout(setDoc(docRef, newEvidence), FIRESTORE_TIMEOUT_MS, undefined);
      } catch (err) {
        console.warn('Evidence remote save warning:', err);
      }
    }

    await logAuditEvent({
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'Evidence Registered',
      targetId: newId,
      targetTitle: newEvidence.title,
      targetType: 'article',
      details: `Registered new ${newEvidence.evidenceType} from source "${newEvidence.source}" with verification status [${newEvidence.verificationStatus}].`,
    });

    return { success: true, data: newEvidence };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add evidence item.' };
  }
}

export async function verifyEvidenceItem(
  id: string,
  status: EvidenceVerificationStatus,
  confidenceScore: number,
  actor: { uid: string; email: string; role: UserRole | string; displayName?: string }
): Promise<{ success: boolean; data?: EvidenceItem; error?: string }> {
  try {
    const idx = inMemoryEvidence.findIndex(e => e.id === id);
    if (idx === -1) return { success: false, error: 'Evidence record not found.' };

    const now = new Date().toISOString();
    const updated: EvidenceItem = {
      ...inMemoryEvidence[idx],
      verificationStatus: status,
      confidenceScore,
      verifiedBy: actor.displayName || actor.email,
      verifiedAt: now,
      updatedAt: now,
    };

    inMemoryEvidence[idx] = updated;
    syncToLocalStorage();

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, EVIDENCE_COLLECTION, id);
        await withTimeout(
          updateDoc(docRef, {
            verificationStatus: status,
            confidenceScore,
            verifiedBy: actor.displayName || actor.email,
            verifiedAt: now,
            updatedAt: now,
          }),
          FIRESTORE_TIMEOUT_MS,
          undefined
        );
      } catch (err) {
        console.warn('Evidence remote update warning:', err);
      }
    }

    await logAuditEvent({
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'Evidence Verified',
      targetId: id,
      targetTitle: updated.title,
      targetType: 'article',
      details: `Verified evidence item "${updated.title}" -> Status: [${status}] with Confidence Score: ${confidenceScore}%.`,
    });

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to verify evidence.' };
  }
}

// ==========================================
// 4. CLAIMS MANAGEMENT & VERIFICATION MATRIX
// ==========================================

export async function addClaimToInvestigation(
  investigationId: string,
  claimPayload: Omit<ClaimItem, 'id' | 'investigationId' | 'createdAt' | 'updatedAt'>,
  actor: { uid: string; email: string; role: UserRole | string; displayName?: string }
): Promise<{ success: boolean; data?: ClaimItem; error?: string }> {
  try {
    const inv = inMemoryInvestigations.find(i => i.id === investigationId);
    if (!inv) return { success: false, error: 'Investigation not found.' };

    const now = new Date().toISOString();
    const claimId = `claim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newClaim: ClaimItem = {
      ...claimPayload,
      id: claimId,
      investigationId,
      authorId: actor.uid,
      createdAt: now,
      updatedAt: now,
    };

    const updatedClaims = [...(inv.claims || []), newClaim];
    inv.claims = updatedClaims;
    inv.updatedAt = now;
    syncToLocalStorage();

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, INVESTIGATIONS_COLLECTION, investigationId);
        await withTimeout(
          updateDoc(docRef, { claims: updatedClaims, updatedAt: now }),
          FIRESTORE_TIMEOUT_MS,
          undefined
        );
      } catch (err) {
        console.warn('Claim remote update warning:', err);
      }
    }

    await logAuditEvent({
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'Claim Added',
      targetId: claimId,
      targetTitle: newClaim.subject,
      targetType: 'article',
      details: `Added new claim to "${inv.title}": "${newClaim.statement}" [Status: ${newClaim.status}].`,
    });

    return { success: true, data: newClaim };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add claim.' };
  }
}

export async function verifyClaim(
  investigationId: string,
  claimId: string,
  status: ClaimStatus,
  epistemicRationale: string,
  linkedEvidenceIds: string[],
  actor: { uid: string; email: string; role: UserRole | string; displayName?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const inv = inMemoryInvestigations.find(i => i.id === investigationId);
    if (!inv) return { success: false, error: 'Investigation not found.' };

    const now = new Date().toISOString();
    inv.claims = (inv.claims || []).map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          status,
          epistemicRationale,
          linkedEvidenceIds,
          verifiedBy: actor.displayName || actor.email,
          verifiedAt: now,
          updatedAt: now,
        };
      }
      return c;
    });
    inv.updatedAt = now;
    syncToLocalStorage();

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, INVESTIGATIONS_COLLECTION, investigationId);
        await withTimeout(
          updateDoc(docRef, { claims: inv.claims, updatedAt: now }),
          FIRESTORE_TIMEOUT_MS,
          undefined
        );
      } catch (err) {
        console.warn('Claim verification remote update warning:', err);
      }
    }

    await logAuditEvent({
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'Claim Verified',
      targetId: claimId,
      targetTitle: inv.title,
      targetType: 'article',
      details: `Verified claim in investigation "${inv.title}" -> Set status to [${status.toUpperCase()}] based on ${linkedEvidenceIds.length} linked evidence records.`,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to verify claim.' };
  }
}

// ==========================================
// 5. STATUS TRANSITION PIPELINE
// ==========================================

export async function advanceInvestigationStatus(
  id: string,
  newStatus: InvestigationStatus,
  actor: { uid: string; email: string; role: UserRole | string; displayName?: string }
): Promise<{ success: boolean; error?: string }> {
  return updateInvestigation(id, { status: newStatus }, actor);
}

export async function deleteInvestigation(
  id: string,
  actor: { uid: string; email: string; role: UserRole | string; displayName?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = inMemoryInvestigations.find(i => i.id === id);
    if (!existing) return { success: false, error: 'Investigation not found.' };

    inMemoryInvestigations = inMemoryInvestigations.filter(i => i.id !== id);
    syncToLocalStorage();

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, INVESTIGATIONS_COLLECTION, id);
        await withTimeout(deleteDoc(docRef), FIRESTORE_TIMEOUT_MS, undefined);
      } catch (err) {
        console.warn('Remote investigation delete failed:', err);
      }
    }

    await logAuditEvent({
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'Investigation Deleted',
      targetId: id,
      targetTitle: existing.title,
      targetType: 'article',
      details: `Deleted investigation dossier "${existing.title}".`,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete investigation.' };
  }
}
