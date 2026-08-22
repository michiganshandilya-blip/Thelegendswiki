import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbItem } from '../../types';
import { useRouter } from '../../context/RouterContext';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const { navigate } = useRouter();

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-[#54595d] overflow-x-auto whitespace-nowrap py-1 ${className}`}>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="hover:text-[#3366cc] inline-flex items-center gap-1 focus:outline-none transition-colors text-[#54595d] cursor-pointer"
        aria-label="TheLegendsWiki Home"
      >
        <Home size={12} className="text-[#72777d]" />
        <span>Main</span>
      </button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight size={11} className="mx-1.5 text-[#a2a9b1] shrink-0" />
            {isLast || !item.path ? (
              <span className="font-semibold text-[#101418] truncate max-w-[220px] sm:max-w-none" aria-current="page">
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => item.path && navigate(item.path)}
                className="hover:text-[#3366cc] hover:underline focus:outline-none text-[#3366cc] transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
