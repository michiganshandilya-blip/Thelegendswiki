/**
 * Core type definitions for TheLegendsWiki encyclopedia platform.
 */

// ==========================================
// 1. USER & AUTHENTICATION TYPES
// ==========================================

export type UserRole = 
  | 'user' 
  | 'admin' 
  | 'super_admin' 
  | 'guest' 
  | 'registered_user' 
  | 'editor' 
  | 'administrator';

export interface UserProfile {
  id: string; // Firebase Auth UID
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  authProvider?: 'password' | 'google' | 'apple' | 'phone' | string;
  phoneNumber?: string;
  photoURL?: string;
  bio?: string;
  scholarlyBiography?: string;
  disabled?: boolean;
  articlesCount?: number;
  lastActive?: string | number | any;
  createdAt: string | number | any;
  updatedAt: string | number | any;
}

// ==========================================
// 1.1 ADMINISTRATIVE AUDIT LOG & SYSTEM CONFIG
// ==========================================

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorRole: UserRole | string;
  action: string; // e.g. "Article Created", "Article Edited", "Article Deleted", "Contribution Approved", "Contribution Rejected", "User Restricted", "Admin Promoted", "Admin Demoted", "Role Changed", "System Setting Changed"
  targetId?: string;
  targetTitle?: string;
  targetType?: 'article' | 'user' | 'role' | 'setting' | 'category' | 'system';
  details: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface FeaturedSeriesConfig {
  id?: string;
  title: string; // e.g. "Who Taught Us to Want This?"
  slug: string; // e.g. "who-taught-us-to-want-this"
  subtitle?: string;
  tagline?: string;
  description?: string;
  bannerImageUrl: string;
  bannerImageAlt?: string;
  active: boolean;
  targetPath?: string;
  articleSlugs?: string[];
}

export interface SystemSettings {
  id: string;
  siteName: string;
  requirePeerReview: boolean;
  allowPublicSubmissions: boolean;
  announcementBanner: string;
  announcementActive: boolean;
  autoFlagSpam: boolean;
  maintenanceMode: boolean;
  minCitationsRequired: number;
  allowedRegions: string[];
  featuredSeries?: FeaturedSeriesConfig;
  updatedAt: string;
  updatedBy: string;
}

// ==========================================
// 2. ARTICLE TYPES & STRUCTURES
// ==========================================

export type ArticleStatus = 
  | 'draft' 
  | 'pending_review' 
  | 'changes_requested' 
  | 'published' 
  | 'rejected' 
  | 'archived';

export interface ArticleCitation {
  id: number;
  title: string;
  author?: string;
  publisher?: string;
  date?: string;
  year?: string;
  url?: string;
  text?: string;
  citationType?: 'book' | 'journal' | 'website' | 'primary_source' | 'archive' | 'general';
  pages?: string;
  doi?: string;
  isbn?: string;
  accessDate?: string;
  source?: string;
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
  size?: 'small' | 'medium' | 'large';
}

export interface ArticleSubsection {
  id: string;
  title: string;
  paragraphs: string[];
  bulletPoints?: string[];
  orderedPoints?: string[];
  figure?: ArticleImageFigure;
}

export type EpistemicClassification = 'CONFIRMED' | 'DISPUTED' | 'ALLEGED' | 'THEORY';

export interface EpistemicEvidenceClaim {
  id: string;
  claim: string;
  classification: EpistemicClassification;
  sourceUrl?: string;
  sourceTitle?: string;
  explanation?: string;
  createdAt?: string | number;
}

export interface ArticleSection {
  id: string;
  title: string;
  content: string[]; // array of paragraphs
  bulletPoints?: string[];
  orderedPoints?: string[];
  figure?: ArticleImageFigure;
  subsections?: ArticleSubsection[];
  claims?: EpistemicEvidenceClaim[]; // Epistemic evidence standards claims
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
  imageAlt?: string;
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
  authorEmail?: string;
  author: string;
  createdAt?: string | number | any;
  updatedAt?: string | number | any;
  lastUpdated: string;
  status?: ArticleStatus;
  
  // Moderation & Editorial Review fields
  moderationNotes?: string;
  reviewedBy?: string;
  reviewedById?: string;
  reviewedAt?: string | number | any;
  submittedAt?: string | number | any;

