/**
 * Security Sanitization Utilities for TheLegendsWiki.
 * Prevents Cross-Site Scripting (XSS), URL injection, and payload poisoning.
 */

import { Article, ArticleCitation, ArticleSection, ArticleSubsection, InfoboxDetail } from '../types';

/**
 * Strips dangerous HTML tags, attributes, and script injection vectors.
 */
export function sanitizeText(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove control characters (except newline, carriage return, tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Strip <script> and </script> blocks completely
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Strip <style> and </style> blocks completely
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Strip iframe, object, embed, form, link, meta
    .replace(/<\/?(?:iframe|object|embed|form|link|meta|base|applet|svg|math)[^>]*>/gi, '')
    // Strip inline event handlers (onerror=, onclick=, onload=, etc.)
    .replace(/\s*on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\s*on\w+\s*=[^\s>]+/gi, '')
    .trim();
}

/**
 * Validates and sanitizes URLs to prevent javascript: or dangerous URI execution.
 * Allows safe http:, https:, relative paths, and safe base64 data:image/ URLs.
 */
export function sanitizeSafeUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();

  // Explicitly block dangerous protocols
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return '';
  }

  // Allow safe image base64 data URLs (jpg, png, webp, gif, svg)
  if (lower.startsWith('data:image/')) {
    if (
      lower.startsWith('data:image/jpeg') ||
      lower.startsWith('data:image/jpg') ||
      lower.startsWith('data:image/png') ||
      lower.startsWith('data:image/webp') ||
      lower.startsWith('data:image/gif') ||
      lower.startsWith('data:image/svg+xml')
    ) {
      if (!lower.includes('<script') && !lower.includes('javascript:')) {
        return trimmed;
      }
    }
    return '';
  }

  // Block any non-image data: URLs
  if (lower.startsWith('data:')) {
    return '';
  }

  // Allow relative URLs starting with / (e.g., internal wiki paths)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  // Validate absolute URL format with http/https
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
      return parsed.toString();
    }
  } catch {
    // invalid URL format
  }

  return '';
}

/**
 * Escapes characters for HTML display safety.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Deeply sanitizes an Article payload before saving/updating in the database.
 */
