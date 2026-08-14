import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { Bookmark } from '../types';
import { validateBookmark } from '../lib/validation';
import { getDbTimestamp } from '../lib/timestamps';

const BOOKMARKS_COLLECTION = 'bookmarks';

function getBookmarkDocId(userId: string, articleId: string): string {
  return `${userId}_${articleId}`;
}

/**
 * Adds an article to a user's bookmarks.
 */
export async function addBookmark(
  userId: string, 
  articleId: string
): Promise<{ success: boolean; errors?: Record<string, string> }> {
  const validation = validateBookmark({ userId, articleId });
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  if (!isFirebaseConfigured() || !db) {
    // Local fallback for unconfigured offline state
    return { success: true };
  }

  const docId = getBookmarkDocId(userId, articleId);
  const docRef = doc(db, BOOKMARKS_COLLECTION, docId);
  const now = getDbTimestamp();

  await setDoc(docRef, {
    userId,
    articleId,
    createdAt: now,
  });

  return { success: true };
}

/**
 * Removes an article from a user's bookmarks.
 */
export async function removeBookmark(userId: string, articleId: string): Promise<boolean> {
  if (!userId || !articleId || !isFirebaseConfigured() || !db) return true;

  try {
    const docId = getBookmarkDocId(userId, articleId);
    const docRef = doc(db, BOOKMARKS_COLLECTION, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.warn('Error removing bookmark:', error);
    return false;
  }
}

/**
 * Retrieves all bookmarks for a specific user.
 */
export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  if (!userId || !isFirebaseConfigured() || !db) return [];

  try {
    const bookmarksRef = collection(db, BOOKMARKS_COLLECTION);
    const q = query(bookmarksRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      userId: d.data().userId,
      articleId: d.data().articleId,
      createdAt: d.data().createdAt,
    }));
  } catch (error) {
    console.warn(`Error fetching bookmarks for user "${userId}":`, error);
    return [];
  }
}

/**
 * Checks if a specific article is bookmarked by a user.
 */
export async function isArticleBookmarked(userId: string, articleId: string): Promise<boolean> {
  if (!userId || !articleId || !isFirebaseConfigured() || !db) return false;

  try {
    const docId = getBookmarkDocId(userId, articleId);
    const docRef = doc(db, BOOKMARKS_COLLECTION, docId);
    const snapshot = await getDocs(query(collection(db, BOOKMARKS_COLLECTION), where('userId', '==', userId), where('articleId', '==', articleId)));
    return !snapshot.empty;
  } catch {
    return false;
  }
}
