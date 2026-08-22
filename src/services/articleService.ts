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
  writeBatch
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { Article, ArticleStatus } from '../types';
import { validateArticle } from '../lib/validation';
import { sanitizeArticlePayload, stripUndefined } from '../lib/sanitize';
import { getDbTimestamp, formatTimestamp } from '../lib/timestamps';
import { DEMO_ARTICLES } from '../data/demoData';
import { recordAuditRevision } from './revisionService';
import { logAuditEvent } from './auditService';
import { withTimeout } from '../lib/asyncUtils';

const ARTICLES_COLLECTION = 'articles';
const FIRESTORE_TIMEOUT_MS = 3500;

// In-memory demo drafts & moderation queue items for comprehensive testing
let dynamicArticlesState: Article[] = [
  ...DEMO_ARTICLES.map((a) => ({
    ...a,
    status: (a.status || 'published') as ArticleStatus,
    featuredImage: a.featuredImage || a.image || '',
    image: a.featuredImage || a.image || '',
    citations: a.citations || a.references || [],
    references: a.references || a.citations || [],
  })),
  {
    id: 'art-pending-1',
    title: 'The Great Alchemical Manuscripts of Zosimos',
    slug: 'alchemical-manuscripts-zosimos',
    summary: 'A critical survey of early metallurgical and mystical treatises authored in Hellenistic Egypt during the late 3rd century AD.',
    category: 'Ancient Science & Philosophy',
    categorySlug: 'science',
    subCategory: 'Alchemy & Metallurgy',
    tags: ['alchemy', 'hellenistic', 'manuscripts', 'chemistry'],
    authorId: 'user-scholar-3',
    author: 'Eratosthenes',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastUpdated: 'Recently',
    status: 'pending_review',
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    views: 0,
    viewCount: 0,
    readingTimeMinutes: 4,
    relatedArticleSlugs: ['library-of-alexandria'],
    citations: [
      {
        id: 1,
        title: 'Collection des anciens alchimistes grecs',
        author: 'Berthelot, Marcellin',
        year: '1888',
      }
    ],
    sections: [
      {
        id: 'sec-intro',
        title: 'Introduction and Chronology',
        content: [
          'Zosimos of Panopolis is widely regarded as one of the earliest authentic historical alchemists whose direct treatises have survived through Byzantine anthologies.',
          'His works describe early distillation apparatus, tribikos reflux vessels, and the philosophical framework of chrysopoeia.'
        ],
      }
    ]
  },
  {
    id: 'art-changes-1',
    title: 'Hydraulic Automata of Ctesibius',
    slug: 'hydraulic-automata-ctesibius',
    summary: 'Mechanical innovations in pneumatic water pumps, clepsydra water clocks, and pipe organs developed in 3rd century BC Alexandria.',
    category: 'Engineering & Technology',
    categorySlug: 'technology',
    subCategory: 'Mechanical Engineering',
    tags: ['engineering', 'automata', 'alexandria', 'inventions'],
    authorId: 'user-scholar-4',
    author: 'Claudius Ptolemy',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    lastUpdated: 'Yesterday',
    status: 'changes_requested',
    moderationNotes: 'Please provide at least 2 primary source citations from Vitruvius De Architectura regarding the water organ mechanism before publication.',
    reviewedBy: 'Hypatia of Alexandria',
    reviewedById: 'user-scholar-2',
    reviewedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    views: 12,
    viewCount: 12,
    readingTimeMinutes: 5,
    relatedArticleSlugs: ['antikythera-mechanism'],
    citations: [],
    sections: [
      {
        id: 'sec-organ',
        title: 'The Hydraulis Water Organ',
        content: [
          'The hydraulis was the earliest keyboard musical instrument, utilizing water pressure to maintain a steady air reservoir for bronze pipes.'
        ],
      }
    ]
  }
];

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
 * Retrieves all published articles with optional category filtering, curtain layer filtering, and limit.
 */
