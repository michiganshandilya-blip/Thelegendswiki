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
import { Revision } from '../types';
import { validateRevision } from '../lib/validation';
import { getDbTimestamp } from '../lib/timestamps';

const REVISIONS_COLLECTION = 'revisions';

function normalizeRevisionDoc(id: string, data: any): Revision {
  return {
    id: id || data.id,
    articleId: data.articleId || '',
    editorId: data.editorId || '',
    editorName: data.editorName || 'Editor',
    previousContent: data.previousContent || '',
    newContent: data.newContent || '',
    changeSummary: data.changeSummary || '',
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

/**
 * Creates a new revision entry in Firestore.
 */
export async function createRevision(
  revisionData: Omit<Revision, 'id'>
): Promise<{ id: string; success: boolean; errors?: Record<string, string> }> {
  const validation = validateRevision(revisionData);
  if (!validation.isValid) {
    return { id: '', success: false, errors: validation.errors };
  }

  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firestore is not configured.');
  }

  const revisionsRef = collection(db, REVISIONS_COLLECTION);
  const newDocRef = doc(revisionsRef);
  const now = getDbTimestamp();

  const payload: Revision = {
    ...revisionData,
    id: newDocRef.id,
    createdAt: now,
  };

  await setDoc(newDocRef, payload);
  return { id: newDocRef.id, success: true };
}

/**
 * Retrieves the revision history for a given article.
 */
export async function getRevisionsByArticleId(
  articleId: string,
  limitCount: number = 20
): Promise<Revision[]> {
  if (!articleId || !isFirebaseConfigured() || !db) return [];

  try {
    const revisionsRef = collection(db, REVISIONS_COLLECTION);
    const q = query(
      revisionsRef,
      where('articleId', '==', articleId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => normalizeRevisionDoc(d.id, d.data()));
  } catch (error) {
    console.warn(`Error fetching revisions for article "${articleId}":`, error);
    return [];
  }
}

/**
 * Retrieves a single revision by its ID.
 */
export async function getRevisionById(id: string): Promise<Revision | null> {
  if (!id || !isFirebaseConfigured() || !db) return null;

  try {
    const docRef = doc(db, REVISIONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    return normalizeRevisionDoc(docSnap.id, docSnap.data());
  } catch (error) {
    console.warn(`Error fetching revision "${id}":`, error);
    return null;
  }
}
