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
 * Hook to retrieve all published articles with real-time or async fallback.
 */
export function useArticles(options?: { categorySlug?: string; limitCount?: number }) {
  const [articles, setArticles] = useState<Article[]>(() => {
    let list = DEMO_ARTICLES;
    if (options?.categorySlug && options.categorySlug !== 'all') {
      list = list.filter((a) => a.categorySlug === options.categorySlug);
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
  }, [options?.categorySlug, options?.limitCount]);

  return { articles, loading, error };
}

/**
 * Hook to retrieve an article by slug with automatic view count tracking.
 */
export function useArticle(slug: string) {
  const [article, setArticle] = useState<Article | null>(() => {
    return DEMO_ARTICLES.find((a) => a.slug === slug) || null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!slug) {
      setArticle(null);
      setLoading(false);
      return;
    }

    initDatabaseSync();

    getArticleBySlug(slug)
      .then((data) => {
        if (isMounted) {
          setArticle(data);
          if (data) {
            // Non-blocking view count increment
            incrementArticleViewCount(data.id, slug);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch article');
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
 * Hook to resolve complex category hierarchies with fallback.
 */
export function useResolvedCategory(slug: string) {
  const [context, setContext] = useState(() => demoResolveCategory(slug));
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

        if (slug === 'all') {
          setContext({
            category: {
              id: 'cat-all',
              slug: 'all',
              name: 'All Disciplines & Categories',
              description: 'Comprehensive overview of all core knowledge domains and specialist sub-disciplines.',
              iconName: 'Compass',
              articleCount: articles.length || DEMO_ARTICLES.length,
            },
            isSubcategory: false,
            articles: articles.length > 0 ? articles : DEMO_ARTICLES,
            popularArticles: (articles.length > 0 ? articles : DEMO_ARTICLES).filter((a) => a.popular).slice(0, 4),
            recentArticles: [...(articles.length > 0 ? articles : DEMO_ARTICLES)]
              .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
              .slice(0, 4),
          });
          return;
        }

        if (currentCategory) {
          const catArticles = articles.filter((a) => a.categorySlug === slug);
          setContext({
            category: currentCategory,
            isSubcategory: false,
            articles: catArticles.length > 0 ? catArticles : DEMO_ARTICLES.filter((a) => a.categorySlug === slug),
            popularArticles: catArticles.filter((a) => a.popular).slice(0, 3),
            recentArticles: [...catArticles].sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)).slice(0, 3),
          });
          return;
        }

        // Subcategory search
        for (const parent of allCategories) {
          if (parent.subcategories) {
            const sub = parent.subcategories.find((s) => s.slug === slug);
            if (sub) {
              const subArticles = articles.filter((a) => a.categorySlug === parent.slug);
              setContext({
                category: undefined,
                subcategory: sub,
                parentCategory: parent,
                isSubcategory: true,
                articles: subArticles,
                popularArticles: subArticles.filter((a) => a.popular).slice(0, 3),
                recentArticles: [...subArticles].sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)).slice(0, 3),
              });
              return;
            }
          }
        }

        // Fallback to demo resolver if no match
        setContext(demoResolveCategory(slug));
      })
      .catch((err) => {
        console.warn('Error resolving category from database:', err);
        if (isMounted) setContext(demoResolveCategory(slug));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { context, loading };
}