export function sanitizeArticlePayload(article: Partial<Article>): Partial<Article> {
  const sanitized: Partial<Article> = { ...article };

  if (sanitized.title) {
    sanitized.title = sanitizeText(sanitized.title).slice(0, 250);
  }

  if (sanitized.slug) {
    sanitized.slug = sanitized.slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
  }

  if (sanitized.summary) {
    sanitized.summary = sanitizeText(sanitized.summary).slice(0, 2500);
  }

  if (sanitized.pronunciation) {
    sanitized.pronunciation = sanitizeText(sanitized.pronunciation).slice(0, 100);
  }

  if (sanitized.category) {
    sanitized.category = sanitizeText(sanitized.category).slice(0, 100);
  }

  if (sanitized.subCategory) {
    sanitized.subCategory = sanitizeText(sanitized.subCategory).slice(0, 100);
  }

  if (sanitized.featuredImage) {
    sanitized.featuredImage = sanitizeSafeUrl(sanitized.featuredImage);
  }

  if (sanitized.image) {
    sanitized.image = sanitizeSafeUrl(sanitized.image);
  }

  if (sanitized.imageCaption) {
    sanitized.imageCaption = sanitizeText(sanitized.imageCaption).slice(0, 500);
  }

  if (sanitized.imageAlt) {
    sanitized.imageAlt = sanitizeText(sanitized.imageAlt).slice(0, 300);
  }

  if (sanitized.imageCredit) {
    sanitized.imageCredit = sanitizeText(sanitized.imageCredit).slice(0, 200);
  }

  if (sanitized.moderationNotes) {
    sanitized.moderationNotes = sanitizeText(sanitized.moderationNotes).slice(0, 2000);
  }

  // Sanitize tags
  if (Array.isArray(sanitized.tags)) {
    sanitized.tags = sanitized.tags
      .map((t) => sanitizeText(t).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30))
      .filter((t) => t.length > 0)
      .slice(0, 20);
  }

  // Sanitize infobox
  if (sanitized.infobox) {
    sanitized.infobox = {
      title: sanitizeText(sanitized.infobox.title).slice(0, 150),
      subtitle: sanitized.infobox.subtitle ? sanitizeText(sanitized.infobox.subtitle).slice(0, 150) : undefined,
      image: sanitized.infobox.image ? sanitizeSafeUrl(sanitized.infobox.image) : undefined,
      imageCaption: sanitized.infobox.imageCaption ? sanitizeText(sanitized.infobox.imageCaption).slice(0, 300) : undefined,
      imageAlt: sanitized.infobox.imageAlt ? sanitizeText(sanitized.infobox.imageAlt).slice(0, 300) : undefined,
      imageCredit: sanitized.infobox.imageCredit ? sanitizeText(sanitized.infobox.imageCredit).slice(0, 200) : undefined,
      articleType: sanitized.infobox.articleType,
      details: (sanitized.infobox.details || []).map((d: InfoboxDetail) => ({
        label: sanitizeText(d.label).slice(0, 100),
        value: sanitizeText(d.value).slice(0, 300),
      })).slice(0, 30),
    };
  }

  // Sanitize citations
  if (Array.isArray(sanitized.citations)) {
    sanitized.citations = sanitized.citations.map((c: ArticleCitation, index: number) => ({
      id: c.id || index + 1,
      title: sanitizeText(c.title).slice(0, 300),
      author: c.author ? sanitizeText(c.author).slice(0, 200) : undefined,
      publisher: c.publisher ? sanitizeText(c.publisher).slice(0, 200) : undefined,
      year: c.year ? sanitizeText(c.year).slice(0, 20) : undefined,
      date: c.date ? sanitizeText(c.date).slice(0, 50) : undefined,
      pages: c.pages ? sanitizeText(c.pages).slice(0, 50) : undefined,
      doi: c.doi ? sanitizeText(c.doi).slice(0, 100) : undefined,
      isbn: c.isbn ? sanitizeText(c.isbn).slice(0, 50) : undefined,
      url: c.url ? sanitizeSafeUrl(c.url) : undefined,
      text: c.text ? sanitizeText(c.text).slice(0, 500) : undefined,
      citationType: c.citationType || 'general',
      accessDate: c.accessDate ? sanitizeText(c.accessDate).slice(0, 50) : undefined,
    })).slice(0, 100);
  }

  // Sanitize sections
  if (Array.isArray(sanitized.sections)) {
    sanitized.sections = sanitized.sections.map((sec: ArticleSection, sIdx: number) => ({
      id: sec.id || `sec-${sIdx + 1}`,
      title: sanitizeText(sec.title).slice(0, 200),
      content: (sec.content || []).map((p) => sanitizeText(p)).slice(0, 50),
      bulletPoints: sec.bulletPoints ? sec.bulletPoints.map((bp) => sanitizeText(bp)).slice(0, 30) : undefined,
      orderedPoints: sec.orderedPoints ? sec.orderedPoints.map((op) => sanitizeText(op)).slice(0, 30) : undefined,
      figure: sec.figure
        ? {
            url: sanitizeSafeUrl(sec.figure.url),
            caption: sanitizeText(sec.figure.caption).slice(0, 500),
            alt: sanitizeText(sec.figure.alt).slice(0, 300),
            credit: sec.figure.credit ? sanitizeText(sec.figure.credit).slice(0, 200) : undefined,
            align: sec.figure.align || 'right',
            size: sec.figure.size || 'medium',
          }
        : undefined,
      subsections: sec.subsections
        ? sec.subsections.map((sub: ArticleSubsection, subIdx: number) => ({
            id: sub.id || `subsec-${sIdx + 1}-${subIdx + 1}`,
            title: sanitizeText(sub.title).slice(0, 200),
            paragraphs: (sub.paragraphs || []).map((p) => sanitizeText(p)).slice(0, 30),
            bulletPoints: sub.bulletPoints ? sub.bulletPoints.map((bp) => sanitizeText(bp)).slice(0, 20) : undefined,
            orderedPoints: sub.orderedPoints ? sub.orderedPoints.map((op) => sanitizeText(op)).slice(0, 20) : undefined,
            figure: sub.figure
              ? {
                  url: sanitizeSafeUrl(sub.figure.url),
                  caption: sanitizeText(sub.figure.caption).slice(0, 500),
                  alt: sanitizeText(sub.figure.alt).slice(0, 300),
                  credit: sub.figure.credit ? sanitizeText(sub.figure.credit).slice(0, 200) : undefined,
                  align: sub.figure.align || 'right',
                  size: sub.figure.size || 'medium',
                }
              : undefined,
          })).slice(0, 20)
        : undefined,
    })).slice(0, 30);
  }

  return sanitized;
}

/**
 * Recursively removes all keys with `undefined` values from an object,
 * ensuring it can be safely written to Firestore without throwing
 * "Unsupported field value: undefined" errors.
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => stripUndefined(item)) as unknown as T;
  }

  // Preserve Date objects and Firestore FieldValue instances (e.g., serverTimestamp(), deleteField()) intact
  if (
    obj instanceof Date ||
    typeof (obj as any)?._methodName === 'string' ||
    (obj as any)?.constructor?.name?.includes('FieldValue')
  ) {
    return obj;
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (
        value !== null &&
        typeof value === 'object' &&
        !(value instanceof Date) &&
        typeof (value as any)?._methodName !== 'string' &&
        !(value as any)?.constructor?.name?.includes('FieldValue')
      ) {
        cleaned[key] = stripUndefined(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as T;
}
