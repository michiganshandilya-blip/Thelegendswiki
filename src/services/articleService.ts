import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment,
  writeBatch
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { Article } from '../types';
import { validateArticle } from '../lib/validation';
import { getDbTimestamp, formatTimestamp } from '../lib/timestamps';
import { DEMO_ARTICLES } from '../data/demoData';

const ARTICLES_COLLECTION = 'articles';

/**
 * Normalizes Firestore document into an Article object with backward compatible fallbacks.
 */
function normalizeArticleDoc(id: string, data: any): Article {
  const lastUpdatedFormatted = formatTimestamp(data.updatedAt || data.lastUpdated || data.createdAt);

  return {
    id: id || data.id,
    title: data.title || '',
    slug: data.slug || '',
    summary: data.summary || '',
    pronunciation: data.pronunciation || undefined,
    articleType: data.articleType || 'general',
    content: data.content || '',
    featuredImage: data.featuredImage || data.image || '',
    image: data.featuredImage || data.image || '',
    imageCaption: data.imageCaption || '',
    imageCredit: data.imageCredit || '',
    infobox: data.infobox || undefined,
    sections: data.sections || [],
    references: data.references || data.citations || [],
    citations: data.citations || data.references || [],
    categories: data.categories || (data.categorySlug ? [data.categorySlug] : []),
    category: data.category || 'General',
    categorySlug: data.categorySlug || 'general',
    subCategory: data.subCategory || undefined,
    tags: data.tags || [],
    authorId: data.authorId || 'system-editor',
    author: data.author || 'TheLegendsWiki Editorial Desk',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    lastUpdated: lastUpdatedFormatted,
    status: data.status || 'published',
    viewCount: typeof data.viewCount === 'number' ? data.viewCount : (data.views || 0),
    views: typeof data.views === 'number' ? data.views : (data.viewCount || 0),
    featured: Boolean(data.featured),
    popular: Boolean(data.popular),
    readingTimeMinutes: data.readingTimeMinutes || 5,
    relatedArticleSlugs: data.relatedArticleSlugs || [],
  };
}

/**
 * Retrieves all published articles with optional category filtering and limit.
 */
export async function getPublishedArticles(options?: {
  limitCount?: number;
  categorySlug?: string;
}): Promise<Article[]> {
  if (!isFirebaseConfigured() || !db) {
    // Fallback to local demo dataset if Firestore is unconfigured
    let list = DEMO_ARTICLES;
    if (options?.categorySlug && options.categorySlug !== 'all') {
      list = list.filter((a) => a.categorySlug === options.categorySlug);
    }
    if (options?.limitCount) {
      list = list.slice(0, options.limitCount);
    }
    return list;
  }

  try {
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    let q;

    if (options?.categorySlug && options.categorySlug !== 'all') {
      q = query(
        articlesRef,
        where('status', '==', 'published'),
        where('categorySlug', '==', options.categorySlug),
        limit(options.limitCount || 50)
      );
    } else {
      q = query(
        articlesRef,
        where('status', '==', 'published'),
        limit(options?.limitCount || 50)
      );
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      // Return demo data if remote collection is empty
      let list = DEMO_ARTICLES;
      if (options?.categorySlug && options.categorySlug !== 'all') {
        list = list.filter((a) => a.categorySlug === options.categorySlug);
      }
      if (options?.limitCount) {
        list = list.slice(0, options.limitCount);
      }
      return list;
    }

    return snapshot.docs.map((docSnap) => normalizeArticleDoc(docSnap.id, docSnap.data()));
  } catch (error) {
    console.warn('Error querying published articles from Firestore, using fallback:', error);
    let list = DEMO_ARTICLES;
    if (options?.categorySlug && options.categorySlug !== 'all') {
      list = list.filter((a) => a.categorySlug === options.categorySlug);
    }
    return list;
  }
}

