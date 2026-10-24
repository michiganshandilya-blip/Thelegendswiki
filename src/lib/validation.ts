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
import { MANDATORY_DOSSIER_SECTIONS } from './dossierStructure';

export const VALID_USER_ROLES: UserRole[] = [
  'user',
  'admin',
  'super_admin',
  'guest',
  'registered_user',
  'editor',
  'administrator'
];
export const VALID_ARTICLE_STATUSES: ArticleStatus[] = [
  'draft', 
  'pending_review', 
  'changes_requested', 
  'published', 
  'rejected', 
  'archived'
];
export const VALID_REPORT_STATUSES: ReportStatus[] = ['pending', 'reviewed', 'resolved', 'dismissed'];

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

/**
 * Validates an image's alternative text for accessibility.
 * Ensures the alt text is descriptive and avoids meaningless generic placeholders.
 */
export function validateImageAlt(alt?: string): { isValid: boolean; message?: string } {
  if (!alt || typeof alt !== 'string' || alt.trim().length === 0) {
    return {
      isValid: false,
      message: 'Descriptive alternative text is required for screen readers and accessibility.',
    };
  }

  const trimmed = alt.trim().toLowerCase();
  const meaninglessNames = [
    'image',
    'image1',
    'image2',
    'img',
    'photo',
    'pic',
    'picture',
    'screenshot',
    'file',
    'download',
    'upload',
    'thumbnail',
    'banner',
    'untitled',
  ];

  if (meaninglessNames.includes(trimmed)) {
    return {
      isValid: false,
      message: `"${alt}" is not a descriptive alt text. Please describe what the image depicts (e.g. "Portrait of Albert Einstein at the Prussian Academy").`,
    };
  }

  if (trimmed.length < 3) {
    return {
      isValid: false,
      message: 'Alternative text must be at least 3 characters long to be descriptive.',
    };
  }

  return { isValid: true };
}

/**
 * Validates an Article payload before saving to Firestore.
 */
