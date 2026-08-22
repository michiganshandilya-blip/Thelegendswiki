import { useState, useEffect } from 'react';
import { Article, Category, Subcategory } from '../types';
import { getPublishedArticles, getArticleBySlug, incrementArticleViewCount } from '../services/articleService';
import { getCategories, getCategoryBySlug } from '../services/categoryService';
import { DEMO_ARTICLES, DEMO_CATEGORIES, resolveCategoryBySlug as demoResolveCategory } from './demoData';
import { seedDatabaseIfEmpty } from '../services/seedService';

// Automatically attempt background seed on app initialization
let seedAttempted = false;
export function initDatabaseSync() {
  if (!seedAttempted) {
    seedAttempted = true;
    seedDatabaseIfEmpty().catch((err) => console.debug('Seed init notice:', err));
  }
}

/**
 * Hook to retrieve all published articles with real-time or async fallback and layer filtering.
 */
export function useArticles(options?: {
  categorySlug?: string;
  limitCount?: number;
  layer?: 'all' | 'visible' | 'behind_curtains';
  isBehindCurtains?: boolean;
}) {
  const [articles, setArticles] = useState<Article[]>(() => {
    let list = DEMO_ARTICLES;
    if (options?.categorySlug && options.categorySlug !== 'all' && options.categorySlug !== 'behind-the-curtains') {
      list = list.filter((a) => a.categorySlug === options.categorySlug);
    }
    const layer = options?.layer || (options?.isBehindCurtains ? 'behind_curtains' : 'all');
    if (layer === 'behind_curtains' || options?.categorySlug === 'behind-the-curtains') {
      list = list.filter((a) => a.isBehindCurtains);
    } else if (layer === 'visible') {
      list = list.filter((a) => !a.isBehindCurtains);
    }
    if (options?.limitCount) {
      list = list.slice(0, options.limitCount);
    }
    return list;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    initDatabaseSync();

    getPublishedArticles(options)
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setArticles(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load articles');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [options?.categorySlug, options?.limitCount, options?.layer, options?.isBehindCurtains]);

  return { articles, loading, error };
}

function findDemoArticleBySlug(slug: string): Article | null {
  if (!slug) return null;
  const decoded = decodeURIComponent(slug).trim().toLowerCase();
  const normalized = decoded.replace(/[_\s]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
  
  return (
    DEMO_ARTICLES.find((a) => {
      const aSlug = (a.slug || '').toLowerCase();
      const aId = (a.id || '').toLowerCase();
      const aTitleNorm = (a.title || '').toLowerCase().replace(/[_\s]+/g, '-').replace(/[^a-z0-9-]/g, '');
      return (
        aSlug === decoded ||
        aSlug === normalized ||
        aId === decoded ||
        aId === `art-${normalized}` ||
        aTitleNorm === normalized ||
        (a.title && a.title.toLowerCase() === decoded)
      );
    }) || null
  );
}

/**
 * Hook to retrieve an article by slug with automatic view count tracking.
 */
export function useArticle(slug: string) {
  const [article, setArticle] = useState<Article | null>(() => findDemoArticleBySlug(slug));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!slug) {
      setArticle(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Immediately synchronize state with best-effort local match to avoid flash
    const immediateMatch = findDemoArticleBySlug(slug);
    if (immediateMatch) {
      setArticle(immediateMatch);
    }

    initDatabaseSync();

    getArticleBySlug(slug)
      .then((data) => {
        if (isMounted) {
          if (data) {
            setArticle(data);
            incrementArticleViewCount(data.id, slug);
          } else if (immediateMatch) {
            setArticle(immediateMatch);
          } else {
            setArticle(null);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (immediateMatch) {
            setArticle(immediateMatch);
          } else {
            setError(err.message || 'Failed to fetch article');
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { article, loading, error };
}

/**
 * Hook to retrieve all categories.
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    initDatabaseSync();

    getCategories()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setCategories(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch categories');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { categories, loading, error };
}

/**
 * Hook to resolve complex category hierarchies with fallback and Behind the Curtains layer support.
 */
export function useResolvedCategory(
  slug: string,
  options?: { curtainsOnly?: boolean; layer?: 'all' | 'visible' | 'behind_curtains' }
) {
  const isCurtains = Boolean(
    options?.curtainsOnly || 
    options?.layer === 'behind_curtains' || 
    slug === 'behind-the-curtains' || 
    slug === 'curtains'
  );

  const [context, setContext] = useState(() => demoResolveCategory(slug, { curtainsOnly: isCurtains, layer: options?.layer }));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    initDatabaseSync();

    Promise.all([
      getPublishedArticles({ categorySlug: slug !== 'all' ? slug : undefined }),
      getCategoryBySlug(slug),
      getCategories(),
    ])
      .then(([articles, currentCategory, allCategories]) => {
        if (!isMounted) return;

        if (slug === 'all' || slug === 'behind-the-curtains' || slug === 'curtains') {
          setContext(demoResolveCategory(slug, { curtainsOnly: isCurtains, layer: options?.layer }));
          return;
        }

        if (currentCategory) {
          const rawCatArticles = articles.filter((a) => a.categorySlug === slug);
          const baseList = rawCatArticles.length > 0 ? rawCatArticles : DEMO_ARTICLES.filter((a) => a.categorySlug === slug);
          const catArticles = isCurtains ? baseList.filter((a) => a.isBehindCurtains) : baseList;

          setContext({
            category: currentCategory,
            isSubcategory: false,
            isCurtainsLayer: isCurtains,
            activeLayer: isCurtains ? 'behind_curtains' : 'all',
            articles: catArticles,
            popularArticles: catArticles.filter((a) => a.popular).slice(0, 3),
            recentArticles: [...catArticles].sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)).slice(0, 3),
            totalCategoryArticles: baseList.length,
            curtainsArticlesCount: baseList.filter((a) => a.isBehindCurtains).length,
          });
          return;
        }

        // Subcategory search
        for (const parent of allCategories) {
          if (parent.subcategories) {
            const sub = parent.subcategories.find((s) => s.slug === slug);
            if (sub) {
              const rawSubArticles = articles.filter((a) => a.categorySlug === parent.slug);
              const baseList = rawSubArticles.length > 0 ? rawSubArticles : DEMO_ARTICLES.filter((a) => a.categorySlug === parent.slug);
              const subArticles = isCurtains ? baseList.filter((a) => a.isBehindCurtains) : baseList;

              setContext({
                category: undefined,
                subcategory: sub,
                parentCategory: parent,
                isSubcategory: true,
                isCurtainsLayer: isCurtains,
                activeLayer: isCurtains ? 'behind_curtains' : 'all',
                articles: subArticles,
                popularArticles: subArticles.filter((a) => a.popular).slice(0, 3),
                recentArticles: [...subArticles].sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)).slice(0, 3),
                totalCategoryArticles: baseList.length,
                curtainsArticlesCount: baseList.filter((a) => a.isBehindCurtains).length,
              });
              return;
            }
          }
        }

        // Fallback to demo resolver if no match
        setContext(demoResolveCategory(slug, { curtainsOnly: isCurtains, layer: options?.layer }));
      })
      .catch((err) => {
        console.warn('Error resolving category from database:', err);
        if (isMounted) setContext(demoResolveCategory(slug, { curtainsOnly: isCurtains, layer: options?.layer }));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, isCurtains, options?.layer]);

  return { context, loading };
}

/**
 * Hook to retrieve all articles classified in Behind the Curtains
 */
export function useBehindCurtainsArticles(categorySlug?: string) {
  return useArticles({
    categorySlug,
    layer: 'behind_curtains',
    isBehindCurtains: true,
  });
}
