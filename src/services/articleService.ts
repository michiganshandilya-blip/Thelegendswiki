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
  increment,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, getAuthBearerToken } from '../lib/firebase';
import { Article, ArticleStatus } from '../types';
import { validateArticle, generateSlugFromTitle } from '../lib/validation';
import { sanitizeArticlePayload, stripUndefined } from '../lib/sanitize';
import { getDbTimestamp, formatTimestamp } from '../lib/timestamps';
import { DEMO_ARTICLES } from '../data/demoData';
import { recordAuditRevision } from './revisionService';
import { logAuditEvent } from './auditService';
import { withTimeout } from '../lib/asyncUtils';
import { clearAllDraftBackupsForArticle, recordPublishedArticleIdentity, isKnownPublishedIdentity } from '../lib/draftStorage';
import { getSystemSettings } from './settingsService';
import { DESIGNATED_SUPER_ADMIN_EMAIL } from './userService';
import { validateFallbackImageSize } from './storageService';

/**
 * Resolves current actor's operational privileges from Auth and Firestore.
 */
export async function resolveActorPermissions(explicitActor?: { uid?: string; email?: string; role?: string }): Promise<{ isSuperAdmin: boolean; isAdmin: boolean; isEditor: boolean }> {
  const email = (explicitActor?.email || auth?.currentUser?.email || '').toLowerCase();
  const uid = explicitActor?.uid || auth?.currentUser?.uid;
  const role = explicitActor?.role;

  if (email === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase() || role === 'super_admin') {
    return { isSuperAdmin: true, isAdmin: true, isEditor: true };
  }

  if (role === 'admin' || role === 'editor' || role === 'administrator') {
    return { isSuperAdmin: false, isAdmin: true, isEditor: true };
  }

  if (uid && isFirebaseConfigured() && db) {
    try {
      const userSnap = await withTimeout(getDoc(doc(db, 'users', uid)), 2000, null);
      if (userSnap && userSnap.exists()) {
        const uRole = userSnap.data()?.role;
        const isSuper = uRole === 'super_admin' || email === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase();
        const isAdm = isSuper || uRole === 'admin' || uRole === 'editor' || uRole === 'administrator';
        return { isSuperAdmin: isSuper, isAdmin: isAdm, isEditor: isAdm };
      }
    } catch {
      // safe fallback
    }
  }

  return { isSuperAdmin: false, isAdmin: false, isEditor: false };
}

const ARTICLES_COLLECTION = 'articles';
const FIRESTORE_TIMEOUT_MS = 3500;

const LOCAL_DELETED_ARTICLES_KEY = 'thelegendswiki:deleted_articles';
const LOCAL_ARTICLE_OVERRIDES_KEY = 'thelegendswiki:article_overrides';

function cleanSlugHelper(rawSlug: string): string {
  if (!rawSlug) return '';
  return decodeURIComponent(rawSlug)
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Returns set of deleted article IDs / slugs stored in persistent localStorage.
 */
export function getLocalDeletedIds(): Set<string> {
  const set = new Set<string>();
  if (typeof window === 'undefined' || !window.localStorage) return set;
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_ARTICLES_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item) {
            const clean = String(item).toLowerCase().trim();
            set.add(clean);
            const slugClean = cleanSlugHelper(clean);
            if (slugClean) set.add(slugClean);
          }
        }
      }
    }
  } catch (e) {
    // Ignore storage parse errors
  }
  return set;
}

/**
 * Adds an article ID or slug to the persistent deleted set.
 */
export function saveLocalDeletedId(...idsOrSlugs: (string | undefined | null)[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const set = getLocalDeletedIds();
    for (const item of idsOrSlugs) {
      if (item) {
        const clean = String(item).toLowerCase().trim();
        set.add(clean);
        const norm = cleanSlugHelper(clean);
        if (norm) set.add(norm);
      }
    }
    localStorage.setItem(LOCAL_DELETED_ARTICLES_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    // Ignore storage write errors
  }
}

/**
 * Removes an article ID or slug from the persistent deleted set.
 */
export function removeLocalDeletedId(...idsOrSlugs: (string | undefined | null)[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_ARTICLES_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    const toRemove = new Set<string>();
    for (const item of idsOrSlugs) {
      if (item) {
        const clean = String(item).toLowerCase().trim();
        toRemove.add(clean);
        const norm = cleanSlugHelper(clean);
        if (norm) toRemove.add(norm);
      }
    }
    const updated = arr.filter((id) => !toRemove.has(String(id).toLowerCase().trim()));
    localStorage.setItem(LOCAL_DELETED_ARTICLES_KEY, JSON.stringify(updated));
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Checks if an article is marked as deleted in tombstones.
 * CRITICAL IMMUNITY: Published and in-review articles must NEVER be suppressed by a deleted draft tombstone.
 */
export function isArticleDeleted(article: { id?: string; slug?: string; title?: string; status?: string } | string | null | undefined): boolean {
  if (!article) return false;
  const deletedSet = getLocalDeletedIds();
  if (deletedSet.size === 0) return false;

  if (typeof article === 'string') {
    const clean = article.toLowerCase().trim();
    const norm = cleanSlugHelper(clean);
    if (
      isArticlePublished(clean) ||
      (norm && isArticlePublished(norm)) ||
      isKnownPublishedIdentity(clean) ||
      (norm && isKnownPublishedIdentity(norm))
    ) {
      return false;
    }
    return deletedSet.has(clean) || deletedSet.has(norm);
  }

  // Published articles are never suppressed by draft slug/title tombstones
  if (article.status === 'published' || article.status === 'pending_review') {
    const idClean = (article.id || '').toLowerCase().trim();
    return idClean !== '' && deletedSet.has(idClean);
  }

  const idClean = (article.id || '').toLowerCase().trim();
  const slugClean = (article.slug || '').toLowerCase().trim();
  const normSlug = cleanSlugHelper(article.slug || '');
  const titleNorm = cleanSlugHelper(article.title || '');

  return (
    (idClean !== '' && deletedSet.has(idClean)) ||
    (slugClean !== '' && deletedSet.has(slugClean)) ||
    (normSlug !== '' && deletedSet.has(normSlug)) ||
    (titleNorm !== '' && deletedSet.has(titleNorm))
  );
}

/**
 * Checks synchronously whether an article ID or slug belongs to an already published article.
 */
export function isArticlePublished(idOrSlug?: string | null): boolean {
  if (!idOrSlug) return false;
  const clean = String(idOrSlug).trim().toLowerCase();
  const norm = cleanSlugHelper(clean);

  // Check known published identity registry
  if (isKnownPublishedIdentity(clean) || (norm && isKnownPublishedIdentity(norm))) {
    return true;
  }

  const inDynamic = dynamicArticlesState.some(
    (a) =>
      a.status === 'published' &&
      ((a.id || '').toLowerCase() === clean ||
        (a.slug || '').toLowerCase() === clean ||
        cleanSlugHelper(a.slug || '') === norm)
  );
  if (inDynamic) return true;

  const inDemo = DEMO_ARTICLES.some(
    (a) =>
      (a.id || '').toLowerCase() === clean ||
      (a.slug || '').toLowerCase() === clean ||
      cleanSlugHelper(a.slug || '') === norm
  );
  return inDemo;
}

/**
 * Checks asynchronously (including querying Firestore if needed) whether an article ID or slug belongs to a published article.
 */
export async function isArticlePublishedAsync(idOrSlug?: string | null): Promise<boolean> {
  if (!idOrSlug) return false;
  if (isArticlePublished(idOrSlug)) return true;

  const clean = String(idOrSlug).trim().toLowerCase();
  const norm = cleanSlugHelper(clean);

  if (isFirebaseConfigured() && db) {
    try {
      const candidates = [clean, norm].filter(Boolean);
      for (const cand of candidates) {
        const docRef = doc(db, ARTICLES_COLLECTION, cand);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.status === 'published' || data?.status === 'pending_review') {
            recordPublishedArticleIdentity(docSnap.id, data?.slug);
            return true;
          }
        }
      }

      // Check by slug query
      const q = query(
        collection(db, ARTICLES_COLLECTION),
        where('slug', 'in', [clean, norm].filter(Boolean)),
        where('status', 'in', ['published', 'pending_review'])
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        for (const d of snap.docs) {
          recordPublishedArticleIdentity(d.id, d.data()?.slug);
        }
        return true;
      }
    } catch {
      // fallback to synchronous check result
    }
  }

  return false;
}

/**
 * Gets all locally persisted article overrides (e.g. status changes, review notes).
 */
export function getLocalArticleOverrides(): Map<string, Partial<Article>> {
  const map = new Map<string, Partial<Article>>();
  if (typeof window === 'undefined' || !window.localStorage) return map;
  try {
    const raw = localStorage.getItem(LOCAL_ARTICLE_OVERRIDES_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj)) {
          if (k && v && typeof v === 'object') {
            map.set(k.toLowerCase().trim(), v as Partial<Article>);
            const norm = cleanSlugHelper(k);
            if (norm) map.set(norm, v as Partial<Article>);
          }
        }
      }
    }
  } catch (e) {
    // Ignore storage parse errors
  }
  return map;
}