  viewCount?: number;
  views: number; // UI backward compatibility alias
  featured?: boolean;
  popular?: boolean;
  region?: string; // Geographic context (e.g. 'India', 'Europe', 'North America', 'Asia', 'Global')
  isBehindCurtains?: boolean; // Deeper, mysterious, and classified knowledge layer
  curtainLayer?: 'visible' | 'behind_curtains';
  knowledgeDepth?: KnowledgeDepth; // Epistemic/depth classification
  behindCurtainsContext?: string; // Informational rationale for curtain classification
  relatedCategories?: string[]; // Related knowledge disciplines
  relatedCategorySlugs?: string[];
  readingTimeMinutes: number;
  relatedArticleSlugs: string[];

  // Sensitive Content Classification & Disclaimers
  isSensitive?: boolean;
  contentSensitivity?: 'normal' | 'sensitive';
  sensitivityRationale?: string;

  // Specialized Behind-the-Curtains Research Structures
  financialMechanism?: FinancialMechanism;
  mediaComparison?: MediaComparison;
  primaryDocuments?: PrimaryDocument[];
  controversyAnalysis?: ControversyAnalysis;
  timelineEvents?: TimelineEvent[];
  handwrittenNotes?: HandwrittenNote[];
  claims?: EpistemicEvidenceClaim[]; // Epistemic evidence standards claims
}

// ==========================================
// 2.05 SPECIALIZED BEHIND-THE-CURTAINS TYPES
// ==========================================

export interface FinancialStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface FinancialMechanism {
  schemeType: string;
  estimatedQuantum?: string;
  stepByStepFlow: FinancialStep[];
  institutionsInvolved: string[];
  regulatoryFailures: string[];
  legalOutcomes: string[];
}

export interface MediaComparison {
  workTitle: string;
  workType: string;
  dramatizedElements: string[];
  omittedRealities: string[];
  historicalConsensus: string;
}

export interface PrimaryDocument {
  id: string;
  title: string;
  author?: string;
  date?: string;
  repository?: string;
  sourceArchive?: string;
  documentType?: string;
  excerpt: string;
  context?: string;
  significance?: string;
  url?: string;
}

export interface Perspective {
  factionOrScholar: string;
  argument: string;
  keyEvidence: string;
}

export interface ControversyAnalysis {
  coreControversy?: string;
  mainstreamView?: string;
  alternativeView?: string;
  supportingEvidence?: string | string[];
  counterEvidence?: string | string[];
  perspectives?: Perspective[];
  modernHistoriographicalConsensus?: string;
  scholarlyConsensus?: string;
}

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  significance?: string;
  evidenceClassification?: string;
  isTurningPoint?: boolean;
}

export interface HandwrittenNote {
  id: string;
  text?: string;
  noteText?: string;
  author?: string;
  authorLabel?: string;
  marginLocation?: string;
  contextLabel?: string;
  date?: string;
  dateOrEpoch?: string;
}

// ==========================================
// 2.1 KNOWLEDGE DEPTH CLASSIFICATION
// ==========================================

export type KnowledgeDepth = 
  | 'Documented Fact'
  | 'Evidence'
  | 'Claim'
  | 'Theory'
  | 'Disputed'
  | 'Unknown';

export type KnowledgeLayerFilter = 'all' | 'visible' | 'behind_curtains';

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

export type RevisionActionType = 
  | 'draft_saved' 
  | 'submission' 
  | 'approval' 
  | 'changes_requested' 
  | 'rejection' 
  | 'direct_edit' 
  | 'restore';

