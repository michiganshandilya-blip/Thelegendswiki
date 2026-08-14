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

export function parsePath(pathname: string, search: string = ''): PageRoute {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const urlParams = new URLSearchParams(search);

  if (cleanPath === '/' || cleanPath === '') {
    return { type: 'home' };
  }

  // /wiki/:slug
  const wikiMatch = cleanPath.match(/^\/wiki\/([^/]+)/);
  if (wikiMatch) {
    return { type: 'wiki', slug: decodeURIComponent(wikiMatch[1]) };
  }

  // /category/:slug
  const catMatch = cleanPath.match(/^\/category\/([^/]+)/);
  if (catMatch) {
    return { type: 'category', slug: decodeURIComponent(catMatch[1]) };
  }

  // /search
  if (cleanPath === '/search') {
    const q = urlParams.get('q') || '';
    const cat = urlParams.get('category') || undefined;
    return { type: 'search', query: q, category: cat };
  }

  // /random
  if (cleanPath === '/random') {
    return { type: 'random' };
  }

  // /login
  if (cleanPath === '/login' || cleanPath === '/signin') {
    return { type: 'login' };
  }

  // /signup or /register
  if (cleanPath === '/signup' || cleanPath === '/register') {
    return { type: 'signup' };
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

  // /user/:username
  const userMatch = cleanPath.match(/^\/user\/([^/]+)/);
  if (userMatch) {
    return { type: 'user', username: decodeURIComponent(userMatch[1]) };
  }

  // /admin
  if (cleanPath === '/admin') {
    return { type: 'admin' };
  }

  // Static pages
  if (cleanPath === '/about') return { type: 'about' };
  if (cleanPath === '/contact') return { type: 'contact' };
  if (cleanPath === '/privacy') return { type: 'privacy' };
  if (cleanPath === '/terms') return { type: 'terms' };

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
    const randomIndex = Math.floor(Math.random() * DEMO_ARTICLES.length);
    return DEMO_ARTICLES[randomIndex]?.slug || 'library-of-alexandria';
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