const LOCAL_SAVED_DRAFTS_KEY = 'thelegendswiki:saved_drafts_v1';

/**
 * Retrieves all saved local drafts from localStorage.
 */
export function getLocalDrafts(): Article[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(LOCAL_SAVED_DRAFTS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr.filter((a) => a && typeof a === 'object' && a.id);
      }
    }
  } catch (e) {
    // Ignore storage parse errors
  }
  return [];
}

/**
 * Saves or updates a draft article in persistent localStorage.
 * STRICT ENFORCEMENT: Only articles with status === 'draft' can be stored as local drafts.
 */
export function saveLocalDraft(draft: Article) {
  if (typeof window === 'undefined' || !window.localStorage || !draft || !draft.id) return;
  // SAFETY: If the article is published or submitted, it is NOT a draft!
  if (draft.status !== 'draft') {
    removeLocalDraft(draft.id, draft.slug);
    return;
  }
  try {
    const drafts = getLocalDrafts();
    const cleanDraft = applyLocalOverrides(draft);
    const updated = [cleanDraft, ...drafts.filter((d) => d.id !== cleanDraft.id && d.slug !== cleanDraft.slug)];
    localStorage.setItem(LOCAL_SAVED_DRAFTS_KEY, JSON.stringify(updated.slice(0, 50)));
  } catch (e) {
    // Ignore storage write errors
  }
}

/**
 * Removes a draft article from persistent localStorage.
 */
