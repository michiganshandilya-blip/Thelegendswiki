import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { PageRoute } from '../types';
import { DEMO_ARTICLES } from '../data/demoData';

interface RouterContextType {
  currentRoute: PageRoute;
  currentPath: string;
  navigate: (path: string) => void;
  getRandomArticleSlug: () => string;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

/**
 * Normalizes URL slugs (converts underscores, spaces, uppercase to clean kebab-case)
 */
export function normalizeSlug(rawSlug: string): string {
  return decodeURIComponent(rawSlug)
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parsePath(pathname: string, search: string = ''): PageRoute {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const urlParams = new URLSearchParams(search);

  if (cleanPath === '/' || cleanPath === '') {
    return { type: 'home' };
  }

  // /wiki/:slug OR /article/:slug OR /entry/:slug OR /dossier/:slug (canonical wiki route)
  const wikiMatch = cleanPath.match(/^\/(?:wiki|article|entry|dossier)\/([^/?#]+)/);
  if (wikiMatch) {
    const rawSlug = wikiMatch[1];
    const decoded = decodeURIComponent(rawSlug).trim();
    const slug = normalizeSlug(decoded) || decoded.toLowerCase();
    return { type: 'wiki', slug };
  }

  // /curtains OR /behind-the-curtains (global cross-category curtains portal)
  if (
    cleanPath === '/curtains' ||
    cleanPath === '/behind-the-curtains' ||
    cleanPath === '/behind-curtains' ||
    cleanPath === '/category/behind-the-curtains' ||
    cleanPath === '/category/curtains'
  ) {
    return { type: 'category', slug: 'behind-the-curtains', curtains: true };
  }

  // /category/:slug/curtains OR /category/:slug/behind-the-curtains (category-specific curtains layer)
  const catCurtainsMatch = cleanPath.match(/^\/(?:category|categories|topic|discipline)\/([^/]+)\/(?:curtains|behind-the-curtains|behind-curtains)/);
  if (catCurtainsMatch) {
    const rawSlug = catCurtainsMatch[1];
    const slug = normalizeSlug(rawSlug) || decodeURIComponent(rawSlug).toLowerCase();
    return { type: 'category', slug, curtains: true };
  }

  // /category/:slug OR /topic/:slug OR /discipline/:slug
  const catMatch = cleanPath.match(/^\/(?:category|categories|topic|discipline)\/([^/]+)/);
  if (catMatch) {
    const rawSlug = catMatch[1];
    const slug = normalizeSlug(rawSlug) || decodeURIComponent(rawSlug).toLowerCase();
    const hasCurtainsParam = urlParams.get('curtains') === 'true' || urlParams.get('layer') === 'behind_curtains' || urlParams.get('layer') === 'behind-the-curtains';
    return { type: 'category', slug, curtains: hasCurtainsParam || slug === 'behind-the-curtains' };
  }

  // /search
  if (cleanPath === '/search') {
    const q = urlParams.get('q') || '';
    const cat = urlParams.get('category') || undefined;
    const layerParam = urlParams.get('layer');
    const layer = (layerParam === 'behind_curtains' || layerParam === 'behind-the-curtains' || urlParams.get('curtains') === 'true')
      ? 'behind_curtains'
      : (layerParam === 'visible' ? 'visible' : 'all');
    return { type: 'search', query: q, category: cat, layer };
  }

  // /random
  if (cleanPath === '/random') {
    return { type: 'random' };
  }

  // /sitemap OR /sitemap.xml
  if (cleanPath === '/sitemap' || cleanPath === '/sitemap.xml') {
    return { type: 'sitemap' };
  }

  // /login
  if (cleanPath === '/login' || cleanPath === '/signin') {
    return { type: 'login' };
  }

  // /signup or /register
  if (cleanPath === '/signup' || cleanPath === '/register') {
    return { type: 'signup' };
  }

  // /forgot-password or /recover-password or /forgot
  if (
    cleanPath === '/forgot-password' ||
    cleanPath === '/forgot' ||
    cleanPath === '/recover-password' ||
    (cleanPath === '/login' && urlParams.get('mode') === 'forgotPassword')
  ) {
    return { type: 'forgot-password' };
  }

  // /reset-password or Firebase Auth handler (/auth/action or URL with oobCode)
  const oobCode = urlParams.get('oobCode') || '';
  const mode = urlParams.get('mode') || '';
  if (
    cleanPath === '/reset-password' ||
    cleanPath === '/auth/action' ||
    cleanPath === '/password-reset' ||
    (oobCode && mode === 'resetPassword') ||
    (cleanPath === '/reset-password' && oobCode)
  ) {
    return {
      type: 'reset-password',
      oobCode: oobCode || undefined,
      mode: mode || (oobCode ? 'resetPassword' : undefined),
    };
  }

  // /create
  if (cleanPath === '/create') {
    return { type: 'create' };
  }

  // /my-articles or /contributions
  if (cleanPath === '/my-articles' || cleanPath === '/contributions') {
    return { type: 'my-articles' };
  }

  // /edit/:slug
  const editMatch = cleanPath.match(/^\/edit\/([^/]+)/);
  if (editMatch) {
    return { type: 'edit', slug: decodeURIComponent(editMatch[1]) };
  }

  // /user/:username OR /profile/:username OR /scholar/:username OR /contributor/:username
  const userMatch = cleanPath.match(/^\/(?:user|profile|scholar|contributor)\/([^/]+)/);
  if (userMatch) {
    const rawUsername = decodeURIComponent(userMatch[1]).replace(/^@+/, '').trim();
    return { type: 'user', username: rawUsername };
  }

  // Direct profile dashboard aliases without username: /profile, /profile-dashboard, /my-profile, /user
  if (
    cleanPath === '/profile' ||
    cleanPath === '/profile-dashboard' ||
    cleanPath === '/my-profile' ||
    cleanPath === '/user' ||
    cleanPath === '/scholar' ||
    cleanPath === '/contributor'
  ) {
    return { type: 'user', username: '' };
  }

  // /super-admin OR /superadmin OR /super-admin/:tab
  const superAdminMatch = cleanPath.match(/^\/(?:super-admin|superadmin)(?:\/([a-zA-Z0-9_-]+))?/);
  if (superAdminMatch) {
    const rawTab = superAdminMatch[1] as any;
    return { type: 'super-admin', tab: rawTab };
  }

  // /admin OR /admin/:tab OR /governance
  const adminMatch = cleanPath.match(/^\/(?:admin|governance)(?:\/([a-zA-Z0-9_-]+))?/);
  if (adminMatch) {
    const rawTab = adminMatch[1] as any;
    return { type: 'admin', tab: rawTab };
  }

  // Static & Policy pages
  if (cleanPath === '/about' || cleanPath === '/about-us') return { type: 'about' };
  if (cleanPath === '/contact' || cleanPath === '/contact-us' || cleanPath === '/errata') return { type: 'contact' };
  if (cleanPath === '/privacy' || cleanPath === '/privacy-policy' || cleanPath === '/data-privacy') return { type: 'privacy' };
  if (cleanPath === '/terms' || cleanPath === '/terms-of-use' || cleanPath === '/terms-of-service') return { type: 'terms' };
  if (cleanPath === '/editorial-policy' || cleanPath === '/editorial-standards' || cleanPath === '/editorial-guidelines') return { type: 'editorial-policy' };
  if (cleanPath === '/content-policy' || cleanPath === '/community-guidelines' || cleanPath === '/content-standards') return { type: 'content-policy' };

  return { type: 'notFound' };
}

export const RouterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname + window.location.search;
  });

  const [currentRoute, setCurrentRoute] = useState<PageRoute>(() => {
    return parsePath(window.location.pathname, window.location.search);
  });

  const getRandomArticleSlug = useCallback(() => {
    if (!DEMO_ARTICLES || DEMO_ARTICLES.length === 0) return 'albert-einstein';
    const randomIndex = Math.floor(Math.random() * DEMO_ARTICLES.length);
    return DEMO_ARTICLES[randomIndex]?.slug || DEMO_ARTICLES[0]?.slug || 'albert-einstein';
  }, []);

  const navigate = useCallback((path: string) => {
    if (path === '/random') {
      const randomSlug = getRandomArticleSlug();
      navigate(`/wiki/${randomSlug}`);
      return;
    }

    if (window.location.pathname + window.location.search !== path) {
      window.history.pushState({}, '', path);
    }
    const [pathname, search] = path.split('?');
    setCurrentPath(path);
    setCurrentRoute(parsePath(pathname || '/', search ? `?${search}` : ''));
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [getRandomArticleSlug]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname + window.location.search;
      setCurrentPath(path);
      setCurrentRoute(parsePath(window.location.pathname, window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <RouterContext.Provider value={{ currentRoute, currentPath, navigate, getRandomArticleSlug }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};
