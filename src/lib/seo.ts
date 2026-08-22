import { Article, Category } from '../types';

export interface SEOMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  ogImageAlt?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noindex?: boolean;
  structuredData?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_SITE_TITLE = 'TheLegendsWiki — Digital Knowledge Archive & Codex of Legends';
const SITE_NAME = 'TheLegendsWiki';
const DEFAULT_DESCRIPTION =
  'A modern digital encyclopedia and knowledge archive. Explore science, technology, world history, cultural legends, extraordinary people, and human achievement.';
const DEFAULT_KEYWORDS = [
  'encyclopedia',
  'wiki',
  'digital knowledge',
  'history',
  'science',
  'biographies',
  'legends',
  'academic articles',
  'human achievement',
];

/**
 * Strips HTML and normalizes string length for meta descriptions (150-160 chars)
 */
export function sanitizeDescription(text?: string, maxLength: number = 160): string {
  if (!text) return DEFAULT_DESCRIPTION;
  const cleaned = text
    .replace(/\[\d+(?:,\s*\d+|-\d+)*\]/g, '') // remove citation numbers like [1], [2]
    .replace(/<[^>]*>/g, '') // strip any HTML tags
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength - 3).replace(/[,;.\s]+$/, '') + '...';
}

/**
 * Generates an absolute URL given a path
 */
export function getAbsoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thelegendswiki.org';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}

/**
 * Updates or creates a <meta> tag in the document <head>
 */