export function removeLocalDraft(articleId: string, slug?: string) {
  if (typeof window === 'undefined' || !window.localStorage || !articleId) return;
  try {
    const drafts = getLocalDrafts().filter(
      (d) => d.id !== articleId && d.slug !== articleId && (!slug || (d.id !== slug && d.slug !== slug))
    );
    localStorage.setItem(LOCAL_SAVED_DRAFTS_KEY, JSON.stringify(drafts));
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Persists an article update/status override to localStorage.
 */
export function saveLocalArticleOverride(key: string, updates: Partial<Article>) {
  if (typeof window === 'undefined' || !window.localStorage || !key) return;
  try {
    const raw = localStorage.getItem(LOCAL_ARTICLE_OVERRIDES_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    const cleanKey = key.toLowerCase().trim();
    obj[cleanKey] = { ...(obj[cleanKey] || {}), ...updates };
    const normKey = cleanSlugHelper(key);
    if (normKey) {
      obj[normKey] = { ...(obj[normKey] || {}), ...updates };
    }
    localStorage.setItem(LOCAL_ARTICLE_OVERRIDES_KEY, JSON.stringify(obj));
  } catch (e) {
    // Ignore storage write errors
  }
}

/**
 * Applies local status and metadata overrides to an article if any exist.
 */
function applyLocalOverrides(article: Article): Article {
  if (!article) return article;
  const overridesMap = getLocalArticleOverrides();
  const idKey = (article.id || '').toLowerCase().trim();
  const slugKey = (article.slug || '').toLowerCase().trim();
  const normKey = cleanSlugHelper(article.slug || '');

  const override = overridesMap.get(idKey) || overridesMap.get(slugKey) || overridesMap.get(normKey);
  if (override) {
    // If the article is published live in backend, do not let a stale local draft override revert its published status
    if (article.status === 'published' && override.status === 'draft') {
      const { status, ...restOverride } = override;
      return { ...article, ...restOverride };
    }
    return { ...article, ...override };
  }
  return article;
}

// Baseline encyclopedia articles formatted with proper statuses and fallback assets
const BASELINE_DEMO_ARTICLES: Article[] = DEMO_ARTICLES.map((a) => ({
  ...a,
  status: (a.status || 'published') as ArticleStatus,
  featuredImage: a.featuredImage || a.image || '',
  image: a.featuredImage || a.image || '',
  citations: a.citations || a.references || [],
  references: a.references || a.citations || [],
}));

/**
 * Merges Firestore articles with baseline encyclopedia articles.
 * Ensures non-deleted baseline articles remain available while Firestore articles take precedence.
 */
function mergeWithBaselineArticles(firestoreList: Article[]): Article[] {
  const existingIds = new Set(firestoreList.map((a) => (a.id || '').toLowerCase().trim()));
  const existingSlugs = new Set(firestoreList.map((a) => (a.slug || '').toLowerCase().trim()));

  const nonConflictingDemo = BASELINE_DEMO_ARTICLES.filter((demo) => {
    if (isArticleDeleted(demo)) return false;
    const dId = (demo.id || '').toLowerCase().trim();
    const dSlug = (demo.slug || '').toLowerCase().trim();
    return !existingIds.has(dId) && !existingSlugs.has(dSlug);
  });

  return [...firestoreList, ...nonConflictingDemo];
}

// Initial template articles: combines local drafts and baseline demo articles
const INITIAL_DYNAMIC_ARTICLES: Article[] = [
  ...getLocalDrafts(),
  ...BASELINE_DEMO_ARTICLES,
];

// In-memory dynamic state, filtered and overlaid with persistent state
let dynamicArticlesState: Article[] = INITIAL_DYNAMIC_ARTICLES
  .filter((a) => !isArticleDeleted(a))
  .map((a) => applyLocalOverrides(a));

/**
 * Safely parses any Firestore timestamp representation or Date to standard ISO string.
 */
function formatTimestampToIso(val: any, fallback?: string): string {
  if (!val) return fallback || new Date().toISOString();
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && 'toDate' in val && typeof val.toDate === 'function') {
    return val.toDate().toISOString();
  }
  if (typeof val === 'object' && 'seconds' in val) {
    return new Date(val.seconds * 1000).toISOString();
  }
  if (typeof val === 'number') {
    const ms = val > 1e11 ? val : val * 1000;
    return new Date(ms).toISOString();
  }
  return fallback || new Date().toISOString();
}

/**
 * Normalizes Firestore document into an Article object with backward compatible fallbacks.
 */
function normalizeArticleDoc(id: string, data: any): Article {
  const lastUpdatedFormatted = formatTimestamp(data.updatedAt || data.lastUpdated || data.createdAt);
  const docId = (id || data.id || '').trim();
  const cleanTitle = (data.title || '').trim();
  const rawSlug = (data.slug || '').trim();
  const safeSlug =
    rawSlug ||
    (cleanTitle ? generateSlugFromTitle(cleanTitle) : '') ||
    docId.replace(/^art-/, '') ||
    docId ||
    `entry-${Date.now()}`;

  return {
    id: docId,
    title: cleanTitle,
    slug: safeSlug,
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
    createdAt: formatTimestampToIso(data.createdAt),
    updatedAt: formatTimestampToIso(data.updatedAt || data.lastUpdated || data.createdAt),
    lastUpdated: lastUpdatedFormatted,
    status: (data.status as ArticleStatus) || 'published',
    moderationNotes: data.moderationNotes || undefined,
    reviewedBy: data.reviewedBy || undefined,
    reviewedById: data.reviewedById || undefined,
    reviewedAt: data.reviewedAt || undefined,
    submittedAt: data.submittedAt || undefined,
    viewCount: typeof data.viewCount === 'number' ? data.viewCount : (data.views || 0),
    views: typeof data.views === 'number' ? data.views : (data.viewCount || 0),
    featured: Boolean(data.featured),
    popular: Boolean(data.popular),
    isBehindCurtains: Boolean(data.isBehindCurtains || data.curtainLayer === 'behind_curtains'),
    curtainLayer: data.curtainLayer || (data.isBehindCurtains ? 'behind_curtains' : 'visible'),
    knowledgeDepth: data.knowledgeDepth || 'Documented Fact',
    behindCurtainsContext: data.behindCurtainsContext || undefined,
    relatedCategories: data.relatedCategories || [],
    relatedCategorySlugs: data.relatedCategorySlugs || [],
    readingTimeMinutes: data.readingTimeMinutes || 5,
    relatedArticleSlugs: data.relatedArticleSlugs || [],
  };
}

/**
 * Real-time subscription to articles in Firestore with optional status, category, and curtain filtering.
 */
export function subscribeToArticles(
  callback: (articles: Article[]) => void,
  options?: {
    category?: string;
    categorySlug?: string;
    curtainLayer?: 'visible' | 'behind_curtains';
    isBehindCurtains?: boolean;
    limitCount?: number;
    status?: ArticleStatus | 'all';
    includeAllStatuses?: boolean;
  },
  onError?: (error: any) => void
): () => void {
  const effectiveLimit = options?.limitCount || 200;

  const filterAndSort = (list: Article[]) => {
    return list
      .filter((a) => !isArticleDeleted(a))
      .map((a) => applyLocalOverrides(a))
      .filter((a) => {
        if (!options?.includeAllStatuses && options?.status !== 'all') {
          const targetStatus = options?.status || 'published';
          if (a.status !== targetStatus) return false;
        }

        if (options?.categorySlug && options.categorySlug !== 'all') {
          const catClean = options.categorySlug.toLowerCase();
          const matchesCat =
            (a.categorySlug && a.categorySlug.toLowerCase() === catClean) ||
            (a.category && a.category.toLowerCase().includes(catClean)) ||
            (Array.isArray(a.categories) && a.categories.some((c) => c && c.toLowerCase() === catClean));
          if (!matchesCat) return false;
        }

        if (options?.curtainLayer) {
          if (options.curtainLayer === 'behind_curtains' && !a.isBehindCurtains && a.curtainLayer !== 'behind_curtains') {
            return false;
          }
          if (options.curtainLayer === 'visible' && (a.isBehindCurtains || a.curtainLayer === 'behind_curtains')) {
            return false;
          }
        }

        if (options?.isBehindCurtains !== undefined) {
          if (Boolean(a.isBehindCurtains) !== options.isBehindCurtains) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, effectiveLimit);
  };

  // Immediate emit from dynamic memory if available
  const initial = filterAndSort(dynamicArticlesState);
  if (initial.length > 0) {
    try {
      callback(initial);
    } catch (e) {
      console.warn('[articleService] Initial emit warning:', e);
    }
  }

  if (!isFirebaseConfigured() || !db) {
    return () => {};
  }

  try {
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    const q = query(articlesRef, limit(250));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreList = snapshot.docs.map((docSnap) =>
          normalizeArticleDoc(docSnap.id, docSnap.data())
        );

        // Keep dynamic memory state synchronized with both Firestore and baseline articles
        const mergedList = mergeWithBaselineArticles(firestoreList);
        dynamicArticlesState = [...mergedList];

        const filtered = filterAndSort(mergedList);
        callback(filtered);
      },
      (error) => {
        console.warn('[articleService] onSnapshot articles error:', error?.message || error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('[articleService] Error creating onSnapshot for articles:', err);
    return () => {};
  }
}

/**
 * Retrieves all published articles with optional category filtering, curtain layer filtering, and limit.
 */
export async function getPublishedArticles(options?: {
  category?: string;
  categorySlug?: string;
  curtainLayer?: 'visible' | 'behind_curtains';
  isBehindCurtains?: boolean;
  limitCount?: number;
  status?: ArticleStatus | 'all';
  includeAllStatuses?: boolean;
}): Promise<Article[]> {
  const effectiveLimit = options?.limitCount || 50;

  const filterList = (list: Article[]) => {
    return list
      .filter((a) => !isArticleDeleted(a))
      .map((a) => applyLocalOverrides(a))
      .filter((a) => {
        if (!options?.includeAllStatuses && options?.status !== 'all') {
          const targetStatus = options?.status || 'published';
          if (a.status !== targetStatus) return false;
        }

        if (options?.categorySlug && options.categorySlug !== 'all') {
          const catClean = options.categorySlug.toLowerCase();
          const matchesCat = 
            (a.categorySlug && a.categorySlug.toLowerCase() === catClean) ||
            (a.category && a.category.toLowerCase().includes(catClean)) ||
            (a.categories && a.categories.some((c) => c.toLowerCase() === catClean));
          if (!matchesCat) return false;
        }

        if (options?.curtainLayer) {
          if (options.curtainLayer === 'behind_curtains' && !a.isBehindCurtains && a.curtainLayer !== 'behind_curtains') {
            return false;
          }
          if (options.curtainLayer === 'visible' && (a.isBehindCurtains || a.curtainLayer === 'behind_curtains')) {
            return false;
          }
        }

        if (options?.isBehindCurtains !== undefined) {
          if (Boolean(a.isBehindCurtains) !== options.isBehindCurtains) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
  };

  const localFallback = filterList(dynamicArticlesState).slice(0, effectiveLimit);

  if (!isFirebaseConfigured() || !db) {
    return localFallback;
  }

  try {
    const fetchFn = async () => {
      const articlesRef = collection(db, ARTICLES_COLLECTION);
      const q = query(articlesRef, limit(250));

      const snapshot = await getDocs(q);
      const rawList = snapshot.docs.map((docSnap) => normalizeArticleDoc(docSnap.id, docSnap.data()));
      const merged = mergeWithBaselineArticles(rawList);
      dynamicArticlesState = [...merged];

      const list = merged
        .filter((a) => !isArticleDeleted(a))
        .map((a) => applyLocalOverrides(a));

      // Merge local drafts if published
      const idSet = new Set(list.map((a) => a.id));
      const slugSet = new Set(list.map((a) => a.slug));
      for (const d of getLocalDrafts()) {
        if (!isArticleDeleted(d)) {
          const applied = applyLocalOverrides(d);
          if (applied.status === 'published' && !idSet.has(applied.id) && (!applied.slug || !slugSet.has(applied.slug))) {
            list.push(applied);
          }
        }
      }

      return filterList(list).slice(0, effectiveLimit);
    };

    return await withTimeout(fetchFn(), FIRESTORE_TIMEOUT_MS, localFallback);
  } catch (error) {
    console.warn('Error fetching published articles from Firestore, using local fallback:', error);
    return localFallback;
  }
}

/**
 * Retrieves articles for editorial moderation with search and status filtering.
 */
export async function getAllArticlesForModeration(options?: {
  status?: ArticleStatus | 'all';
  searchQuery?: string;
}): Promise<Article[]> {
  const filterList = (list: Article[]): Article[] => {
    let filtered = list
      .filter((a) => !isArticleDeleted(a))
      .map((a) => applyLocalOverrides(a));

    if (options?.status && options.status !== 'all') {
      filtered = filtered.filter((a) => a.status === options.status);
    }
    if (options?.searchQuery?.trim()) {
      const sq = options.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(sq) ||
          a.summary.toLowerCase().includes(sq) ||
          a.category.toLowerCase().includes(sq) ||
          a.author.toLowerCase().includes(sq) ||
          (a.tags && a.tags.some((t) => t.toLowerCase().includes(sq)))
      );
    }
    return filtered;
  };

  const localFallback = filterList(dynamicArticlesState);

  if (!isFirebaseConfigured() || !db) {
    return localFallback;
  }

  try {
    const fetchFn = async () => {
      const articlesRef = collection(db, ARTICLES_COLLECTION);
      const q = query(articlesRef, limit(200));

      const snapshot = await getDocs(q);
      const list = snapshot.docs
        .map((docSnap) => normalizeArticleDoc(docSnap.id, docSnap.data()))
        .filter((a) => !isArticleDeleted(a))
        .map((a) => applyLocalOverrides(a));

      // Create a lookup of remote IDs and slugs
      const remoteIds = new Set<string>();
      const remoteSlugs = new Set<string>();
      for (const a of list) {
        if (a.id) remoteIds.add(a.id);
        if (a.slug) remoteSlugs.add(a.slug);
      }

      // Merge dynamic in-memory items only from local user drafts, never hardcoded demo data
      for (const d of getLocalDrafts()) {
        if (!isArticleDeleted(d)) {
          const applied = applyLocalOverrides(d);
          if (!remoteIds.has(applied.id) && (!applied.slug || !remoteSlugs.has(applied.slug))) {
            list.push(applied);
          }
        }
      }

      return filterList(list);
    };

    return await withTimeout(fetchFn(), FIRESTORE_TIMEOUT_MS, localFallback);
  } catch (error) {
    console.warn('Error fetching moderation articles from Firestore, using fallback:', error);
    return localFallback;
  }
}

/**
 * Retrieves a single published article by its unique slug with multi-layer fallback.
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!slug || isArticleDeleted(slug)) return null;

  const rawDecoded = decodeURIComponent(slug).trim();
  const normalizedSlug = cleanSlugHelper(rawDecoded);
  const lowerSlug = rawDecoded.toLowerCase();

  const findInList = (list: Article[]): Article | null => {
    for (const a of list) {
      if (!a || isArticleDeleted(a)) continue;
      const applied = applyLocalOverrides(a);
      const aSlug = (applied.slug || '').toLowerCase().trim();
      const aId = (applied.id || '').toLowerCase().trim();
      const aNormSlug = cleanSlugHelper(applied.slug || '');
      const aNormTitle = cleanSlugHelper(applied.title || '');

      if (
        aSlug === lowerSlug ||
        aSlug === normalizedSlug ||
        (normalizedSlug && aNormSlug === normalizedSlug) ||
        aId === lowerSlug ||
        aId === `art-${normalizedSlug}` ||
        aId.replace(/^art-/, '') === lowerSlug ||
        (normalizedSlug && aNormTitle === normalizedSlug)
      ) {
        return applied;
      }
    }
    return null;
  };

  // 1. Try Firestore lookup
  if (isFirebaseConfigured() && db) {
    try {
      const articlesRef = collection(db, ARTICLES_COLLECTION);

      // Strategy A: Query by slug (prioritize published/review over draft)
      if (normalizedSlug) {
        const q1 = query(articlesRef, where('slug', '==', normalizedSlug), limit(5));
        const snap1 = await getDocs(q1);
        if (!snap1.empty) {
          const docs = snap1.docs.map((d) => normalizeArticleDoc(d.id, d.data()));
          const best = docs.find((d) => (d.status === 'published' || d.status === 'pending_review') && !isArticleDeleted(d)) || docs.find((d) => !isArticleDeleted(d));
          if (best) return applyLocalOverrides(best);
        }
      }

      // Strategy B: Query by rawDecoded slug
      if (rawDecoded && rawDecoded !== normalizedSlug) {
        const q2 = query(articlesRef, where('slug', '==', rawDecoded), limit(5));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          const docs = snap2.docs.map((d) => normalizeArticleDoc(d.id, d.data()));
          const best = docs.find((d) => (d.status === 'published' || d.status === 'pending_review') && !isArticleDeleted(d)) || docs.find((d) => !isArticleDeleted(d));
          if (best) return applyLocalOverrides(best);
        }
      }

      // Strategy C: Direct doc reference lookups
      const docCandidates = [
        rawDecoded,
        normalizedSlug,
        rawDecoded.startsWith('art-') ? rawDecoded : `art-${rawDecoded}`,
        normalizedSlug ? `art-${normalizedSlug}` : '',
        rawDecoded.replace(/^art-/, ''),
      ].filter(Boolean);

      for (const cand of docCandidates) {
        const directRef = doc(db, ARTICLES_COLLECTION, cand);
        const directSnap = await getDoc(directRef);
        if (directSnap.exists()) {
          const art = normalizeArticleDoc(directSnap.id, directSnap.data());
          if (!isArticleDeleted(art)) return applyLocalOverrides(art);
        }
      }
    } catch (firestoreError) {
      console.warn(`Firestore lookup error for slug "${slug}", checking local fallback:`, firestoreError);
    }
  }

  // 2. Search dynamic in-memory articles & persistent local drafts
  const localMatch = findInList(dynamicArticlesState) || findInList(getLocalDrafts());
  if (localMatch && !isArticleDeleted(localMatch)) {
    return applyLocalOverrides(localMatch);
  }

  // 3. Fallback to baseline encyclopedia articles
  const demoMatch = findInList(BASELINE_DEMO_ARTICLES) || findInList(DEMO_ARTICLES);
  if (demoMatch && !isArticleDeleted(demoMatch)) {
    return applyLocalOverrides(demoMatch);
  }

  return null;
}

/**
 * Retrieves a single article by its Firestore document ID.
 */
export async function getArticleById(id: string): Promise<Article | null> {
  if (!id || isArticleDeleted(id)) return null;

  if (isFirebaseConfigured() && db) {
    try {
      const candidates = [id, `art-${id}`, id.replace(/^art-/, '')].filter(Boolean);
      for (const cand of candidates) {
        const docRef = doc(db, ARTICLES_COLLECTION, cand);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const art = normalizeArticleDoc(docSnap.id, docSnap.data());
          if (!isArticleDeleted(art)) return applyLocalOverrides(art);
        }
      }
    } catch (error) {
      console.warn(`Error querying article by id "${id}":`, error);
    }
  }

  const localMatch =
    dynamicArticlesState.find(
      (a) => !isArticleDeleted(a) && (a.id === id || a.slug === id || a.id === `art-${id}` || a.id.replace(/^art-/, '') === id)
    ) ||
    getLocalDrafts().find(
      (a) => !isArticleDeleted(a) && (a.id === id || a.slug === id || a.id === `art-${id}` || a.id.replace(/^art-/, '') === id)
    );

  if (localMatch) {
    return applyLocalOverrides(localMatch);
  }

  const clean = cleanSlugHelper(id);
  const found =
    BASELINE_DEMO_ARTICLES.find(
      (a) => !isArticleDeleted(a) && (a.id === id || a.slug === id || cleanSlugHelper(a.slug) === clean)
    ) ||
    DEMO_ARTICLES.find(
      (a) => !isArticleDeleted(a) && (a.id === id || a.slug === id || cleanSlugHelper(a.slug) === clean)
    );
  if (found) {
    return applyLocalOverrides(normalizeArticleDoc(found.id, { ...found, status: found.status || 'published' }));
  }

  return null;
}

/**
 * Retrieves an article by either slug or document ID, across all statuses.
 */
export async function getArticleBySlugOrId(identifier: string): Promise<Article | null> {
  if (!identifier) return null;
  const bySlug = await getArticleBySlug(identifier);
  if (bySlug) return bySlug;
  return await getArticleById(identifier);
}

/**
 * Creates a new article in Firestore.
 */
export async function createArticle(
  articleData: Omit<Article, 'id'>,
  actorInfo?: { uid?: string; email?: string; role?: string }
): Promise<{ id: string; success: boolean; errors?: Record<string, string>; error?: string }> {
  const settings = await getSystemSettings();
  const cleanData = sanitizeArticlePayload(articleData) as Omit<Article, 'id'>;
  const actor = await resolveActorPermissions(actorInfo || {
    uid: cleanData.authorId,
    email: auth?.currentUser?.email || undefined,
  });

  // 1. Enforce Platform Maintenance Mode (restricted exclusively to Super Admins)
  if (settings.maintenanceMode && !actor.isSuperAdmin) {
    return {
      id: '',
      success: false,
      error: 'Platform Maintenance Mode is active. Article creation and authoring are currently frozen and restricted exclusively to Super Admins.',
    };
  }

  // 2. Enforce Allow Public User Submissions
  if (!settings.allowPublicSubmissions && !actor.isAdmin) {
    if (cleanData.status !== 'draft') {
      return {
        id: '',
        success: false,
        error: 'Public user submissions are currently paused by platform governance.',
      };
    }
  }

  // 3. Enforce Require Editorial Peer Review
  if (settings.requirePeerReview && !actor.isAdmin && cleanData.status === 'published') {
    cleanData.status = 'pending_review';
  }

  const isDraft = cleanData.status === 'draft';
  const targetTitle = (cleanData.title || '').trim() || (isDraft ? 'Untitled Draft' : '');
  const generatedId = (cleanData as any).id
    ? (cleanData as any).id
    : isDraft
    ? `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    : `art-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const targetSlug =
    (cleanData.slug || '').trim() ||
    generateSlugFromTitle(targetTitle) ||
    generatedId.replace(/^(art-|draft-)/, '') ||
    generatedId;

  const fullData: Omit<Article, 'id'> = {
    ...cleanData,
    title: targetTitle,
    slug: targetSlug,
    status: cleanData.status || 'draft',
  };

  // 4. Enforce Automated Link & Spam Detection (controlled by autoFlagSpam)
  const validation = validateArticle(fullData, { checkSpam: settings.autoFlagSpam });
  if (!validation.isValid) {
    return { id: '', success: false, errors: validation.errors };
  }

  // 5. Enforce safe image fallback size limits to protect Firestore 1MB document limit
  const featCheck = validateFallbackImageSize(fullData.featuredImage || fullData.image);
  if (!featCheck.isValid) {
    return { id: '', success: false, error: featCheck.error };
  }
  if (Array.isArray(fullData.sections)) {
    for (let i = 0; i < fullData.sections.length; i++) {
      const figUrl = fullData.sections[i]?.figure?.url;
      if (figUrl) {
        const figCheck = validateFallbackImageSize(figUrl);
        if (!figCheck.isValid) {
          return { id: '', success: false, error: `Section ${i + 1} ${figCheck.error}` };
        }
      }
    }
  }

  const nowIso = new Date().toISOString();
  const dbTimestamp = getDbTimestamp();

  const payload: Article = {
    ...fullData,
    id: generatedId,
    slug: targetSlug,
    status: fullData.status || 'draft',
    viewCount: fullData.viewCount || 0,
    views: fullData.views || 0,
    createdAt: nowIso,
    updatedAt: nowIso,
    lastUpdated: 'Just now',
  };

  // Add to dynamic session state and persistent local drafts
  dynamicArticlesState = [payload, ...dynamicArticlesState.filter((a) => a.id !== generatedId)];
  if (payload.status === 'draft') {
    saveLocalDraft(payload);
  } else {
    recordPublishedArticleIdentity(generatedId, targetSlug);
    removeLocalDraft(generatedId, targetSlug);
    clearAllDraftBackupsForArticle(payload.authorId || 'anonymous', generatedId, targetSlug, 'new');
  }
  removeLocalDeletedId(generatedId, targetSlug, payload.title);

  // Record audit revision
  try {
    await recordAuditRevision({
      articleId: generatedId,
      articleTitle: payload.title,
      articleSlug: payload.slug,
      editorId: payload.authorId || 'contributor',
      editorName: payload.author,
      actionType: payload.status === 'pending_review' ? 'submission' : 'draft_saved',
      changeSummary: payload.status === 'pending_review' 
        ? 'Initial submission for editorial peer review' 
        : 'Initial article draft created',
      newContent: typeof payload.content === 'string' ? payload.content : JSON.stringify(payload.sections),
    });
  } catch (revErr) {
    console.warn('Draft revision logging notice:', revErr);
  }

  if (!isFirebaseConfigured() || !db) {
    return { id: generatedId, success: true };
  }

  try {
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    const newDocRef = doc(articlesRef, generatedId);
    const firestorePayload = {
      ...payload,
      createdAt: dbTimestamp,
      updatedAt: dbTimestamp,
    };
    await withTimeout(
      setDoc(newDocRef, stripUndefined(firestorePayload), { merge: true }),
      FIRESTORE_TIMEOUT_MS,
      undefined
    );
    return { id: generatedId, success: true };
  } catch (err: any) {
    console.warn('Direct Firestore article create encounter notice, attempting server backend fallback:', err);
    try {
      const token = await getAuthBearerToken();
      const resp = await fetch('/api/articles/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ article: payload, actor: actorInfo }),
      });
      if (resp.ok) {
        const resData = await resp.json();
        if (resData.success) {
          return { id: generatedId, success: true };
        }
      }
    } catch (fallbackErr) {
      console.warn('Backend fallback article save notice:', fallbackErr);
    }

    // If both direct and server write failed, keep local draft intact
    if (payload.status === 'draft') {
      return { id: generatedId, success: true };
    }
    return { id: generatedId, success: false, error: err.message || 'Failed to save draft to database.' };
  }
}

/**
 * Updates an existing article in Firestore with merge safety.
 */
export async function updateArticle(
  id: string,
  articleData: Partial<Article>,
  actorInfo?: { uid?: string; email?: string; role?: string }
): Promise<{ success: boolean; errors?: Record<string, string>; error?: string }> {
  if (!id) throw new Error('Article ID is required for update.');

  const settings = await getSystemSettings();
  const actor = await resolveActorPermissions(actorInfo);

  // 1. Enforce Platform Maintenance Mode (restricted exclusively to Super Admins)
  if (settings.maintenanceMode && !actor.isSuperAdmin) {
    return {
      success: false,
      error: 'Platform Maintenance Mode is active. Article modifications and revisions are currently frozen and restricted exclusively to Super Admins.',
    };
  }

  const cleanData = sanitizeArticlePayload(articleData);

  // 2. Enforce Allow Public User Submissions
  if (!settings.allowPublicSubmissions && !actor.isAdmin) {
    if (cleanData.status === 'pending_review' || cleanData.status === 'published') {
      return {
        success: false,
        error: 'Public user submissions are currently paused by platform governance.',
      };
    }
  }

  // 3. Enforce Require Editorial Peer Review
  if (settings.requirePeerReview && !actor.isAdmin && cleanData.status === 'published') {
    cleanData.status = 'pending_review';
  }

  // 4. Enforce Automated Link & Spam Detection when submitting or modifying published
  if (cleanData.status === 'pending_review' || cleanData.status === 'published') {
    let existingArt =
      dynamicArticlesState.find((a) => a.id === id || a.slug === id) ||
      DEMO_ARTICLES.find((a) => a.id === id || a.slug === id);
    if (!existingArt) {
      existingArt = (await getArticleById(id)) || (await getArticleBySlug(id)) || undefined;
    }
    const merged = { ...(existingArt || {}), ...cleanData };
    const validation = validateArticle(merged, { checkSpam: settings.autoFlagSpam });
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }
  }

  // Enforce safe image fallback size limits to protect Firestore 1MB document limit
  const featCheck = validateFallbackImageSize(cleanData.featuredImage || cleanData.image);
  if (!featCheck.isValid) {
    return { success: false, error: featCheck.error };
  }
  if (Array.isArray(cleanData.sections)) {
    for (let i = 0; i < cleanData.sections.length; i++) {
      const figUrl = cleanData.sections[i]?.figure?.url;
      if (figUrl) {
        const figCheck = validateFallbackImageSize(figUrl);
        if (!figCheck.isValid) {
          return { success: false, error: `Section ${i + 1} ${figCheck.error}` };
        }
      }
    }
  }

  const nowIso = new Date().toISOString();
  const dbTimestamp = getDbTimestamp();

  // Update in memory dynamic state
  let existing = dynamicArticlesState.find((a) => a.id === id || a.slug === id);
  if (!existing) {
    existing = DEMO_ARTICLES.find((a) => a.id === id || a.slug === id);
  }

  const fallbackBase: Article = {
    id,
    title: '',
    slug: '',
    summary: '',
    authorId: '',
    author: 'Contributor',
    category: 'General',
    categorySlug: 'general',
    status: 'draft',
    createdAt: nowIso,
    updatedAt: nowIso,
    lastUpdated: 'Just now',
    views: 0,
    readingTimeMinutes: 2,
    relatedArticleSlugs: [],
    sections: [],
    tags: [],
    citations: [],
    references: [],
  };

  const targetSlug =
    (cleanData.slug || '').trim() ||
    (existing?.slug || '').trim() ||
    generateSlugFromTitle(cleanData.title || existing?.title || '') ||
    (id || '').replace(/^art-/, '') ||
    id;

  const updatedArticle: Article = {
    ...(existing || fallbackBase),
    ...cleanData,
    id: existing?.id || id,
    slug: targetSlug,
    updatedAt: nowIso,
    lastUpdated: 'Just now',
  };

  const idx = dynamicArticlesState.findIndex((a) => a.id === id || a.slug === id || a.id === updatedArticle.id);
  if (idx >= 0) {
    dynamicArticlesState[idx] = updatedArticle;
  } else {
    dynamicArticlesState.unshift(updatedArticle);
  }

  if (updatedArticle.status === 'draft') {
    saveLocalDraft(updatedArticle);
  } else {
    recordPublishedArticleIdentity(id, targetSlug);
    recordPublishedArticleIdentity(updatedArticle.id, updatedArticle.slug);
    removeLocalDraft(id, targetSlug);
    removeLocalDraft(updatedArticle.id, updatedArticle.slug);
    const authorUid = actorInfo?.uid || updatedArticle.authorId || 'anonymous';
    clearAllDraftBackupsForArticle(authorUid, id, targetSlug, updatedArticle.id, updatedArticle.slug, 'new');
  }
  removeLocalDeletedId(id, targetSlug, updatedArticle.title);
  saveLocalArticleOverride(id, updatedArticle);
  if (updatedArticle.slug) {
    saveLocalArticleOverride(updatedArticle.slug, updatedArticle);
  }

  if (!isFirebaseConfigured() || !db) {
    return { success: true };
  }

  try {
    const docRef = doc(db, ARTICLES_COLLECTION, id);
    const firestorePayload = {
      ...cleanData,
      id: updatedArticle.id,
      slug: targetSlug,
      updatedAt: dbTimestamp,
    };
    await withTimeout(
      setDoc(docRef, stripUndefined(firestorePayload), { merge: true }),
      FIRESTORE_TIMEOUT_MS,
      undefined
    );
    return { success: true };
  } catch (error: any) {
    console.warn('Direct Firestore article update encounter notice, attempting server backend fallback:', error);
    try {
      const token = await getAuthBearerToken();
      const resp = await fetch('/api/articles/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ article: updatedArticle, actor: actorInfo }),
      });
      if (resp.ok) {
        const resData = await resp.json();
        if (resData.success) {
          return { success: true };
        }
      }
    } catch (fallbackErr) {
      console.warn('Backend fallback article update notice:', fallbackErr);
    }

    if (updatedArticle.status === 'draft') {
      return { success: true };
    }
    return { success: false, error: error.message || 'Failed to update draft in database.' };
  }
}

/**
 * Submits an article for editorial peer review.
 */
export async function submitArticleForReview(
  articleId: string,
  authorId: string,
  authorName: string,
  changeSummary: string = 'Submitted draft for editorial peer review',
  actorInfo?: { uid?: string; email?: string; role?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getSystemSettings();
    const actor = await resolveActorPermissions(actorInfo || { uid: authorId });

    // 1. Enforce Platform Maintenance Mode
    if (settings.maintenanceMode && !actor.isSuperAdmin) {
      return {
        success: false,
        error: 'Platform Maintenance Mode is active. Submissions are currently frozen and restricted exclusively to Super Admins.',
      };
    }

    // 2. Enforce Allow Public User Submissions
    if (!settings.allowPublicSubmissions && !actor.isAdmin) {
      return {
        success: false,
        error: 'Public user submissions are currently paused by platform governance.',
      };
    }

    const article = await getArticleById(articleId);
    if (!article) return { success: false, error: 'Article not found' };

    const updatePayload: Partial<Article> = {
      status: 'pending_review',
      submittedAt: new Date().toISOString(),
    };

    const updateRes = await updateArticle(articleId, updatePayload, actorInfo || { uid: authorId });
    if (!updateRes.success) {
      return {
        success: false,
        error: updateRes.error || (updateRes.errors ? Object.values(updateRes.errors)[0] : 'Failed to submit article.'),
      };
    }

    await recordAuditRevision({
      articleId,
      articleTitle: article.title,
      articleSlug: article.slug,
      editorId: authorId,
      editorName: authorName,
      actionType: 'submission',
      changeSummary,
      newContent: typeof article.content === 'string' ? article.content : JSON.stringify(article.sections),
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error submitting article for review:', err);
    return { success: false, error: err.message || 'Failed to submit article.' };
  }
}

/**
 * Editorial action: Approves a pending article and marks it as Published.
 * Persists status: "published" in Firestore and logs in audit system.
 */
export async function approveArticle(
  articleId: string,
  reviewerId: string,
  reviewerName: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const article = await getArticleById(articleId);
    if (!article) return { success: false, error: 'Article not found.' };

    const targetId = article.id || articleId;
    const targetSlug = article.slug || articleId;

    if (article.status === 'published') {
      return { success: true };
    }

    const now = new Date().toISOString();
    const updatePayload: Partial<Article> = {
      status: 'published',
      reviewedBy: reviewerName,
      reviewedById: reviewerId,
      reviewedAt: now,
      moderationNotes: notes || 'Approved by editorial board.',
      updatedAt: now,
      lastUpdated: 'Just now',
    };

    // Save persistent local overrides
    saveLocalArticleOverride(targetId, updatePayload);
    saveLocalArticleOverride(targetSlug, updatePayload);
    if (articleId !== targetId) {
      saveLocalArticleOverride(articleId, updatePayload);
    }

    // Update in memory dynamic state
    let matched = false;
    dynamicArticlesState = dynamicArticlesState.map((a) => {
      if (a.id === articleId || a.slug === articleId || a.id === targetId || a.slug === targetSlug) {
        matched = true;
        return {
          ...a,
          ...updatePayload,
          status: 'published',
        };
      }
      return a;
    });

    if (!matched) {
      dynamicArticlesState.unshift({
        ...article,
        ...updatePayload,
        status: 'published',
      });
    }

    // Persist to Firestore with setDoc merge
    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, ARTICLES_COLLECTION, targetId);
        await setDoc(
          docRef,
          stripUndefined({
            ...article,
            ...updatePayload,
            status: 'published',
            updatedAt: getDbTimestamp(),
          }),
          { merge: true }
        );
        if (articleId !== targetId) {
          const altRef = doc(db, ARTICLES_COLLECTION, articleId);
          await setDoc(altRef, stripUndefined({ ...article, ...updatePayload, status: 'published' }), { merge: true });
        }
        if (targetSlug) {
          try {
            const slugQuery = query(collection(db, ARTICLES_COLLECTION), where('slug', '==', targetSlug));
            const slugSnap = await getDocs(slugQuery);
            for (const sDoc of slugSnap.docs) {
              if (sDoc.id !== targetId && sDoc.id !== articleId) {
                await setDoc(sDoc.ref, stripUndefined({ ...updatePayload, status: 'published' }), { merge: true });
              }
            }
          } catch (sqErr) {
            // Ignore sub-query error
          }
        }
      } catch (fErr) {
        console.warn('Firestore approval write notice:', fErr);
      }
    }

    // Record audit revision
    try {
      await recordAuditRevision({
        articleId: targetId,
        articleTitle: article.title,
        articleSlug: article.slug,
        editorId: reviewerId,
        editorName: reviewerName,
        actionType: 'approval',
        changeSummary: `Article approved and published by ${reviewerName}`,
        moderationNotes: notes,
        newContent: typeof article.content === 'string' ? article.content : JSON.stringify(article.sections),
      });
    } catch (rErr) {
      console.warn('Revision log notice:', rErr);
    }

    // Record system audit log
    try {
      await logAuditEvent({
        actorUid: reviewerId,
        actorEmail: reviewerName,
        actorRole: 'admin',
        action: 'Contribution Approved',
        targetId: targetId,
        targetTitle: article.title,
        targetType: 'article',
        details: `Submission "${article.title}" approved and published to the public encyclopedia by ${reviewerName}.`,
        metadata: { articleSlug: article.slug, moderationNotes: notes },
      });
    } catch (aErr) {
      console.warn('Audit event log notice:', aErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error approving article:', err);
    return { success: false, error: err.message || 'Failed to approve article.' };
  }
}

/**
 * Editorial action: Requests revisions/changes from the contributor with detailed feedback.
 */
export async function requestChangesOnArticle(
  articleId: string,
  reviewerId: string,
  reviewerName: string,
  feedbackNotes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const article = await getArticleById(articleId);
    if (!article) return { success: false, error: 'Article not found.' };

    const targetId = article.id || articleId;
    const targetSlug = article.slug || articleId;
    const cleanNotes = (feedbackNotes && feedbackNotes.trim().length >= 3)
      ? feedbackNotes.trim()
      : 'Please revise submission to incorporate scholarly references and verify claims.';

    const now = new Date().toISOString();
    const updatePayload: Partial<Article> = {
      status: 'changes_requested',
      reviewedBy: reviewerName,
      reviewedById: reviewerId,
      reviewedAt: now,
      moderationNotes: cleanNotes,
      updatedAt: now,
      lastUpdated: 'Just now',
    };

    // Update in memory
    let matched = false;
    dynamicArticlesState = dynamicArticlesState.map((a) => {
      if (a.id === articleId || a.slug === articleId || a.id === targetId || a.slug === targetSlug) {
        matched = true;
        return {
          ...a,
          ...updatePayload,
          status: 'changes_requested',
        };
      }
      return a;
    });

    if (!matched) {
      dynamicArticlesState.unshift({
        ...article,
        ...updatePayload,
        status: 'changes_requested',
      });
    }

    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, ARTICLES_COLLECTION, targetId);
        await setDoc(
          docRef,
          stripUndefined({
            ...article,
            ...updatePayload,
            status: 'changes_requested',
            updatedAt: getDbTimestamp(),
          }),
          { merge: true }
        );
        if (articleId !== targetId) {
          const altRef = doc(db, ARTICLES_COLLECTION, articleId);
          await setDoc(altRef, stripUndefined({ ...article, ...updatePayload, status: 'changes_requested' }), { merge: true });
        }
      } catch (fErr) {
        console.warn('Firestore changes request notice:', fErr);
      }
    }

    try {
      await recordAuditRevision({
        articleId: targetId,
        articleTitle: article.title,
        articleSlug: article.slug,
        editorId: reviewerId,
        editorName: reviewerName,
        actionType: 'changes_requested',
        changeSummary: `Changes requested by ${reviewerName}`,
        moderationNotes: cleanNotes,
        newContent: typeof article.content === 'string' ? article.content : JSON.stringify(article.sections),
      });
    } catch (rErr) {
      console.warn('Revision log notice:', rErr);
    }

    try {
      await logAuditEvent({
        actorUid: reviewerId,
        actorEmail: reviewerName,
        actorRole: 'admin',
        action: 'Article Changes Requested',
        targetId: targetId,
        targetTitle: article.title,
        targetType: 'article',
        details: `Changes requested for "${article.title}" by ${reviewerName}: "${cleanNotes}"`,
        metadata: { articleSlug: article.slug, feedbackNotes: cleanNotes },
      });
    } catch (aErr) {
      console.warn('Audit event log notice:', aErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error requesting changes:', err);
    return { success: false, error: err.message || 'Failed to request changes.' };
  }
}

/**
 * Editorial action: Rejects/Cancels an article submission with rationale.
 * Persists status: "rejected" in Firestore and logs in audit system.
 */
export async function rejectArticle(
  articleId: string,
  reviewerId: string,
  reviewerName: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const article = await getArticleById(articleId);
    if (!article) return { success: false, error: 'Article not found.' };

    const targetId = article.id || articleId;
    const targetSlug = article.slug || articleId;
    const cleanReason = (reason && reason.trim().length >= 3)
      ? reason.trim()
      : 'Submission does not meet encyclopedia verification or citation standards.';

    const now = new Date().toISOString();
    const updatePayload: Partial<Article> = {
      status: 'rejected',
      reviewedBy: reviewerName,
      reviewedById: reviewerId,
      reviewedAt: now,
      moderationNotes: cleanReason,
      updatedAt: now,
      lastUpdated: 'Just now',
    };

    // Save persistent local overrides
    saveLocalArticleOverride(targetId, updatePayload);
    saveLocalArticleOverride(targetSlug, updatePayload);
    if (articleId !== targetId) {
      saveLocalArticleOverride(articleId, updatePayload);
    }

    // Update in memory dynamic state
    let matched = false;
    dynamicArticlesState = dynamicArticlesState.map((a) => {
      if (a.id === articleId || a.slug === articleId || a.id === targetId || a.slug === targetSlug) {
        matched = true;
        return {
          ...a,
          ...updatePayload,
          status: 'rejected',
        };
      }
      return a;
    });

    if (!matched) {
      dynamicArticlesState.unshift({
        ...article,
        ...updatePayload,
        status: 'rejected',
      });
    }

    // Persist to Firestore with setDoc merge
    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, ARTICLES_COLLECTION, targetId);
        await setDoc(
          docRef,
          stripUndefined({
            ...article,
            ...updatePayload,
            status: 'rejected',
            updatedAt: getDbTimestamp(),
          }),
          { merge: true }
        );
        if (articleId !== targetId) {
          const altRef = doc(db, ARTICLES_COLLECTION, articleId);
          await setDoc(altRef, stripUndefined({ ...article, ...updatePayload, status: 'rejected' }), { merge: true });
        }
        if (targetSlug) {
          try {
            const slugQuery = query(collection(db, ARTICLES_COLLECTION), where('slug', '==', targetSlug));
            const slugSnap = await getDocs(slugQuery);
            for (const sDoc of slugSnap.docs) {
              if (sDoc.id !== targetId && sDoc.id !== articleId) {
                await setDoc(sDoc.ref, stripUndefined({ ...updatePayload, status: 'rejected' }), { merge: true });
              }
            }
          } catch (sqErr) {
            // Ignore sub-query error
          }
        }
      } catch (fErr) {
        console.warn('Firestore rejection write notice:', fErr);
      }
    }

    // Record revision safely
    try {
      await recordAuditRevision({
        articleId: targetId,
        articleTitle: article.title,
        articleSlug: article.slug,
        editorId: reviewerId,
        editorName: reviewerName,
        actionType: 'rejection',
        changeSummary: `Submission rejected by ${reviewerName}`,
        moderationNotes: cleanReason,
        newContent: typeof article.content === 'string' ? article.content : JSON.stringify(article.sections),
      });
    } catch (rErr) {
      console.warn('Revision log notice:', rErr);
    }

    // Record audit log safely
    try {
      await logAuditEvent({
        actorUid: reviewerId,
        actorEmail: reviewerName,
        actorRole: 'admin',
        action: 'Contribution Rejected',
        targetId: targetId,
        targetTitle: article.title,
        targetType: 'article',
        details: `Submission "${article.title}" rejected by ${reviewerName}. Rationale: "${cleanReason}"`,
        metadata: { articleSlug: article.slug, rejectionReason: cleanReason },
      });
    } catch (aErr) {
      console.warn('Audit event log notice:', aErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error rejecting article:', err);
    return { success: false, error: err.message || 'Failed to reject article.' };
  }
}

