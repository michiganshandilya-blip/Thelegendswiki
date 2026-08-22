import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { Revision, RevisionActionType } from '../types';
import { validateRevision } from '../lib/validation';
import { getDbTimestamp } from '../lib/timestamps';
import { stripUndefined } from '../lib/sanitize';

const REVISIONS_COLLECTION = 'revisions';

// In-memory fallback for offline or unconfigured environments
let fallbackRevisions: Revision[] = [
  {
    id: 'rev-init-1',
    articleId: 'art-alexandria',
    articleTitle: 'Library of Alexandria',
    articleSlug: 'library-of-alexandria',
    editorId: 'system-scholar',
    editorName: 'Chief Scribe',
    previousContent: '',
    newContent: 'Historical encyclopedia entry on the Royal Library of Alexandria.',
    changeSummary: 'Initial scholarly publication with canonical citations.',
    actionType: 'approval',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'rev-init-2',
    articleId: 'art-antikythera',
    articleTitle: 'Antikythera Mechanism',
    articleSlug: 'antikythera-mechanism',
    editorId: 'system-scholar',
    editorName: 'Senior Curator',
    previousContent: '',
    newContent: 'Comprehensive astronomical and mechanical analysis.',
    changeSummary: 'Peer review complete. Approved and published.',
    actionType: 'approval',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

function normalizeRevisionDoc(id: string, data: any): Revision {
  return {
    id: id || data.id,
    articleId: data.articleId || '',
    articleTitle: data.articleTitle || '',
    articleSlug: data.articleSlug || '',
    editorId: data.editorId || '',
    editorName: data.editorName || 'Editor',
    previousContent: data.previousContent || '',
    newContent: data.newContent || '',
    changeSummary: data.changeSummary || '',
    actionType: data.actionType || 'direct_edit',
    moderationNotes: data.moderationNotes || undefined,
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

/**
 * Creates a new revision or audit log entry in Firestore.
 */
export async function createRevision(
  revisionData: Omit<Revision, 'id'>
): Promise<{ id: string; success: boolean; errors?: Record<string, string> }> {
  const validation = validateRevision(revisionData);
  if (!validation.isValid) {
    return { id: '', success: false, errors: validation.errors };
  }

  const now = getDbTimestamp();
  const generatedId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const payload: Revision = {
    ...revisionData,
    id: generatedId,
    createdAt: now,
  };

  // Add to in-memory fallback
  fallbackRevisions.unshift(payload);

  if (!isFirebaseConfigured() || !db) {
    return { id: generatedId, success: true };
  }

  try {
    const revisionsRef = collection(db, REVISIONS_COLLECTION);
    const newDocRef = doc(revisionsRef, generatedId);
    await setDoc(newDocRef, stripUndefined(payload));
    return { id: generatedId, success: true };
  } catch (error) {
    console.warn('Error saving revision to Firestore, kept in local session:', error);
    return { id: generatedId, success: true };
  }
}

/**
 * Convenience helper to record a structured audit log revision for moderation actions.
 */
export async function recordAuditRevision(params: {
  articleId: string;
  articleTitle?: string;
  articleSlug?: string;
  editorId: string;
  editorName?: string;
  actionType: RevisionActionType;
  changeSummary: string;
  previousContent?: string;
  newContent?: string;
  moderationNotes?: string;
}): Promise<void> {
  try {
    await createRevision({
      articleId: params.articleId,
      articleTitle: params.articleTitle || '',
      articleSlug: params.articleSlug || '',
      editorId: params.editorId,
      editorName: params.editorName || 'Editor',
      previousContent: params.previousContent || '',
      newContent: params.newContent || params.changeSummary,
      changeSummary: params.changeSummary,
      actionType: params.actionType,
      moderationNotes: params.moderationNotes,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to record audit revision:', err);
  }
}

/**
 * Retrieves the revision history for a given article.
 */
export async function getRevisionsByArticleId(
  articleId: string,
  limitCount: number = 30
): Promise<Revision[]> {
  if (!articleId) return [];

  if (!isFirebaseConfigured() || !db) {
    return fallbackRevisions
      .filter((r) => r.articleId === articleId)
      .slice(0, limitCount);
  }

  try {
    const revisionsRef = collection(db, REVISIONS_COLLECTION);
    const q = query(
      revisionsRef,
      where('articleId', '==', articleId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((d) => normalizeRevisionDoc(d.id, d.data()));
    if (list.length > 0) return list;

    // Fallback if none in remote
    return fallbackRevisions
      .filter((r) => r.articleId === articleId)
      .slice(0, limitCount);
  } catch (error) {
    console.warn(`Error fetching revisions for article "${articleId}":`, error);
    return fallbackRevisions
      .filter((r) => r.articleId === articleId)
      .slice(0, limitCount);
  }
}

/**
 * Retrieves the full system-wide audit and revision log for editors and administrators.
 */
export async function getAllRevisions(limitCount: number = 50): Promise<Revision[]> {
  if (!isFirebaseConfigured() || !db) {
    return [...fallbackRevisions].slice(0, limitCount);
  }

  try {
    const revisionsRef = collection(db, REVISIONS_COLLECTION);
    const q = query(revisionsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((d) => normalizeRevisionDoc(d.id, d.data()));

    // Merge in unique fallback items
    const idMap = new Set(list.map((r) => r.id));
    for (const f of fallbackRevisions) {
      if (!idMap.has(f.id)) {
        list.push(f);
      }
    }
    return list.slice(0, limitCount);
  } catch (error) {
    console.warn('Error fetching all revisions from Firestore:', error);
    return [...fallbackRevisions].slice(0, limitCount);
  }
}

/**
 * Retrieves a single revision by its ID.
 */
export async function getRevisionById(id: string): Promise<Revision | null> {
  if (!id) return null;

  if (!isFirebaseConfigured() || !db) {
    return fallbackRevisions.find((r) => r.id === id) || null;
  }

  try {
    const docRef = doc(db, REVISIONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return fallbackRevisions.find((r) => r.id === id) || null;
    }
    return normalizeRevisionDoc(docSnap.id, docSnap.data());
  } catch (error) {
    console.warn(`Error fetching revision "${id}":`, error);
    return fallbackRevisions.find((r) => r.id === id) || null;
  }
}
