/**
 * Core type definitions for TheLegendsWiki encyclopedia platform.
 */

// ==========================================
// 1. USER & AUTHENTICATION TYPES
// ==========================================

export type UserRole = 'guest' | 'registered_user' | 'editor' | 'administrator';

export interface UserProfile {
  id: string; // Firebase Auth UID
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  bio?: string;
  createdAt: string | number | any;
  updatedAt: string | number | any;
}

// ==========================================
// 2. ARTICLE TYPES & STRUCTURES
// ==========================================

export type ArticleStatus = 'draft' | 'pending_review' | 'published' | 'archived';

export interface ArticleCitation {
  id: number;
  title: string;
  author?: string;
  publisher?: string;
  date?: string;
  year?: string;
  url?: string;
  text?: string;
}

export interface InfoboxDetail {
  label: string;
  value: string;
}

export interface ArticleInfobox {
  title: string;
  subtitle?: string;
  image?: string;
  imageCaption?: string;
  imageAlt?: string;
  imageCredit?: string;
  articleType?: 'person' | 'place' | 'science' | 'event' | 'technology' | 'organization' | 'general';
  details: InfoboxDetail[];
}

export interface ArticleImageFigure {
  url: string;
  caption: string;
  alt: string;
  credit?: string;
  align?: 'right' | 'left' | 'center' | 'full';
}

export interface ArticleSubsection {
  id: string;
  title: string;
  paragraphs: string[];
  bulletPoints?: string[];
  orderedPoints?: string[];
  figure?: ArticleImageFigure;
}

export interface ArticleSection {
  id: string;
  title: string;
  content: string[]; // array of paragraphs
  bulletPoints?: string[];
  orderedPoints?: string[];
  figure?: ArticleImageFigure;
  subsections?: ArticleSubsection[];
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  pronunciation?: string;
  articleType?: 'person' | 'place' | 'science' | 'event' | 'technology' | 'organization' | 'general';
  content?: string | string[]; // Raw content string or array
  featuredImage?: string;
  image?: string; // UI backward compatibility alias
  imageCaption?: string;
  imageCredit?: string;
  infobox?: ArticleInfobox;
  sections: ArticleSection[];
  references?: ArticleCitation[]; // Formal references collection
  citations: ArticleCitation[]; // UI backward compatibility alias
  categories?: string[]; // Array of category slugs / IDs
  category: string;
  categorySlug: string;
  subCategory?: string;
  tags: string[];
  authorId?: string;
  author: string;
  createdAt?: string | number | any;
  updatedAt?: string | number | any;
  lastUpdated: string;
  status?: ArticleStatus;
  viewCount?: number;
  views: number; // UI backward compatibility alias
  featured?: boolean;
  popular?: boolean;
  readingTimeMinutes: number;
  relatedArticleSlugs: string[];
}

// ==========================================
// 3. CATEGORY & TAXONOMY TYPES
// ==========================================

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
  articleCount: number;
  parentCategoryId?: string | null;
  parentCategorySlug: string;
  featuredArticleSlug?: string;
  createdAt?: string | number | any;
  updatedAt?: string | number | any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  parentCategoryId?: string | null;
  articleCount: number;
  featuredArticleSlug?: string;
  featuredArticles?: string[];
  subcategories?: Subcategory[];
  parentCategorySlug?: string;
  image?: string;
  createdAt?: string | number | any;
  updatedAt?: string | number | any;
}

// ==========================================
// 4. REVISIONS COLLECTION TYPES
// ==========================================

export interface Revision {
  id: string;
  articleId: string;
  editorId: string;
  editorName?: string;
  previousContent: string;
  newContent: string;
  changeSummary: string;
  createdAt: string | number | any;
}

// ==========================================
// 5. BOOKMARKS COLLECTION TYPES
// ==========================================

export interface Bookmark {
  id?: string;
  userId: string;
  articleId: string;
  createdAt: string | number | any;
}

// ==========================================
// 6. REPORTS COLLECTION TYPES
// ==========================================

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  articleId: string;
  reporterId: string;
  reason: string;
  description: string;
  status: ReportStatus;
  createdAt: string | number | any;
  reviewedAt?: string | number | any;
  reviewedBy?: string;
}

// ==========================================
// 7. ROUTING & UI TYPES
// ==========================================

export type PageRoute = 
  | { type: 'home' }
  | { type: 'wiki'; slug: string }
  | { type: 'search'; query: string; category?: string }
  | { type: 'category'; slug: string }
  | { type: 'random' }
  | { type: 'login' }
  | { type: 'signup' }
  | { type: 'create' }
  | { type: 'edit'; slug: string }
  | { type: 'my-articles' }
  | { type: 'user'; username: string }
  | { type: 'admin' }
  | { type: 'about' }
  | { type: 'contact' }
  | { type: 'privacy' }
  | { type: 'terms' }
  | { type: 'notFound' };

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

// ==========================================
// 8. DATA VALIDATION RESULT
// ==========================================

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