export async function getPublishedArticles(options?: {
  category?: string;
  categorySlug?: string;
  curtainLayer?: 'visible' | 'behind_curtains';
  isBehindCurtains?: boolean;
  limitCount?: number;
}): Promise<Article[]> {
  const effectiveLimit = options?.limitCount || 50;

  const filterList = (list: Article[]) => {
    return list.filter((a) => {
      if (a.status && a.status !== 'published') return false;

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
    });
  };

  const localFallback = filterList(dynamicArticlesState).slice(0, effectiveLimit);

  if (!isFirebaseConfigured() || !db) {
    return localFallback;
  }

  try {
    const fetchFn = async () => {
      const articlesRef = collection(db, ARTICLES_COLLECTION);
      let q = query(articlesRef, where('status', '==', 'published'), limit(effectiveLimit));

      if (options?.categorySlug && options.categorySlug !== 'all') {
        q = query(
          articlesRef,
          where('status', '==', 'published'),
          where('categorySlug', '==', options.categorySlug.toLowerCase()),
          limit(effectiveLimit)
        );
      }

      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((docSnap) => normalizeArticleDoc(docSnap.id, docSnap.data()));

      // Merge dynamic articles in session state
      const idSet = new Set(list.map((a) => a.id));
      for (const d of dynamicArticlesState) {
        if (d.status === 'published' && !idSet.has(d.id)) {
          list.push(d);
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
    let filtered = [...list];
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
      const list = snapshot.docs.map((docSnap) => normalizeArticleDoc(docSnap.id, docSnap.data()));

      // Create a lookup of remote IDs and slugs
      const remoteIds = new Set<string>();
      const remoteSlugs = new Set<string>();
      for (const a of list) {
        if (a.id) remoteIds.add(a.id);
        if (a.slug) remoteSlugs.add(a.slug);
      }

      // Merge dynamic in-memory items only if not already represented in remote database
      for (const d of dynamicArticlesState) {
        if (!remoteIds.has(d.id) && (!d.slug || !remoteSlugs.has(d.slug))) {
          list.push(d);
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
  if (!slug) return null;

  const rawDecoded = decodeURIComponent(slug).trim();
  const normalizedSlug = cleanSlugHelper(rawDecoded);
  const lowerSlug = rawDecoded.toLowerCase();

  const findInList = (list: Article[]): Article | null => {
    for (const a of list) {
      if (!a) continue;
      const aSlug = (a.slug || '').toLowerCase().trim();
      const aId = (a.id || '').toLowerCase().trim();
      const aNormSlug = cleanSlugHelper(a.slug || '');
      const aNormTitle = cleanSlugHelper(a.title || '');

      if (
        aSlug === lowerSlug ||
        aSlug === normalizedSlug ||
        aNormSlug === normalizedSlug ||
        aId === lowerSlug ||
        aId === `art-${normalizedSlug}` ||
        aNormTitle === normalizedSlug
      ) {
        return a;
      }
    }
    return null;
  };

  // 1. Try Firestore lookup
  if (isFirebaseConfigured() && db) {
    try {
      const articlesRef = collection(db, ARTICLES_COLLECTION);

      // Strategy A: Query by slug
      const q1 = query(articlesRef, where('slug', '==', normalizedSlug), limit(1));
      const snap1 = await getDocs(q1);
      if (!snap1.empty) {
        return normalizeArticleDoc(snap1.docs[0].id, snap1.docs[0].data());
      }

      // Strategy B: Query by rawDecoded slug
      if (rawDecoded !== normalizedSlug) {
        const q2 = query(articlesRef, where('slug', '==', rawDecoded), limit(1));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          return normalizeArticleDoc(snap2.docs[0].id, snap2.docs[0].data());
        }
      }

      // Strategy C: Direct doc reference lookup
      const directRef = doc(db, ARTICLES_COLLECTION, rawDecoded);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        return normalizeArticleDoc(directSnap.id, directSnap.data());
      }

      const directArtRef = doc(db, ARTICLES_COLLECTION, `art-${normalizedSlug}`);
      const directArtSnap = await getDoc(directArtRef);
      if (directArtSnap.exists()) {
        return normalizeArticleDoc(directArtSnap.id, directArtSnap.data());
      }
    } catch (firestoreError) {
      console.warn(`Firestore lookup error for slug "${slug}", checking local fallback:`, firestoreError);
    }
  }

  // 2. Search dynamic in-memory articles and DEMO_ARTICLES
  const localMatch = findInList(dynamicArticlesState) || findInList(DEMO_ARTICLES);
  return localMatch || null;
}

/**
 * Retrieves a single article by its Firestore document ID.
 */
export async function getArticleById(id: string): Promise<Article | null> {
  if (!id) return null;

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, ARTICLES_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return normalizeArticleDoc(docSnap.id, docSnap.data());
      }
    } catch (error) {
      console.warn(`Error querying article by id "${id}":`, error);
    }
  }

  const clean = cleanSlugHelper(id);
  const found = dynamicArticlesState.find((a) => a.id === id || a.slug === id || cleanSlugHelper(a.slug) === clean) ||
                DEMO_ARTICLES.find((a) => a.id === id || a.slug === id || cleanSlugHelper(a.slug) === clean);
  if (found) {
    return normalizeArticleDoc(found.id, { ...found, status: found.status || 'published' });
  }

  return getArticleBySlug(id);
}

/**
 * Retrieves an article by either slug or document ID, across all statuses.
 */
export async function getArticleBySlugOrId(identifier: string): Promise<Article | null> {
  if (!identifier) return null;
  return getArticleBySlug(identifier) || getArticleById(identifier);
}

/**
 * Creates a new article in Firestore.
 */
export async function createArticle(
  articleData: Omit<Article, 'id'>
): Promise<{ id: string; success: boolean; errors?: Record<string, string> }> {
  const cleanData = sanitizeArticlePayload(articleData) as Omit<Article, 'id'>;

  const validation = validateArticle(cleanData);
  if (!validation.isValid) {
    return { id: '', success: false, errors: validation.errors };
  }

  const generatedId = `art-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = getDbTimestamp();

  const payload: Article = {
    ...cleanData,
    id: generatedId,
    status: cleanData.status || 'draft',
    viewCount: cleanData.viewCount || 0,
    views: cleanData.views || 0,
    createdAt: now,
    updatedAt: now,
    lastUpdated: 'Just now',
  };

  // Add to dynamic session state
  dynamicArticlesState.unshift(payload);

  // Record audit revision
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

  if (!isFirebaseConfigured() || !db) {
    return { id: generatedId, success: true };
  }

  try {
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    const newDocRef = doc(articlesRef, generatedId);
    await setDoc(newDocRef, stripUndefined(payload), { merge: true });
    return { id: generatedId, success: true };
  } catch (err: any) {
    console.warn('Firestore write failed, saved in session memory:', err);
    return { id: generatedId, success: true };
  }
}

/**
 * Updates an existing article in Firestore with merge safety.
 */
export async function updateArticle(
  id: string,
  articleData: Partial<Article>
): Promise<{ success: boolean; errors?: Record<string, string> }> {
  if (!id) throw new Error('Article ID is required for update.');

  const cleanData = sanitizeArticlePayload(articleData);
  const now = new Date().toISOString();

  // Update in memory
  const idx = dynamicArticlesState.findIndex((a) => a.id === id || a.slug === id);
  if (idx >= 0) {
    dynamicArticlesState[idx] = {
      ...dynamicArticlesState[idx],
      ...cleanData,
      updatedAt: now,
      lastUpdated: 'Just now',
    };
  }

  if (!isFirebaseConfigured() || !db) {
    return { success: true };
  }

  try {
    const docRef = doc(db, ARTICLES_COLLECTION, id);
    await setDoc(
      docRef,
      stripUndefined({
        ...cleanData,
        updatedAt: getDbTimestamp(),
      }),
      { merge: true }
    );
    return { success: true };
  } catch (error: any) {
    console.warn('Firestore update error, updated in session state:', error);
    return { success: true };
  }
}

/**
 * Submits an article for editorial peer review.
 */
export async function submitArticleForReview(
  articleId: string,
  authorId: string,
  authorName: string,
  changeSummary: string = 'Submitted draft for editorial peer review'
): Promise<{ success: boolean; error?: string }> {
  try {
    const article = await getArticleById(articleId);
    if (!article) return { success: false, error: 'Article not found' };

    const updatePayload: Partial<Article> = {
      status: 'pending_review',
      submittedAt: new Date().toISOString(),
    };

    await updateArticle(articleId, updatePayload);

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
 * Editorial action: Permanently deletes/removes an article from database.
 */
export async function deleteArticle(
  articleId: string,
  actor?: { uid: string; email: string; role: string }
): Promise<{ success: boolean; error?: string }> {
  if (!articleId) return { success: false, error: 'Article ID required.' };

  const article = await getArticleById(articleId);
  const targetId = article?.id || articleId;
  const targetSlug = article?.slug || articleId;
  const title = article?.title || articleId;

  // Remove from in-memory state
  dynamicArticlesState = dynamicArticlesState.filter(
    (a) => a.id !== articleId && a.slug !== articleId && a.id !== targetId && a.slug !== targetSlug
  );

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, ARTICLES_COLLECTION, targetId);
      await deleteDoc(docRef);
      if (articleId !== targetId) {
        const altRef = doc(db, ARTICLES_COLLECTION, articleId);
        await deleteDoc(altRef);
      }
    } catch (err: any) {
      console.warn('Error deleting article from Firestore:', err);
    }
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

  const fallbackList = dynamicArticlesState.filter((a) => a.authorId === userId);

  if (!isFirebaseConfigured() || !db) {
    return fallbackList;
  }

  try {
    const fetchFn = async () => {
      const articlesRef = collection(db, ARTICLES_COLLECTION);
      const q = query(articlesRef, where('authorId', '==', userId));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((docSnap) => normalizeArticleDoc(docSnap.id, docSnap.data()));

      // Merge in session dynamic articles
      const idSet = new Set(list.map((a) => a.id));
      for (const d of dynamicArticlesState) {
        if (d.authorId === userId && !idSet.has(d.id)) {
          list.push(d);
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
 * Verifies if a slug is available and unique.
 */
export async function isSlugAvailable(slug: string, currentArticleId?: string): Promise<boolean> {
  const cleanSlug = cleanSlugHelper(slug);
  if (!cleanSlug) return false;

  const foundLocal = dynamicArticlesState.find(
    (a) => cleanSlugHelper(a.slug) === cleanSlug && a.id !== currentArticleId
  );
  if (foundLocal) return false;

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

