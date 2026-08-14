import React from 'react';
import { useRouter } from '../../context/RouterContext';

interface NavigationProps {
  className?: string;
  onLinkClick?: () => void;
}

export const NAV_LINKS = [
  { label: 'Main Page', path: '/' },
  { label: 'Categories', path: '/category/all' },
  { label: 'Random', path: '/random' },
  { label: 'Contribute', path: '/create' },
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
    <nav className={`flex items-center gap-5 text-sm font-medium text-slate-400 ${className}`}>
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
            className={`py-1 text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer border-b-2 ${
              isActive
                ? 'text-blue-400 border-blue-500 shadow-[0_1px_12px_rgba(59,130,246,0.4)]'
                : 'border-transparent text-slate-400 hover:text-slate-100 hover:border-slate-600'
            }`}
          >
            {link.label}
          </button>
        );
      })}
    </nav>
  );
};
