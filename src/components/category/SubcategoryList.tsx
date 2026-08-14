import React from 'react';
import { Subcategory, Category } from '../../types';
import { useRouter } from '../../context/RouterContext';
import { getCategoryIcon } from '../common/CategoryCard';
import { ChevronRight, Layers } from 'lucide-react';

interface SubcategoryListProps {
  subcategories?: Subcategory[];
  parentCategory?: Category;
  currentSubcategorySlug?: string;
  className?: string;
}

export const SubcategoryList: React.FC<SubcategoryListProps> = ({
  subcategories = [],
  parentCategory,
  currentSubcategorySlug,
  className = '',
}) => {
  const { navigate } = useRouter();

  if (!subcategories || subcategories.length === 0) {
    return null;
  }

  const isSisterView = Boolean(currentSubcategorySlug);

  return (
    <section id="subcategories-section" className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-sky-400" />
          <h2 className="font-display text-base sm:text-lg font-bold text-slate-100">
            {isSisterView
              ? `Sub-Disciplines in ${parentCategory?.name || 'Category'}`
              : 'Specialized Sub-Disciplines'}
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {subcategories.length} areas
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {subcategories.map((sub) => {
          const isSelected = sub.slug === currentSubcategorySlug;

          return (
            <div
              key={sub.id || sub.slug}
              onClick={() => navigate(`/category/${sub.slug}`)}
              className={`p-3 border rounded-sm transition-all cursor-pointer group flex items-start gap-3 ${
                isSelected
                  ? 'bg-sky-950/40 border-sky-500/50 ring-1 ring-sky-500/30'
                  : 'bg-[#0e1422] border-slate-800 hover:border-slate-700 hover:bg-[#141c2e]'
              }`}
            >
              <div
                className={`p-2 rounded-sm border shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                    : 'bg-[#141c2e] border-slate-700/60 group-hover:bg-slate-800 group-hover:border-sky-500/40 text-sky-400'
                }`}
              >
                {getCategoryIcon(sub.iconName, 15)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3
                    className={`text-xs sm:text-sm font-semibold truncate transition-colors ${
                      isSelected
                        ? 'text-sky-300 font-bold'
                        : 'text-slate-200 group-hover:text-sky-400'
                    }`}
                  >
                    {sub.name}
                  </h3>
                  <span
                    className={`text-[10px] font-mono shrink-0 ${
                      isSelected ? 'text-sky-400 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {sub.articleCount}
                  </span>
                </div>

                {sub.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 leading-normal">
                    {sub.description}
                  </p>
                )}
              </div>

              <ChevronRight
                size={13}
                className={`text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all shrink-0 self-center ${
                  isSelected ? 'text-sky-400 font-bold' : ''
                }`}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};