export interface Revision {
  id: string;
  articleId: string;
  articleTitle?: string;
  articleSlug?: string;
  editorId: string;
  editorName?: string;
  previousContent: string;
  newContent: string;
  changeSummary: string;
  actionType?: RevisionActionType;
  moderationNotes?: string;
  createdAt: string | number | any;
  snapshot?: Partial<Article>;
  versionNumber?: string;
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
  | { type: 'search'; query: string; category?: string; layer?: KnowledgeLayerFilter }
  | { type: 'category'; slug: string; curtains?: boolean; subcategorySlug?: string }
  | { type: 'behind-the-curtains'; categorySlug?: string }
  | { type: 'random' }
  | { type: 'login' }
  | { type: 'signup' }
  | { type: 'forgot-password' }
  | { type: 'reset-password'; oobCode?: string; mode?: string }
  | { type: 'create' }
  | { type: 'edit'; slug: string }
  | { type: 'my-articles' }
  | { type: 'user'; username: string }
  | { type: 'admin'; tab?: 'overview' | 'articles' | 'contributions' | 'users' | 'moderation' | 'revisions' | 'categories' }
  | { type: 'super-admin'; tab?: 'admins' | 'settings' | 'audit' | 'metrics' }
  | { type: 'moderation' }
  | { type: 'about' }
  | { type: 'contact' }
  | { type: 'privacy' }
  | { type: 'terms' }
  | { type: 'disclaimer' }
  | { type: 'cookie-policy' }
  | { type: 'editorial-policy' }
  | { type: 'content-policy' }
  | { type: 'sitemap' }
  | { type: 'series'; slug?: string }
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

// ==========================================
// 9. INVESTIGATION & EVIDENCE ENGINE TYPES
// ==========================================

export type InvestigationStatus = 
  | 'lead' 
  | 'evidence_gathering' 
  | 'claims_analysis' 
  | 'verification' 
  | 'in_review' 
  | 'completed' 
  | 'published' 
  | 'archived';

export type ClaimStatus = 
  | 'confirmed'    // Verified by unequivocal primary evidence
  | 'supported'    // Strong corroborating evidence
  | 'disputed'     // Active conflicting evidence or ongoing debate
  | 'unverified'   // Assertion or lead without conclusive evidentiary backing
  | 'refuted';     // Proven false by counter-evidence

export type EvidenceType = 
  | 'primary_document' 
  | 'forensic_record' 
  | 'eyewitness_testimony' 
  | 'academic_peer_reviewed' 
  | 'investigative_journalism' 
  | 'official_depository' 
  | 'public_disclosure' 
  | 'hearsay_unverified';

export type EvidenceVerificationStatus = 
  | 'verified' 
  | 'corroborated' 
  | 'under_review' 
  | 'disputed' 
  | 'debunked' 
  | 'unverified';

export interface EvidenceItem {
  id: string;
  investigationId?: string;
  title: string;
  source: string;
  sourceUrl?: string;
  repository?: string;
  dateCollected: string;
  evidenceType: EvidenceType;
  verificationStatus: EvidenceVerificationStatus;
  confidenceScore?: number; // 0 to 100
  custodyChain?: string;
  description: string;
  rawExcerpt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  supportingClaimIds?: string[];
  conflictingClaimIds?: string[];
  authorId: string;
  authorName?: string;
  createdAt: string | number | any;
  updatedAt?: string | number | any;
}

export interface ClaimItem {
  id: string;
  investigationId: string;
  statement: string;
  subject: string;
  status: ClaimStatus;
  epistemicRationale: string;
  linkedEvidenceIds: string[]; // Independent claim-to-evidence relationships
  counterEvidenceIds?: string[];
  confidenceScore?: number; // 0 to 100
  verifiedBy?: string;
  verifiedAt?: string;
  authorId: string;
  createdAt: string | number | any;
  updatedAt?: string | number | any;
}

export interface InvestigationHypothesis {
  id: string;
  statement: string;
  status: 'active' | 'validated' | 'dismissed';
  notes?: string;
}

export interface InvestigationRecord {
  id: string;
  title: string;
  slug: string;
  subject: string;
  summary: string;
  status: InvestigationStatus;
  leadOrigin?: string;
  hypotheses?: InvestigationHypothesis[];
  articleId?: string; // Linked published or draft article ID
  articleSlug?: string; // Linked published article slug
  claims: ClaimItem[];
  evidence?: EvidenceItem[];
  evidenceCount?: number;
  leadInvestigator: string;
  leadInvestigatorId: string;
  collaborators?: string[];
  findings?: string;
  methodology?: string;
  reviewedBy?: string;
  reviewedById?: string;
  reviewedAt?: string;
  isPublished?: boolean;
  createdAt: string | number | any;
  updatedAt?: string | number | any;
}