export const cancelArticle = rejectArticle;

/**
 * Deletes a draft article with ownership verification, Firestore deletion,
 * and comprehensive cleanup of local recovery caches and auto-save state.
 */
export async function deleteDraft(
  draftIdOrSlug: string,
  userAuth: { uid: string; email?: string; role?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!draftIdOrSlug) return { success: false, error: 'Draft identifier is required.' };
  if (!userAuth || !userAuth.uid) {
    return { success: false, error: 'Authentication required to delete drafts.' };
  }

  const settings = await getSystemSettings();
  const actorPerms = await resolveActorPermissions(userAuth);
  if (settings.maintenanceMode && !actorPerms.isSuperAdmin) {
    return {
      success: false,
      error: 'Platform Maintenance Mode is active. Draft deletion is frozen and restricted exclusively to Super Admins.',
    };
  }

  // 0. ABSOLUTE GUARD: If identifier belongs to any known published article, REFUSE immediately!
  if (isKnownPublishedIdentity(draftIdOrSlug) || isArticlePublished(draftIdOrSlug)) {
    return {
      success: false,
      error: 'Protected: Identifier matches a published encyclopedia article. Operation aborted to preserve published content.',
    };
  }

  // 1. Fetch draft to verify existence, status, and ownership
  const article = (await getArticleById(draftIdOrSlug)) || (await getArticleBySlug(draftIdOrSlug));

  // CRITICAL SAFETY GUARD: deleteDraft must NEVER delete a published or submitted article!
  if (article) {
    if (article.status === 'published') {
      recordPublishedArticleIdentity(article.id, article.slug);
      return {
        success: false,
        error: 'Protected: Cannot delete a published article using deleteDraft. Published articles must remain intact in the encyclopedia.',
      };
    }
    if (article.status === 'pending_review') {
      return {
        success: false,
        error: 'Protected: Cannot delete an article currently pending editorial review.',
      };
    }
    if (article.status !== 'draft') {
      return {
        success: false,
        error: 'Protected: Only drafts can be deleted via deleteDraft.',
      };
    }
  }

  // Cross-check in-memory dynamic state and demo articles
  const publishedMatch =
    dynamicArticlesState.find(
      (a) => (a.id === draftIdOrSlug || a.slug === draftIdOrSlug) && a.status === 'published'
    ) ||
    DEMO_ARTICLES.find(
      (a) => (a.id === draftIdOrSlug || a.slug === draftIdOrSlug) && a.status === 'published'
    );
  if (publishedMatch) {
    recordPublishedArticleIdentity(publishedMatch.id, publishedMatch.slug);
    return {
      success: false,
      error: 'Protected: Identifier matches a published encyclopedia article. Operation aborted to preserve published content.',
    };
  }

  const targetId = article?.id || draftIdOrSlug;
  const targetSlug = article?.slug || draftIdOrSlug;
  const title = article?.title || draftIdOrSlug;

  const isOwner = article
    ? article.authorId === userAuth.uid ||
      article.authorId === 'anonymous' ||
      !article.authorId ||
      (!!article.authorEmail && !!userAuth.email && article.authorEmail.toLowerCase() === userAuth.email.toLowerCase())
    : true;
  const isAdminUser =
    actorPerms.isAdmin ||
    actorPerms.isSuperAdmin ||
    actorPerms.isEditor ||
    userAuth.role === 'admin' ||
    userAuth.role === 'super_admin' ||
    userAuth.role === 'editor' ||
    (!!userAuth.email && userAuth.email.toLowerCase() === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase());

  if (article && !isOwner && !isAdminUser) {
    return { success: false, error: 'Permission denied. You can only delete your own drafts.' };
  }

  // 2. Perform Firestore deletion if configured - ONLY IF verified draft
  if (isFirebaseConfigured() && db) {
    try {
      if (auth?.currentUser) {
        const docRef = doc(db, ARTICLES_COLLECTION, targetId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const docData = docSnap.data();
          if (docData?.status !== 'draft') {
            recordPublishedArticleIdentity(targetId, docData?.slug);
            return {
              success: false,
              error: 'Protected: Cloud document is not in draft status. Cannot be deleted via deleteDraft.',
            };
          }
          await deleteDoc(docRef);
        }

        if (draftIdOrSlug !== targetId) {
          try {
            const altRef = doc(db, ARTICLES_COLLECTION, draftIdOrSlug);
            const altSnap = await getDoc(altRef);
            if (altSnap.exists() && altSnap.data()?.status === 'draft') {
              await deleteDoc(altRef);
            }
          } catch {
            // ignore secondary id error
          }
        }

        // Secondary cleanup by slug ONLY if document status is draft
        if (targetSlug && targetSlug !== targetId) {
          try {
            const slugQuery = query(
              collection(db, ARTICLES_COLLECTION),
              where('slug', '==', targetSlug),
              where('status', '==', 'draft')
            );
            const slugSnap = await getDocs(slugQuery);
            for (const sDoc of slugSnap.docs) {
              await deleteDoc(sDoc.ref);
            }
          } catch {
            // ignore sub-query error
          }
        }
      }
    } catch (err: any) {
      console.warn('Notice while deleting draft from Firestore:', err);
      const isPermIssue =
        err?.code === 'permission-denied' ||
        (err?.message && err.message.toLowerCase().includes('permission'));
      if (!isPermIssue) {
        return { success: false, error: err.message || 'Failed to delete draft from cloud database.' };
      }
    }
  }

  // 3. Clear local recovery backups, drafts, and caches for this draft only
  clearAllDraftBackupsForArticle(userAuth.uid, targetId, draftIdOrSlug);
  removeLocalDraft(targetId, targetSlug);
  removeLocalDraft(draftIdOrSlug);

  // CRITICAL: ONLY tombstone targetId if it is explicitly a draft ID (e.g. draft-*)
  if (targetId && (targetId.startsWith('draft-') || targetId.startsWith('art-draft-'))) {
    saveLocalDeletedId(targetId);
  }

  // Remove ONLY drafts from dynamic in-memory articles; preserve published articles
  dynamicArticlesState = dynamicArticlesState.filter((a) => {
    const isMatch =
      a.id === draftIdOrSlug ||
      a.slug === draftIdOrSlug ||
      a.id === targetId ||
      (targetSlug && targetSlug !== targetId && a.slug === targetSlug);
    if (isMatch && a.status !== 'draft') {
      return true; // Keep published & review articles 100% intact!
    }
    return !isMatch;
  });

  // Record audit log if user info available
  if (userAuth.email) {
    try {
      await logAuditEvent({
        actorUid: userAuth.uid,
        actorEmail: userAuth.email,
        actorRole: userAuth.role || 'user',
        action: 'Draft Deleted',
        targetId: targetId,
        targetTitle: title,
        targetType: 'article',
        details: `Draft "${title}" deleted by ${userAuth.email}.`,
        metadata: { articleId: targetId, slug: targetSlug },
      });
    } catch (aErr) {
      console.warn('Audit log notice on draft delete:', aErr);
    }
  }

  return { success: true };
}

