import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { Sparkles, Key, Landmark, TrendingDown, FileCheck2, Compass } from 'lucide-react';

interface NavigationProps {
  className?: string;
  onLinkClick?: () => void;
}

export const NAV_LINKS = [
  { label: 'Behind the Curtains', path: '/', isPrimary: true },
  { label: 'Behind Financial Markets', path: '/category/behind-financial-markets' },
  { label: 'Behind Corporations', path: '/category/behind-corporations' },
  { label: 'Behind History', path: '/category/behind-history' },
  { label: 'Behind the Evidence', path: '/category/behind-the-evidence' },
  { label: 'Behind the Mysteries', path: '/category/behind-the-mysteries' },
];

export const Navigation: React.FC<NavigationProps> = ({ className = '', onLinkClick }) => {
  const { currentPath, navigate, getRandomArticleSlug } = useRouter();

  const handleClick = (path: string) => {
    if (path === '/random') {
      const slug = getRandomArticleSlug();
      navigate(`/wiki/${slug}`);
    } else {
      navigate(path);
    }
    if (onLinkClick) onLinkClick();
  };

  return (
    <nav className={`flex items-center gap-1 sm:gap-2 text-xs font-medium text-[#54595d] ${className}`}>
      {NAV_LINKS.map((link) => {
        const isActive =
          link.path === '/'
            ? currentPath === '/'
            : currentPath.startsWith(link.path);

        return (
          <button
            key={link.path}
            type="button"
            onClick={() => handleClick(link.path)}
            className={`py-1 px-2.5 rounded-sm transition-all cursor-pointer text-xs font-serif ${
              isActive
                ? 'text-amber-900 bg-amber-50/90 font-bold border border-amber-300/80 shadow-2xs'
                : 'text-[#475569] hover:text-[#0f172a] hover:bg-slate-100/80 border border-transparent'
            }`}
          >
            {link.label}
          </button>
        );
      })}
    </nav>
  );
};