/**
 * Retrieves a single published article by its unique slug.
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!slug) return null;

  if (!isFirebaseConfigured() || !db) {
    const demo = DEMO_ARTICLES.find((a) => a.slug === slug);
    return demo || null;
  }

  try {
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    const q = query(
      articlesRef,
      where('slug', '==', slug),
      where('status', '==', 'published'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      // Check demo articles as fallback
      const demo = DEMO_ARTICLES.find((a) => a.slug === slug);
      return demo || null;
    }

    const docSnap = snapshot.docs[0];
    return normalizeArticleDoc(docSnap.id, docSnap.data());
  } catch (error) {
    console.warn(`Error querying article by slug "${slug}", using fallback:`, error);
    const demo = DEMO_ARTICLES.find((a) => a.slug === slug);
    return demo || null;
  }
}

/**
 * Retrieves a single article by its Firestore document ID.
 */
export async function getArticleById(id: string): Promise<Article | null> {
  if (!id) return null;

  if (!isFirebaseConfigured() || !db) {
    const demo = DEMO_ARTICLES.find((a) => a.id === id);
    return demo || null;
  }

  try {
    const docRef = doc(db, ARTICLES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      const demo = DEMO_ARTICLES.find((a) => a.id === id);
      return demo || null;
    }

    return normalizeArticleDoc(docSnap.id, docSnap.data());
  } catch (error) {
    console.warn(`Error querying article by id "${id}":`, error);
    return null;
  }
}

/**
 * Retrieves featured articles.
 */
export async function getFeaturedArticles(limitCount: number = 3): Promise<Article[]> {
  try {
    const all = await getPublishedArticles();
    const featured = all.filter((a) => a.featured);
    return featured.length > 0 ? featured.slice(0, limitCount) : all.slice(0, limitCount);
  } catch (error) {
    console.warn('Error fetching featured articles:', error);
    return DEMO_ARTICLES.filter((a) => a.featured).slice(0, limitCount);
  }
}

/**
 * Retrieves popular articles.
 */
export async function getPopularArticles(limitCount: number = 4): Promise<Article[]> {
  try {
    const all = await getPublishedArticles();
    const popular = all.filter((a) => a.popular);
    return popular.length > 0 ? popular.slice(0, limitCount) : [...all].sort((a, b) => b.views - a.views).slice(0, limitCount);
  } catch (error) {
    console.warn('Error fetching popular articles:', error);
    return DEMO_ARTICLES.filter((a) => a.popular).slice(0, limitCount);
  }
}

/**
 * Retrieves recently updated articles.
 */
export async function getRecentArticles(limitCount: number = 4): Promise<Article[]> {
  try {
    const all = await getPublishedArticles();
    return [...all]
      .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
      .slice(0, limitCount);
  } catch (error) {
    console.warn('Error fetching recent articles:', error);
    return [...DEMO_ARTICLES]
      .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
      .slice(0, limitCount);
  }
}

/**
 * Creates a new article in Firestore with validation.
 */
export async function createArticle(articleData: Omit<Article, 'id'>): Promise<{ id: string; success: boolean; errors?: Record<string, string> }> {
  const validation = validateArticle(articleData);
  if (!validation.isValid) {
    return { id: '', success: false, errors: validation.errors };
  }

  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase Firestore is not initialized.');
  }

  const articlesRef = collection(db, ARTICLES_COLLECTION);
  const newDocRef = doc(articlesRef);
  const now = getDbTimestamp();

  const payload = {
    ...articleData,
    id: newDocRef.id,
    status: articleData.status || 'draft',
    viewCount: articleData.viewCount || 0,
    views: articleData.views || 0,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(newDocRef, payload);
  return { id: newDocRef.id, success: true };
}

/**
 * Updates an existing article in Firestore.
 */
export async function updateArticle(
  id: string,
  articleData: Partial<Article>
): Promise<{ success: boolean; errors?: Record<string, string> }> {
  if (!id) throw new Error('Article ID is required for update.');

  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase Firestore is not initialized.');
  }

  const docRef = doc(db, ARTICLES_COLLECTION, id);
  await updateDoc(docRef, {
    ...articleData,
    updatedAt: getDbTimestamp(),
  });

  return { success: true };
}

/**
 * Retrieves all articles authored by a specific user (drafts, pending_review, published, archived).
 */
