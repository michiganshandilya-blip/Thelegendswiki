import { useState, useEffect } from 'react';
import { Article, Category, Subcategory, ArticleStatus } from '../types';
import {
  getPublishedArticles,
  subscribeToArticles,
  getArticleBySlug,
  getArticleBySlugOrId,
  incrementArticleViewCount,
  isArticleDeleted,
} from '../services/articleService';
import { getCategories, getCategoryBySlug } from '../services/categoryService';
import { DEMO_ARTICLES, DEMO_CATEGORIES, resolveCategoryBySlug as demoResolveCategory } from './demoData';
import { seedDatabaseIfEmpty } from '../services/seedService';
import { isFirebaseConfigured } from '../lib/firebase';

// Automatically attempt background seed on app initialization
let seedAttempted = false;
export function initDatabaseSync() {
  if (!seedAttempted) {
    seedAttempted = true;
    seedDatabaseIfEmpty().catch((err) => console.debug('Seed init notice:', err));
  }
}

/**
 * Hook to retrieve published articles with real-time Firestore synchronization.
 */
export function useArticles(options?: {
  categorySlug?: string;
  limitCount?: number;
  layer?: 'all' | 'visible' | 'behind_curtains';
  isBehindCurtains?: boolean;
  status?: ArticleStatus | 'all';
  includeAllStatuses?: boolean;
}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    initDatabaseSync();

    const unsubscribe = subscribeToArticles(
      (data) => {
        if (isMounted) {
          setArticles(data || []);
          setLoading(false);
        }
      },
      options,
      (err) => {
        if (isMounted) {
          setError(err?.message || 'Failed to load articles');
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [
    options?.categorySlug,
    options?.limitCount,
    options?.layer,
    options?.isBehindCurtains,
    options?.status,
    options?.includeAllStatuses,
  ]);

  return { articles, loading, error };
}

function findDemoArticleBySlug(slug: string): Article | null {
  if (!slug) return null;
  if (isArticleDeleted(slug)) return null;

  const decoded = decodeURIComponent(slug).trim().toLowerCase();
  const normalized = decoded.replace(/[_\s]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
  if (isArticleDeleted(decoded) || isArticleDeleted(normalized)) return null;
  
  const match = DEMO_ARTICLES.find((a) => {
    if (isArticleDeleted(a)) return false;
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
  }) || null;

  if (match && isArticleDeleted(match)) return null;
  return match;
}

/**
 * Hook to retrieve an article by slug with automatic view count tracking.
 */
export function useArticle(slug: string) {
  const isDeleted = isArticleDeleted(slug);
  const [article, setArticle] = useState<Article | null>(() => {
    if (!slug || isDeleted) return null;
    return findDemoArticleBySlug(slug);
  });
  const [loading, setLoading] = useState<boolean>(!isDeleted && Boolean(slug));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!slug || isArticleDeleted(slug)) {
      setArticle(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Immediately synchronize state with best-effort local match only if not marked deleted
    const immediateMatch = findDemoArticleBySlug(slug);
    if (immediateMatch && !isArticleDeleted(immediateMatch)) {
      setArticle(immediateMatch);
    } else {
      setArticle(null);
    }

    initDatabaseSync();

    getArticleBySlugOrId(slug)
      .then((data) => {
        if (isMounted) {
          if (data && !isArticleDeleted(data)) {
            setArticle(data);
            incrementArticleViewCount(data.id, data.slug || slug);
          } else if (immediateMatch && !isArticleDeleted(immediateMatch)) {
            setArticle(immediateMatch);
          } else {
            setArticle(null);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (immediateMatch && !isArticleDeleted(immediateMatch)) {
            setArticle(immediateMatch);
          } else {
            setArticle(null);
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

  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    let currentCategory: Category | null = null;
    let allCategories: Category[] = [];
    let latestArticles: Article[] = [];

    const sortByRecent = (list: Article[]) =>
      [...list].sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

    const buildCategoryContext = (articles: Article[]) => {
      if (!isMounted) return;

      if (slug === 'all' || slug === 'behind-the-curtains' || slug === 'curtains') {
        const catArticles = isCurtains ? articles.filter((a) => a.isBehindCurtains !== false) : articles;
        setContext({
          category: {
            id: 'cat-behind-the-curtains-master',
            slug: 'behind-the-curtains',
            name: 'Behind the Curtains',
            description: 'The Open Knowledge Codex dedicated exclusively to revealing what happens behind the scenes, behind closed doors, behind public images, and behind finished stories.',
            iconName: 'Sparkles',
            articleCount: catArticles.length,
            featuredArticleSlug: catArticles[0]?.slug,
          },
          isSubcategory: false,
          isCurtainsLayer: isCurtains,
          activeLayer: isCurtains ? 'behind_curtains' : 'all',
          articles: catArticles,
          popularArticles: catArticles.filter((a) => a.popular).slice(0, 4),
          recentArticles: sortByRecent(catArticles).slice(0, 4),
          totalCategoryArticles: articles.length,
          curtainsArticlesCount: catArticles.length,
        });
        setLoading(false);
        return;
      }

      const sClean = (slug || '').toLowerCase();

      if (currentCategory) {
        const catNameClean = (currentCategory.name || '').toLowerCase();
        const rawCatArticles = articles.filter((a) => {
          const aCatSlug = (a.categorySlug || '').toLowerCase();
          const aCatName = (a.category || '').toLowerCase();
          const inCats = Array.isArray(a.categories) && a.categories.some((c) => c && c.toLowerCase() === sClean);
          return aCatSlug === sClean || aCatName === catNameClean || inCats || (sClean && aCatSlug.includes(sClean));
        });
        const catArticles = isCurtains ? rawCatArticles.filter((a) => a.isBehindCurtains !== false) : rawCatArticles;

        setContext({
          category: currentCategory,
          isSubcategory: false,
          isCurtainsLayer: isCurtains,
          activeLayer: isCurtains ? 'behind_curtains' : 'all',
          articles: catArticles,
          popularArticles: catArticles.filter((a) => a.popular).slice(0, 3),
          recentArticles: sortByRecent(catArticles).slice(0, 3),
          totalCategoryArticles: rawCatArticles.length,
          curtainsArticlesCount: catArticles.length,
        });
        setLoading(false);
        return;
      }

      // Subcategory search
      for (const parent of allCategories) {
        if (parent.subcategories) {
          const sub = parent.subcategories.find((s) => s.slug === slug);
          if (sub) {
            const subNameClean = (sub.name || '').toLowerCase();
            const rawSubArticles = articles.filter(
              (a) =>
                (a.subCategory && a.subCategory.toLowerCase() === subNameClean) ||
                (a.categorySlug && a.categorySlug.toLowerCase() === parent.slug.toLowerCase())
            );
            const subArticles = isCurtains ? rawSubArticles.filter((a) => a.isBehindCurtains !== false) : rawSubArticles;

            setContext({
              category: undefined,
              subcategory: sub,
              parentCategory: parent,
              isSubcategory: true,
              isCurtainsLayer: isCurtains,
              activeLayer: isCurtains ? 'behind_curtains' : 'all',
              articles: subArticles,
              popularArticles: subArticles.filter((a) => a.popular).slice(0, 3),
              recentArticles: sortByRecent(subArticles).slice(0, 3),
              totalCategoryArticles: rawSubArticles.length,
              curtainsArticlesCount: subArticles.length,
            });
            setLoading(false);
            return;
          }
        }
      }

      if (!isFirebaseConfigured()) {
        setContext(demoResolveCategory(slug, { curtainsOnly: isCurtains, layer: options?.layer }));
      }
      setLoading(false);
    };

    // Pre-load taxonomy
    Promise.all([getCategoryBySlug(slug), getCategories()]).then(([cat, allCats]) => {
      if (!isMounted) return;
      currentCategory = cat;
      allCategories = allCats;
      buildCategoryContext(latestArticles);
    });

    // Real-time subscription to articles
    const unsubscribe = subscribeToArticles((liveArticles) => {
      if (!isMounted) return;
      latestArticles = liveArticles;
      if (!currentCategory && slug !== 'all' && slug !== 'behind-the-curtains' && slug !== 'curtains') {
        getCategoryBySlug(slug).then((cat) => {
          if (!isMounted) return;
          currentCategory = cat;
          getCategories().then((allCats) => {
            if (!isMounted) return;
            allCategories = allCats;
            buildCategoryContext(liveArticles);
          });
        });
      } else {
        buildCategoryContext(liveArticles);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
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