/**
 * Editorial action: Permanently deletes/removes an article from database.
 */
export async function deleteArticle(
  articleId: string,
  actor?: { uid: string; email: string; role: string }
): Promise<{ success: boolean; error?: string }> {
  if (!articleId) return { success: false, error: 'Article ID required.' };

  const settings = await getSystemSettings();
  const actorPerms = await resolveActorPermissions(actor);
  if (settings.maintenanceMode && !actorPerms.isSuperAdmin) {
    return {
      success: false,
      error: 'Platform Maintenance Mode is active. Article deletion is frozen and restricted exclusively to Super Admins.',
    };
  }

  const article = await getArticleById(articleId);
  const targetId = article?.id || articleId;
  const targetSlug = article?.slug || articleId;
  const title = article?.title || articleId;

  // Persist deletion tombstone
  saveLocalDeletedId(targetId, targetSlug, articleId, cleanSlugHelper(targetSlug));

  // Clear local backups and storage
  if (actor?.uid) {
    clearAllDraftBackupsForArticle(actor.uid, targetId, targetSlug, articleId);
  }
  clearAllDraftBackupsForArticle('anonymous', targetId, targetSlug, articleId);

  // Remove from local persistent drafts
  removeLocalDraft(targetId, targetSlug);
  removeLocalDraft(articleId);

  // Remove from in-memory state
  dynamicArticlesState = dynamicArticlesState.filter(
    (a) => a.id !== articleId && a.slug !== articleId && a.id !== targetId && a.slug !== targetSlug
  );

  let clientDeleteSucceeded = false;
  let clientError: any = null;

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, ARTICLES_COLLECTION, targetId);
      await deleteDoc(docRef);
      if (articleId !== targetId) {
        try {
          const altRef = doc(db, ARTICLES_COLLECTION, articleId);
          await deleteDoc(altRef);
        } catch {
          // ignore secondary id error
        }
      }
      if (targetSlug) {
        try {
          const slugQuery = query(collection(db, ARTICLES_COLLECTION), where('slug', '==', targetSlug));
          const slugSnap = await getDocs(slugQuery);
          for (const sDoc of slugSnap.docs) {
            await deleteDoc(sDoc.ref);
          }
        } catch {
          // Ignore sub-query error
        }
      }
      clientDeleteSucceeded = true;

      // Async sync with server endpoint for audit logging & secondary references
      getAuthBearerToken().then((token) => {
        fetch('/api/articles/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ targetId, articleId, targetSlug, title, actor }),
        }).catch(() => {});
      });
    } catch (err: any) {
      clientError = err;
      console.warn('Direct client delete from Firestore failed, escalating to backend server endpoint:', err);
    }
  }

  // Fallback to server endpoint if direct client delete failed or client db unconfigured
  if (!clientDeleteSucceeded) {
    try {
      const token = await getAuthBearerToken();
      const res = await fetch('/api/articles/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          targetId,
          articleId,
          targetSlug,
          title,
          actor,
        }),
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData.success) {
          clientDeleteSucceeded = true;
        }
      }
    } catch (serverErr) {
      console.warn('Backend API delete failed:', serverErr);
    }
  }

  if (!clientDeleteSucceeded && clientError) {
    console.error('Error deleting article from Firestore:', clientError);
    return { success: false, error: clientError.message || 'Failed to delete article from database.' };
  }

  if (actor) {
    try {
      await logAuditEvent({
        actorUid: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'Article Deleted',
        targetId: targetId,
        targetTitle: title,
        targetType: 'article',
        details: `Dossier "${title}" permanently deleted by ${actor.email}.`,
        metadata: { articleId: targetId, slug: targetSlug },
      });
    } catch (aErr) {
      console.warn('Audit log notice on delete:', aErr);
    }
  }

  return { success: true };
}