function setMetaTag(attributeName: 'name' | 'property', attributeValue: string, content: string | null) {
  if (typeof document === 'undefined') return;

  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`) as HTMLMetaElement | null;

  if (content === null || content === undefined || content === '') {
    if (element) element.remove();
    return;
  }

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Updates or creates a <link rel="..."> tag in document <head>
 */
function setLinkTag(rel: string, href: string | null) {
  if (typeof document === 'undefined') return;

  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;

  if (!href) {
    if (element) element.remove();
    return;
  }

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

/**
 * Injects or updates JSON-LD Schema in document <head>
 */
function setStructuredData(data: Record<string, any> | Array<Record<string, any>> | null) {
  if (typeof document === 'undefined') return;

  const scriptId = 'thelegendswiki-json-ld';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!data) {
    if (script) script.remove();
    return;
  }

  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data, null, 2);
}

/**
 * Master function to dynamically update SEO tags in document head
 */
export function updateSEO(metadata: SEOMetadata) {
  if (typeof document === 'undefined') return;

  // 1. Page Title
  const title = metadata.title
    ? `${metadata.title} — ${SITE_NAME}`
    : DEFAULT_SITE_TITLE;
  document.title = title;

  // 2. Meta Description
  const description = sanitizeDescription(metadata.description);
  setMetaTag('name', 'description', description);

  // 3. Keywords
  const keywordsList = Array.from(
    new Set([...(metadata.keywords || []), ...DEFAULT_KEYWORDS])
  ).join(', ');
  setMetaTag('name', 'keywords', keywordsList);

  // 4. Robots indexing
  setMetaTag('name', 'robots', metadata.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  // 5. Canonical URL
  const canonical = metadata.canonicalUrl
    ? getAbsoluteUrl(metadata.canonicalUrl)
    : typeof window !== 'undefined'
    ? window.location.href.split('#')[0]
    : '';
  setLinkTag('canonical', canonical);

  // 6. Open Graph Tags
  setMetaTag('property', 'og:site_name', SITE_NAME);
  setMetaTag('property', 'og:title', metadata.title || SITE_NAME);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:type', metadata.ogType || 'website');
  setMetaTag('property', 'og:url', canonical);

  if (metadata.ogImage) {
    const absoluteImg = getAbsoluteUrl(metadata.ogImage);
    setMetaTag('property', 'og:image', absoluteImg);
    setMetaTag('property', 'og:image:alt', metadata.ogImageAlt || metadata.title || SITE_NAME);
  } else {
    setMetaTag('property', 'og:image', null);
    setMetaTag('property', 'og:image:alt', null);
  }

  // Article specific OG tags
  if (metadata.ogType === 'article') {
    setMetaTag('property', 'article:published_time', metadata.publishedTime || null);
    setMetaTag('property', 'article:modified_time', metadata.modifiedTime || null);
    setMetaTag('property', 'article:author', metadata.author || 'TheLegendsWiki Contributors');
    setMetaTag('property', 'article:section', metadata.section || 'General');

    // Tags
    const tagsMeta = (metadata.tags || []).slice(0, 8);
    tagsMeta.forEach((tag, idx) => {
      setMetaTag('property', `article:tag:${idx}`, tag);
    });
  }

  // 7. Twitter Card
  const twitterCard = metadata.ogImage ? 'summary_large_image' : 'summary';
  setMetaTag('name', 'twitter:card', twitterCard);
  setMetaTag('name', 'twitter:title', metadata.title || SITE_NAME);
  setMetaTag('name', 'twitter:description', description);
  if (metadata.ogImage) {
    setMetaTag('name', 'twitter:image', getAbsoluteUrl(metadata.ogImage));
    setMetaTag('name', 'twitter:image:alt', metadata.ogImageAlt || metadata.title || SITE_NAME);
  } else {
    setMetaTag('name', 'twitter:image', null);
  }

  // 8. JSON-LD Structured Data
  if (metadata.structuredData) {
    setStructuredData(metadata.structuredData);
  } else {
    setStructuredData(null);
  }
}

/**
 * Generates accurate JSON-LD schema for an encyclopedia article
 */
export function generateArticleSchema(article: Article): Record<string, any> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thelegendswiki.org';
  const articleUrl = `${origin}/wiki/${article.slug}`;
  const heroImage = article.featuredImage || article.image;

  // Determine appropriate Schema.org type
  let schemaType = 'Article';
  if (article.articleType === 'person' || article.categorySlug === 'people') {
    schemaType = 'ScholarlyArticle'; // accurate academic profile entry
  } else if (article.articleType === 'science' || article.articleType === 'technology' || article.categorySlug === 'science' || article.categorySlug === 'technology') {
    schemaType = 'TechArticle';
  } else if (article.articleType === 'event' || article.categorySlug === 'history') {
    schemaType = 'HistoricalDocument';
  }

  const wordCount = (
    (article.summary || '') +
    ' ' +
    (article.sections || []).map((s) => (s.content || []).join(' ')).join(' ')
  ).split(/\s+/).filter(Boolean).length;

  const breadcrumbsSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'TheLegendsWiki Main Desk',
        item: `${origin}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: article.category,
        item: `${origin}/category/${article.categorySlug}`,
      },
      ...(article.subCategory
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: article.subCategory,
              item: `${origin}/category/${article.categorySlug}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: article.title,
              item: articleUrl,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 3,
              name: article.title,
              item: articleUrl,
            },
          ]),
    ],
  };

  const articleSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': schemaType === 'HistoricalDocument' ? 'Article' : schemaType,
    headline: article.title,
    name: article.title,
    description: sanitizeDescription(article.summary, 200),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    url: articleUrl,
    datePublished: article.createdAt,
    dateModified: article.updatedAt || article.createdAt,
    inLanguage: 'en-US',
    wordCount: Math.max(120, wordCount),
    articleSection: article.category,
    keywords: [
      article.category,
      article.subCategory || '',
      ...(article.tags || []),
    ].filter(Boolean).join(', '),
    author: {
      '@type': 'Person',
      name: article.author || 'TheLegendsWiki Editorial Contributor',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TheLegendsWiki',
      url: origin,
      logo: {
        '@type': 'ImageObject',
        url: `${origin}/favicon.ico`,
      },
    },
  };

  if (heroImage) {
    articleSchema.image = {
      '@type': 'ImageObject',
      url: getAbsoluteUrl(heroImage),
      caption: article.imageCaption || article.title,
    };
  }

  // Citations / scholarly references in schema
  const citations = article.citations || article.references || [];
  if (citations.length > 0) {
    articleSchema.citation = citations.map((c) => ({
      '@type': 'CreativeWork',
      name: c.title,
      author: c.author ? { '@type': 'Person', name: c.author } : undefined,
      publisher: c.publisher ? { '@type': 'Organization', name: c.publisher } : undefined,
      datePublished: c.year || c.date,
      url: c.url,
    }));
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [breadcrumbsSchema, articleSchema],
  };
}

/**
 * Generates WebSite Schema with SearchAction for Homepage
 */
export function generateWebsiteSchema(): Record<string, any> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thelegendswiki.org';
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TheLegendsWiki',
    url: origin,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${origin}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generates Category / Collection Schema
 */
export function generateCategorySchema(category: Category, articleCount: number = 0): Record<string, any> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thelegendswiki.org';
  const categoryUrl = `${origin}/category/${category.slug}`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${origin}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Disciplines',
            item: `${origin}/category/all`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: category.name,
            item: categoryUrl,
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `${category.name} — Encyclopedia Portal`,
        description: category.description,
        url: categoryUrl,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: articleCount || category.articleCount || 0,
        },
      },
    ],
  };
}
