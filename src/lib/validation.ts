import { 
  Article, 
  Category, 
  UserProfile, 
  Revision, 
  Report, 
  Bookmark, 
  ValidationResult,
  UserRole,
  ArticleStatus,
  ReportStatus
} from '../types';

export const VALID_USER_ROLES: UserRole[] = ['guest', 'registered_user', 'editor', 'administrator'];
export const VALID_ARTICLE_STATUSES: ArticleStatus[] = ['draft', 'pending_review', 'published', 'archived'];
export const VALID_REPORT_STATUSES: ReportStatus[] = ['pending', 'reviewed', 'resolved', 'dismissed'];

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

/**
 * Validates an Article payload before saving to Firestore.
 */
export function validateArticle(data: Partial<Article>): ValidationResult {
  const errors: Record<string, string> = {};

  // 1. Title validation
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 2) {
    errors.title = 'Article title is required and must be at least 2 characters.';
  } else if (data.title.length > 250) {
    errors.title = 'Article title cannot exceed 250 characters.';
  }

  // 2. Slug validation
  if (!data.slug || typeof data.slug !== 'string' || !SLUG_REGEX.test(data.slug)) {
    errors.slug = 'Valid URL slug is required (lowercase letters, numbers, and single hyphens).';
  }

  // 3. Summary validation
  if (!data.summary || typeof data.summary !== 'string' || data.summary.trim().length < 10) {
    errors.summary = 'Summary lead paragraph is required (minimum 10 characters).';
  }

  // 4. Status validation
  if (data.status && !VALID_ARTICLE_STATUSES.includes(data.status)) {
    errors.status = `Status must be one of: ${VALID_ARTICLE_STATUSES.join(', ')}.`;
  }

  // 5. Category validation
  if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
    errors.category = 'Primary category name is required.';
  }
  if (!data.categorySlug || typeof data.categorySlug !== 'string' || !SLUG_REGEX.test(data.categorySlug)) {
    errors.categorySlug = 'Valid primary category slug is required.';
  }

  // 6. Author validation
  if (!data.authorId || typeof data.authorId !== 'string') {
    errors.authorId = 'Author identifier is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates a Category payload.
 */
export function validateCategory(data: Partial<Category>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.name = 'Category name is required and must be at least 2 characters.';
  }

  if (!data.slug || typeof data.slug !== 'string' || !SLUG_REGEX.test(data.slug)) {
    errors.slug = 'Valid category slug is required (lowercase letters, numbers, and hyphens).';
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 5) {
    errors.description = 'Category description must be at least 5 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates a User payload.
 */
export function validateUserProfile(data: Partial<UserProfile>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.id || typeof data.id !== 'string') {
    errors.id = 'User unique identifier is required.';
  }

  if (!data.username || typeof data.username !== 'string' || !USERNAME_REGEX.test(data.username)) {
    errors.username = 'Username must be 3-30 characters containing only alphanumeric characters and underscores.';
  }

  if (!data.email || typeof data.email !== 'string' || !EMAIL_REGEX.test(data.email)) {
    errors.email = 'A valid email address is required.';
  }

  if (data.role && !VALID_USER_ROLES.includes(data.role)) {
    errors.role = `Role must be one of: ${VALID_USER_ROLES.join(', ')}.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates a Revision payload.
 */
export function validateRevision(data: Partial<Revision>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.articleId || typeof data.articleId !== 'string') {
    errors.articleId = 'Article ID is required.';
  }

  if (!data.editorId || typeof data.editorId !== 'string') {
    errors.editorId = 'Editor ID is required.';
  }

  if (!data.newContent || typeof data.newContent !== 'string') {
    errors.newContent = 'New content is required for revision snapshot.';
  }

  if (!data.changeSummary || typeof data.changeSummary !== 'string' || data.changeSummary.trim().length < 3) {
    errors.changeSummary = 'Change summary must be provided (minimum 3 characters).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates a Report payload.
 */
export function validateReport(data: Partial<Report>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.articleId || typeof data.articleId !== 'string') {
    errors.articleId = 'Article ID is required.';
  }

  if (!data.reporterId || typeof data.reporterId !== 'string') {
    errors.reporterId = 'Reporter ID is required.';
  }

  if (!data.reason || typeof data.reason !== 'string' || data.reason.trim().length < 3) {
    errors.reason = 'Reason for report is required.';
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 5) {
    errors.description = 'Report description must be at least 5 characters.';
  }

  if (data.status && !VALID_REPORT_STATUSES.includes(data.status)) {
    errors.status = `Status must be one of: ${VALID_REPORT_STATUSES.join(', ')}.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates a Bookmark payload.
 */
export function validateBookmark(data: Partial<Bookmark>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.userId || typeof data.userId !== 'string') {
    errors.userId = 'User ID is required.';
  }

  if (!data.articleId || typeof data.articleId !== 'string') {
    errors.articleId = 'Article ID is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Automatically generates a clean, URL-safe slug from a title string.
 */
export function generateSlugFromTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    .replace(/['"“”‘’]/g, '') // remove quotes
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
    .slice(0, 100); // reasonable slug length limit
}

/**
 * Validates a web URL ensuring strict http or https protocols.
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Cleans and sanitizes user tag input.
 */
export function sanitizeTag(rawTag: string): string {
  if (!rawTag) return '';
  return rawTag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_\s]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 30);
}