export async function getUserArticles(userId: string): Promise<Article[]> {
  if (!userId) return [];

  if (!isFirebaseConfigured() || !db) {
    // If running offline, return demo articles where authorId matches or demo articles as sample
    return DEMO_ARTICLES.filter((a) => a.authorId === userId);
  }

  try {
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    const q = query(
      articlesRef,
      where('authorId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const articles = snapshot.docs.map((docSnap) => normalizeArticleDoc(docSnap.id, docSnap.data()));
    
    // Sort descending by updatedAt or createdAt
    return articles.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime() || 0;
      const timeB = new Date(b.updatedAt || b.createdAt).getTime() || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.warn(`Error querying user articles for "${userId}":`, error);
    return [];
  }
}

/**
 * Verifies if a slug is available and unique across all articles.
 */
export async function isSlugAvailable(slug: string, excludeArticleId?: string): Promise<boolean> {
  if (!slug) return false;

  // Check demo articles
  const demoMatch = DEMO_ARTICLES.find(
    (a) => a.slug === slug && (!excludeArticleId || a.id !== excludeArticleId)
  );
  if (demoMatch) return false;

  if (!isFirebaseConfigured() || !db) {
    return true;
  }

  try {
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    const q = query(articlesRef, where('slug', '==', slug), limit(2));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return true;

    // If matches found, check if it's only the document being edited
    for (const docSnap of snapshot.docs) {
      if (!excludeArticleId || docSnap.id !== excludeArticleId) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.warn('Error checking slug uniqueness in Firestore:', error);
    return true; // Fallback to allowing write if offline check passed
  }
}

/**
 * Retrieves an article by either slug or document ID, regardless of public status.
 * Used by authorized editor/author workspaces.
 */
export async function getArticleBySlugOrId(identifier: string): Promise<Article | null> {
  if (!identifier) return null;

  // First try by ID
  const byId = await getArticleById(identifier);
  if (byId) return byId;

  // If not found by ID, query by slug directly across all statuses
  if (!isFirebaseConfigured() || !db) {
    const demo = DEMO_ARTICLES.find((a) => a.slug === identifier || a.id === identifier);
    return demo || null;
  }

  try {
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    const q = query(articlesRef, where('slug', '==', identifier), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return normalizeArticleDoc(docSnap.id, docSnap.data());
    }

    const demo = DEMO_ARTICLES.find((a) => a.slug === identifier);
    return demo || null;
  } catch (error) {
    console.warn(`Error querying article by identifier "${identifier}":`, error);
    return null;
  }
}

/**
 * Deletes an article document.
 */
export async function deleteArticle(id: string): Promise<{ success: boolean }> {
  if (!id) throw new Error('Article ID is required for deletion.');

  if (!isFirebaseConfigured() || !db) {
    return { success: true };
  }

  const docRef = doc(db, ARTICLES_COLLECTION, id);
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(docRef);

  return { success: true };
}


/**
 * Increments the view count for an article.
 */
export async function incrementArticleViewCount(id: string, slug?: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  try {
    let docId = id;
    if (!docId && slug) {
      const art = await getArticleBySlug(slug);
      if (art) docId = art.id;
    }

    if (docId) {
      const docRef = doc(db, ARTICLES_COLLECTION, docId);
      await updateDoc(docRef, {
        viewCount: increment(1),
        views: increment(1),
      });
    }
  } catch (error) {
    // Non-blocking telemetry
    console.debug('Could not increment article view count:', error);
  }
}

/**
 * Seeds initial demo articles into Firestore in batches.
 */
export async function seedArticles(articles: Article[] = DEMO_ARTICLES): Promise<number> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firestore is not configured.');
  }

  const batch = writeBatch(db);
  let count = 0;

  for (const art of articles) {
    const docRef = doc(db, ARTICLES_COLLECTION, art.id);
    const now = getDbTimestamp();

    batch.set(docRef, {
      ...art,
      status: art.status || 'published',
      viewCount: art.views || art.viewCount || 0,
      createdAt: now,
      updatedAt: now,
    }, { merge: true });

    count++;
  }

  await batch.commit();
  return count;
}