/**
 * Retrieves all articles authored by a specific user.
 */
export async function getUserArticles(userId: string): Promise<Article[]> {
  if (!userId) return [];

  const localDrafts = getLocalDrafts().filter((a) => a.authorId === userId);
  const fallbackMap = new Map<string, Article>();

  for (const d of dynamicArticlesState) {
    if (d.authorId === userId && !isArticleDeleted(d)) {
      fallbackMap.set(d.id, applyLocalOverrides(d));
    }
  }
  for (const ld of localDrafts) {
    if (!isArticleDeleted(ld)) {
      fallbackMap.set(ld.id, applyLocalOverrides(ld));
    }
  }
  const fallbackList = Array.from(fallbackMap.values());

  if (!isFirebaseConfigured() || !db) {
    return fallbackList;
  }

  try {
    const fetchFn = async () => {
      const articlesRef = collection(db, ARTICLES_COLLECTION);
      const q = query(articlesRef, where('authorId', '==', userId));
      const snapshot = await getDocs(q);
      const list = snapshot.docs
        .map((docSnap) => normalizeArticleDoc(docSnap.id, docSnap.data()))
        .filter((a) => !isArticleDeleted(a))
        .map((a) => {
          if (a.status === 'published' || a.status === 'pending_review') {
            recordPublishedArticleIdentity(a.id, a.slug);
          }
          return applyLocalOverrides(a);
        });

      // Merge in session and local dynamic articles
      const idSet = new Set(list.map((a) => a.id));
      const slugSet = new Set(list.map((a) => (a.slug || '').toLowerCase().trim()));
      for (const item of fallbackList) {
        if (!idSet.has(item.id) && (!item.slug || !slugSet.has(item.slug.toLowerCase().trim()))) {
          list.push(item);
        }
      }

      return list.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime() || 0;
        const timeB = new Date(b.updatedAt || b.createdAt).getTime() || 0;
        return timeB - timeA;
      });
    };

    return await withTimeout(fetchFn(), FIRESTORE_TIMEOUT_MS, fallbackList);
  } catch (error) {
    console.warn(`Error querying user articles for "${userId}":`, error);
    return fallbackList;
  }
}