export function validateArticle(
  data: Partial<Article>,
  options?: { checkSpam?: boolean }
): ValidationResult {
  const errors: Record<string, string> = {};
  const isDraft = data.status === 'draft';

  // 1. Title validation (Required)
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.title = 'Article title is required.';
  } else if (data.title.length > 250) {
    errors.title = 'Article title cannot exceed 250 characters.';
  }

  // 2. URL Slug: auto-generate from title if missing or invalid (does not block submission)
  if (!data.slug || typeof data.slug !== 'string' || !SLUG_REGEX.test(data.slug)) {
    if (data.title && typeof data.title === 'string' && data.title.trim().length > 0) {
      data.slug = generateSlugFromTitle(data.title);
    }
  }
  if (!data.slug || !SLUG_REGEX.test(data.slug)) {
    data.slug = `article-${Date.now()}`;
  }

  // 3. Short Summary validation (Required)
  if (!isDraft) {
    if (!data.summary || typeof data.summary !== 'string' || data.summary.trim().length === 0) {
      errors.summary = 'Short summary is required.';
    }
  }

  // 4. Status validation
  if (data.status && !VALID_ARTICLE_STATUSES.includes(data.status)) {
    errors.status = `Status must be one of: ${VALID_ARTICLE_STATUSES.join(', ')}.`;
  }

  // 5. Primary Category validation (Required)
  if (!isDraft) {
    if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
      errors.category = 'Primary category is required.';
    }
    if (!data.categorySlug || typeof data.categorySlug !== 'string' || !SLUG_REGEX.test(data.categorySlug)) {
      if (data.category) {
        data.categorySlug = generateSlugFromTitle(data.category);
      }
    }
  }

  // 6. Main / Hero Article Illustration (Required)
  if (!isDraft) {
    const heroImg = (data.featuredImage || data.image || '').trim();
    if (!heroImg) {
      errors.featuredImage = 'Main / Hero Article Illustration is required.';
    }
  }

  // 7. Article Content / Body validation (Required)
  if (!isDraft) {
    const sections = data.sections || [];
    const hasSectionContent = sections.some((s) => {
      const c = s?.content ? (Array.isArray(s.content) ? s.content.join(' ').trim() : String(s.content).trim()) : '';
      const bp = s?.bulletPoints ? (Array.isArray(s.bulletPoints) ? s.bulletPoints.join(' ').trim() : String(s.bulletPoints).trim()) : '';
      return c.length > 0 || bp.length > 0;
    });
    const hasDirectContent = typeof data.content === 'string' && data.content.trim().length > 0;
    if (!hasSectionContent && !hasDirectContent) {
      errors.content = 'Article content is required. Please write your article content before publishing.';
    }
  }

  // 8. Automated defaults for optional / technical fields
  if (!data.region) {
    data.region = 'Global';
  }
  if (!data.contentSensitivity) {
    data.contentSensitivity = 'normal';
  }
  if (!data.authorId) {
    data.authorId = 'contributor';
  }

  // 9. Automated Link & Spam Detection (controlled by authoritative System Settings: autoFlagSpam)
  if (!isDraft && options?.checkSpam !== false) {
    const spamCheck = checkSpamAndLinks(data);
    if (!spamCheck.isValid) {
      Object.assign(errors, spamCheck.errors);
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Automated Link & Spam Detection
 * Detects unverified external domains, malformed protocols, suspicious TLDs,
 * or known spam/promotional patterns in article submissions.
 */
export function checkSpamAndLinks(data: Partial<Article>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // 1. Unverified external domains and URL link verification
  const citations = data.citations || data.references || [];
  const SUSPICIOUS_TLDS = ['.xyz', '.click', '.top', '.link', '.phish', '.casino', '.stream', '.tk', '.ml', '.ga', '.cf', '.gq'];
  
  for (let i = 0; i < citations.length; i++) {
    const cite = citations[i];
    if (cite && cite.url && cite.url.trim().length > 0) {
      const urlStr = cite.url.trim();
      if (!isValidUrl(urlStr)) {
        errors.citations = `Automated link detection: Citation [${i + 1}] contains an unverified or malformed URL.`;
        break;
      }
      try {
        const parsed = new URL(urlStr);
        const host = parsed.hostname.toLowerCase();
        if (SUSPICIOUS_TLDS.some((tld) => host.endsWith(tld))) {
          errors.citations = `Automated link detection: Citation [${i + 1}] references an unverified high-risk external domain (${host}).`;
          break;
        }
      } catch {
        errors.citations = `Automated link detection: Citation [${i + 1}] has an unparseable external link.`;
        break;
      }
    }
  }

  // 2. Spam keyword / pattern detection in title, summary, or content
  const SPAM_PATTERNS = [
    /\b(?:buy\s+cheap|free\s+casino|crypto\s+airdrop|viagra|cialis|seo\s+ranking\s+service|loan\s+guaranteed|click\s+here\s+for\s+cash|replica\s+watches|whatsapp\s+hack)\b/i,
  ];

  const combinedText = [
    data.title || '',
    data.summary || '',
    typeof data.content === 'string' ? data.content : '',
    ...(data.sections || []).map((s) => (Array.isArray(s.content) ? s.content.join(' ') : String(s.content || ''))),
  ].join(' ');

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(combinedText)) {
      errors.spam = 'Automated spam detection: Submission contains unverified spam or prohibited promotional patterns.';
      break;
    }
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
  const normalized = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks
    .toLowerCase()
    .trim()
    .replace(/['"“”‘’]/g, '') // remove quotes
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
    .slice(0, 100); // reasonable slug length limit

  if (normalized) return normalized;

  // Stable deterministic fallback for non-Latin script titles (e.g. Hindi, Bengali, etc.)
  const hash = Array.from(title).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 0);
  return `entry-${hash.toString(36)}`;
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

