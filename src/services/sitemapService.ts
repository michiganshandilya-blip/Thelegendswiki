import { Article, Category } from '../types';
import { getPublishedArticles } from './articleService';
import { getCategories } from './categoryService';
import { DEMO_ARTICLES, DEMO_CATEGORIES } from '../data/demoData';

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  title?: string;
  category?: string;
  imageUrl?: string;
  imageCaption?: string;
}

/**
 * Compiles all public indexable URLs into structured sitemap entries
 */
export async function getSitemapEntries(baseUrl?: string): Promise<SitemapEntry[]> {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://thelegendswiki.org');
  const nowIso = new Date().toISOString().split('T')[0];

  let articles: Article[] = [];
  let categories: Category[] = [];

  try {
    const [fetchedArticles, fetchedCategories] = await Promise.all([
      getPublishedArticles({ limitCount: 500 }),
      getCategories(),
    ]);
    articles = fetchedArticles.length > 0 ? fetchedArticles : DEMO_ARTICLES;
    categories = fetchedCategories.length > 0 ? fetchedCategories : DEMO_CATEGORIES;
  } catch (err) {
    console.warn('Error fetching data for sitemap, using demo data fallback:', err);
    articles = DEMO_ARTICLES;
    categories = DEMO_CATEGORIES;
  }

  // Filter ONLY published public articles
  const publicArticles = articles.filter((a) => a.status === 'published');

  const entries: SitemapEntry[] = [];

  // 1. Core Homepage
  entries.push({
    loc: `${origin}/`,
    lastmod: nowIso,
    changefreq: 'daily',
    priority: 1.0,
    title: 'TheLegendsWiki Homepage',
  });

  // 2. Categories Hub
  entries.push({
    loc: `${origin}/category/all`,
    lastmod: nowIso,
    changefreq: 'weekly',
    priority: 0.8,
    title: 'Academic Disciplines & Categories Index',
  });

  // 3. Category Pages
  for (const cat of categories) {
    entries.push({
      loc: `${origin}/category/${cat.slug}`,
      lastmod: nowIso,
      changefreq: 'weekly',
      priority: 0.8,
      title: `${cat.name} Portal`,
      category: cat.name,
    });
  }

  // 4. Public Encyclopedia Articles
  for (const art of publicArticles) {
    const rawDate = art.updatedAt || art.createdAt || nowIso;
    const dateFormatted = rawDate.split('T')[0];
    const image = art.featuredImage || art.image;

    entries.push({
      loc: `${origin}/wiki/${art.slug}`,
      lastmod: dateFormatted,
      changefreq: 'weekly',
      priority: art.featured ? 0.95 : art.popular ? 0.9 : 0.85,
      title: art.title,
      category: art.category,
      imageUrl: image ? (image.startsWith('http') ? image : `${origin}${image}`) : undefined,
      imageCaption: art.imageCaption || art.title,
    });
  }

  // 5. Static Informational Pages
  const staticPages = [
    { path: '/about', title: 'About TheLegendsWiki', priority: 0.4, freq: 'monthly' as const },
    { path: '/contact', title: 'Contact & Editorial Desk', priority: 0.4, freq: 'monthly' as const },
    { path: '/privacy', title: 'Privacy Policy', priority: 0.3, freq: 'yearly' as const },
    { path: '/terms', title: 'Terms of Use', priority: 0.3, freq: 'yearly' as const },
  ];

  for (const page of staticPages) {
    entries.push({
      loc: `${origin}${page.path}`,
      lastmod: nowIso,
      changefreq: page.freq,
      priority: page.priority,
      title: page.title,
    });
  }

  return entries;
}

/**
 * Generates XML Sitemap standard format with Google Image schema extension
 */
export async function generateSitemapXml(baseUrl?: string): Promise<string> {
  const entries = await getSitemapEntries(baseUrl);

  const xmlUrls = entries
    .map((entry) => {
      let xml = `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n`;
      if (entry.lastmod) {
        xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
      }
      xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
      xml += `    <priority>${entry.priority.toFixed(2)}</priority>\n`;

      if (entry.imageUrl) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(entry.imageUrl)}</image:loc>\n`;
        if (entry.imageCaption) {
          xml += `      <image:caption>${escapeXml(entry.imageCaption)}</image:caption>\n`;
        }
        if (entry.title) {
          xml += `      <image:title>${escapeXml(entry.title)}</image:title>\n`;
        }
        xml += `    </image:image>\n`;
      }

      xml += `  </url>`;
      return xml;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlUrls}
</urlset>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