/**
 * Retrieves the current collection of published, non-deleted articles.
 */
export function getAvailablePublishedArticles(): Article[] {
  // Check live dynamic state
  const live = dynamicArticlesState
    .filter((a) => !isArticleDeleted(a))
    .map((a) => applyLocalOverrides(a))
    .filter((a) => (a.status || 'published') === 'published');

  if (live.length > 0) {
    return live;
  }

  // If dynamic state is empty and Firebase is not configured, fall back to non-deleted demo articles
  if (!isFirebaseConfigured()) {
    return DEMO_ARTICLES
      .filter((a) => !isArticleDeleted(a))
      .map((a) => applyLocalOverrides(normalizeArticleDoc(a.id, { ...a, status: a.status || 'published' })))
      .filter((a) => a.status === 'published');
  }

  return [];
}

/**
 * Selects a random article slug from current published, non-deleted articles.
 * Returns empty string if no eligible published articles exist.
 */
export function getRandomPublishedArticleSlug(): string {
  const pool = getAvailablePublishedArticles();
  if (pool.length === 0) return '';
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex]?.slug || pool[0]?.slug || '';
}

/**
 * Verifies if a slug is available and unique.
 */
export async function isSlugAvailable(slug: string, currentArticleId?: string): Promise<boolean> {
  const cleanSlug = cleanSlugHelper(slug);
  if (!cleanSlug) return false;

  // 1. Check local dynamic articles state
  const foundLocal = dynamicArticlesState.find(
    (a) => cleanSlugHelper(a.slug) === cleanSlug && a.id !== currentArticleId
  );
  if (foundLocal) return false;

  // 2. Check local persistent drafts
  const foundDraft = getLocalDrafts().find(
    (a) => cleanSlugHelper(a.slug) === cleanSlug && a.id !== currentArticleId
  );
  if (foundDraft) return false;

  // 3. Check demo/seed articles that can still be resolved by the application
  const foundDemo = DEMO_ARTICLES.find(
    (a) =>
      !isArticleDeleted(a) &&
      a.id !== currentArticleId &&
      (cleanSlugHelper(a.slug) === cleanSlug || cleanSlugHelper(a.id) === cleanSlug)
  );
  if (foundDemo) return false;

  if (!isFirebaseConfigured() || !db) {
    return true;
  }

  try {
    const fetchFn = async () => {
      const articlesRef = collection(db, ARTICLES_COLLECTION);
      const q = query(articlesRef, where('slug', '==', cleanSlug), limit(2));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return true;
      if (currentArticleId) {
        return snapshot.docs.every((d) => d.id === currentArticleId);
      }
      return false;
    };

    return await withTimeout(fetchFn(), FIRESTORE_TIMEOUT_MS, true);
  } catch (error) {
    console.warn(`Error checking slug uniqueness for "${cleanSlug}":`, error);
    return true;
  }
}

