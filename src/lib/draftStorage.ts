import { Article } from '../types';

/**
 * Draft Storage Key Prefix
 * Key format: thelegendswiki:draft_recovery:${userId}:${draftKey}
 */
const DRAFT_RECOVERY_PREFIX = 'thelegendswiki:draft_recovery:';
const PUBLISHED_REGISTRY_KEY = 'thelegendswiki:published_article_registry';

/**
 * Retrieves the set of all known published article IDs and slugs from local storage.
 */
export function getKnownPublishedIdentities(): Set<string> {
  const set = new Set<string>();
  if (typeof window === 'undefined' || !window.localStorage) return set;
  try {
    const raw = localStorage.getItem(PUBLISHED_REGISTRY_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item && typeof item === 'string') {
            set.add(item.toLowerCase().trim());
          }
        }
      }
    }
  } catch (e) {
    // ignore parse error
  }
  return set;
}

/**
 * Records an article ID and slug as a published article, ensuring it can never be treated as a draft.
 * Automatically clears any draft recovery entries that reference this published article.
 */
export function recordPublishedArticleIdentity(...idsOrSlugs: (string | undefined | null)[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const existing = getKnownPublishedIdentities();
    let changed = false;
    for (const val of idsOrSlugs) {
      if (val && typeof val === 'string' && val.trim().length > 0) {
        const clean = val.toLowerCase().trim();
        if (!existing.has(clean)) {
          existing.add(clean);
          changed = true;
        }
      }
    }
    if (changed) {
      localStorage.setItem(PUBLISHED_REGISTRY_KEY, JSON.stringify(Array.from(existing)));
    }

    // Immediately purge any draft recovery keys that match any of these published identifiers
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_RECOVERY_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            const candidateDocId = parsed?.docId?.toLowerCase()?.trim();
            const candidateSlug = parsed?.data?.slug?.toLowerCase()?.trim();
            const candidateId = parsed?.data?.id?.toLowerCase()?.trim();
            const matchesPublished = idsOrSlugs.some((val) => {
              if (!val) return false;
              const c = val.toLowerCase().trim();
              return c === candidateDocId || c === candidateSlug || c === candidateId;
            });
            if (matchesPublished) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // ignore parsing error
        }
      }
    }
  } catch (e) {
    console.warn('Error recording published article identity:', e);
  }
}

/**
 * Checks synchronously whether an identifier or slug belongs to a known published article.
 */
export function isKnownPublishedIdentity(idOrSlug?: string | null): boolean {
  if (!idOrSlug || typeof idOrSlug !== 'string') return false;
  const clean = idOrSlug.toLowerCase().trim();
  if (!clean) return false;
  const set = getKnownPublishedIdentities();
  return set.has(clean);
}

export interface LocalDraftBackup {
  data: Partial<Article>;
  savedAt: number; // unix timestamp ms
  updatedAt: string; // ISO timestamp
  docId?: string | null;
  userId: string;
}

/**
 * Formats a storage key for a user and draft target ('new' or articleId/slug).
 */
export function getDraftStorageKey(userId: string, draftKey: string): string {
  const safeUser = userId || 'anonymous';
  const safeKey = draftKey || 'new';
  return `${DRAFT_RECOVERY_PREFIX}${safeUser}:${safeKey}`;
}

/**
 * Retrieves a saved local draft backup from localStorage.
 * Automatically purges any backup that belongs to an already published or submitted article.
 */
export function getLocalDraftBackup(
  userId: string,
  draftKey: string = 'new'
): LocalDraftBackup | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const key = getDraftStorageKey(userId, draftKey);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: LocalDraftBackup = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.data) {
      // SAFETY GUARD 1: If the stored backup has status 'published' or 'pending_review', it is not a draft!
      if (parsed.data.status === 'published' || parsed.data.status === 'pending_review') {
        localStorage.removeItem(key);
        return null;
      }

      // SAFETY GUARD 2: If the backup matches a known published article by docId, id, or slug, purge it immediately
      if (
        isKnownPublishedIdentity(parsed.docId) ||
        isKnownPublishedIdentity(parsed.data.id) ||
        isKnownPublishedIdentity(parsed.data.slug)
      ) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed;
    }
  } catch (e) {
    console.warn('Error reading local draft backup:', e);
  }
  return null;
}

/**
 * Saves a local draft backup immediately into localStorage.
 * STRICT ENFORCEMENT: Never saves published or submitted articles into draft storage.
 */
