import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { Report, ReportStatus } from '../types';
import { validateReport } from '../lib/validation';
import { getDbTimestamp } from '../lib/timestamps';
import { stripUndefined } from '../lib/sanitize';

const REPORTS_COLLECTION = 'reports';

function normalizeReportDoc(id: string, data: any): Report {
  return {
    id: id || data.id,
    articleId: data.articleId || '',
    reporterId: data.reporterId || '',
    reason: data.reason || '',
    description: data.description || '',
    status: (data.status as ReportStatus) || 'pending',
    createdAt: data.createdAt || new Date().toISOString(),
    reviewedAt: data.reviewedAt || undefined,
    reviewedBy: data.reviewedBy || undefined,
  };
}

/**
 * Creates a moderation report in Firestore.
 */
export async function createReport(
  reportData: Omit<Report, 'id'>
): Promise<{ id: string; success: boolean; errors?: Record<string, string> }> {
  const validation = validateReport(reportData);
  if (!validation.isValid) {
    return { id: '', success: false, errors: validation.errors };
  }

  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firestore is not configured.');
  }

  const reportsRef = collection(db, REPORTS_COLLECTION);
  const newDocRef = doc(reportsRef);
  const now = getDbTimestamp();

  const payload: Report = {
    ...reportData,
    id: newDocRef.id,
    status: reportData.status || 'pending',
    createdAt: now,
  };

  await setDoc(newDocRef, stripUndefined(payload));
  return { id: newDocRef.id, success: true };
}

/**
 * Retrieves reports filtered by status (for moderation queue).
 */
export async function getReportsByStatus(status: ReportStatus = 'pending'): Promise<Report[]> {
  if (!isFirebaseConfigured() || !db) return [];

  try {
    const reportsRef = collection(db, REPORTS_COLLECTION);
    const q = query(
      reportsRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => normalizeReportDoc(d.id, d.data()));
  } catch (error) {
    console.warn(`Error querying reports by status "${status}":`, error);
    return [];
  }
}

/**
 * Retrieves reports for a specific article.
 */
export async function getReportsByArticle(articleId: string): Promise<Report[]> {
  if (!articleId || !isFirebaseConfigured() || !db) return [];

  try {
    const reportsRef = collection(db, REPORTS_COLLECTION);
    const q = query(
      reportsRef,
      where('articleId', '==', articleId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => normalizeReportDoc(d.id, d.data()));
  } catch (error) {
    console.warn(`Error querying reports for article "${articleId}":`, error);
    return [];
  }
}

/**
 * Updates status of a moderation report.
 */
export async function updateReportStatus(
  id: string,
  status: ReportStatus,
  reviewerId: string
): Promise<{ success: boolean }> {
  if (!id || !isFirebaseConfigured() || !db) {
    throw new Error('Report ID and configured Firestore are required.');
  }

  const docRef = doc(db, REPORTS_COLLECTION, id);
  await updateDoc(docRef, {
    status,
    reviewedBy: reviewerId,
    reviewedAt: getDbTimestamp(),
  });

  return { success: true };
}