/**
 * Increments article view count asynchronously without blocking page load.
 */
export async function incrementArticleView(articleId: string, slug?: string): Promise<void> {
  if (!articleId) return;

  const idx = dynamicArticlesState.findIndex((a) => a.id === articleId || a.slug === (slug || articleId));
  if (idx >= 0) {
    dynamicArticlesState[idx].views = (dynamicArticlesState[idx].views || 0) + 1;
    dynamicArticlesState[idx].viewCount = (dynamicArticlesState[idx].viewCount || 0) + 1;
  }

  if (!isFirebaseConfigured() || !db) return;

  try {
    const docRef = doc(db, ARTICLES_COLLECTION, articleId);
    await updateDoc(docRef, {
      viewCount: increment(1),
      views: increment(1),
    });
  } catch {
    // Non-fatal telemetry update
  }
}

export const incrementArticleViewCount = incrementArticleView;

/**
 * Seeds a list of default articles into Firestore if not present.
 */
export async function seedArticles(articlesToSeed: Article[]): Promise<number> {
  if (!isFirebaseConfigured() || !db) return 0;

  let seededCount = 0;
  try {
    for (const art of articlesToSeed) {
      const artRef = doc(db, ARTICLES_COLLECTION, art.id);
      await setDoc(artRef, stripUndefined({
        ...art,
        status: art.status || 'published',
        createdAt: art.createdAt || getDbTimestamp(),
        updatedAt: art.updatedAt || getDbTimestamp(),
      }), { merge: true });
      seededCount++;
    }
  } catch (err) {
    console.warn('Error during article seeding:', err);
  }
  return seededCount;
}