export function saveLocalDraftBackup(
  userId: string,
  draftKey: string = 'new',
  data: Partial<Article>,
  docId?: string | null
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  // SAFETY GUARD 1: If the data is published or submitted, it is not a draft! Clear draft recovery instead.
  if (data && (data.status === 'published' || data.status === 'pending_review')) {
    clearLocalDraftBackup(userId, draftKey);
    if (docId) {
      clearLocalDraftBackup(userId, docId);
    }
    return;
  }

  // SAFETY GUARD 2: If docId, id, or slug is already a published article, DO NOT SAVE as draft!
  if (
    isKnownPublishedIdentity(docId) ||
    isKnownPublishedIdentity(data?.id) ||
    isKnownPublishedIdentity(data?.slug)
  ) {
    clearLocalDraftBackup(userId, draftKey);
    if (docId) {
      clearLocalDraftBackup(userId, docId);
    }
    return;
  }

  try {
    const key = getDraftStorageKey(userId, draftKey);
    const now = Date.now();
    const backup: LocalDraftBackup = {
      data,
      savedAt: now,
      updatedAt: new Date(now).toISOString(),
      docId: docId || data.id || null,
      userId: userId || 'anonymous',
    };
    localStorage.setItem(key, JSON.stringify(backup));

    // If an associated docId is known and different from draftKey, mirror it only if docId is genuinely a draft
    if (docId && docId !== draftKey && draftKey === 'new' && !isKnownPublishedIdentity(docId)) {
      const docKey = getDraftStorageKey(userId, docId);
      localStorage.setItem(docKey, JSON.stringify(backup));
    }
  } catch (e) {
    console.warn('Error writing local draft backup:', e);
  }
}

/**
 * Clears a local draft recovery backup from localStorage.
 */
export function clearLocalDraftBackup(userId: string, draftKey: string = 'new'): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const key = getDraftStorageKey(userId, draftKey);
    localStorage.removeItem(key);

    // Also check for anonymous key if needed
    if (userId) {
      localStorage.removeItem(getDraftStorageKey('anonymous', draftKey));
    }
  } catch (e) {
    console.warn('Error clearing local draft backup:', e);
  }
}

/**
 * Purges the 'new' active draft recovery state completely for all possible keys.
 */
export function purgeNewDraftRecovery(userId?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (userId) {
      clearLocalDraftBackup(userId, 'new');
    }
    clearLocalDraftBackup('anonymous', 'new');
  } catch (e) {
    console.warn('Error purging new draft recovery:', e);
  }
}

/**
 * Cleans all local draft backups across identifiers for a user when a draft is deleted.
 */
export function clearAllDraftBackupsForArticle(
  userId: string,
  ...identifiers: (string | undefined | null)[]
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    for (const id of identifiers) {
      if (id) {
        clearLocalDraftBackup(userId, id);
        clearLocalDraftBackup('anonymous', id);
      }
    }

    // Check 'new' draft recovery to see if it belongs to the deleted article
    const newBackup = getLocalDraftBackup(userId, 'new');
    if (newBackup && newBackup.data) {
      const match = identifiers.some(
        (id) =>
          id &&
          (newBackup.docId === id ||
            newBackup.data.id === id ||
            newBackup.data.slug === id)
      );
      if (match) {
        clearLocalDraftBackup(userId, 'new');
      }
    }
  } catch (e) {
    console.warn('Error in clearAllDraftBackupsForArticle:', e);
  }
}

/**
 * Checks if a draft has meaningful content worth recovering.
 */
export function hasMeaningfulDraftContent(data: Partial<Article> | null | undefined): boolean {
  if (!data) return false;
  if (data.title && data.title.trim().length > 0 && data.title !== 'Untitled Draft') return true;
  if (data.summary && data.summary.trim().length > 0) return true;
  if (data.featuredImage && data.featuredImage.trim().length > 0) return true;
  if (data.tags && data.tags.length > 0) return true;
  if (data.citations && data.citations.length > 0) return true;

  if (data.sections && data.sections.length > 0) {
    for (const sec of data.sections) {
      if (sec.title && sec.title.trim().length > 0 && !sec.title.startsWith('Section ')) {
        // has custom section title
      }
      if (sec.content && sec.content.some((p) => p.trim().length > 0)) {
        return true;
      }
      if (sec.bulletPoints && sec.bulletPoints.some((b) => b.trim().length > 0)) {
        return true;
      }
      if (sec.claims && sec.claims.length > 0) {
        return true;
      }
    }
  }
  return false;
}
