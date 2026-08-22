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
      <div className="flex items-center justify-between border-b border-[#a2a9b1] pb-1.5">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-[#3366cc]" />
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#101418]">
            {isSisterView
              ? `Sub-Disciplines in ${parentCategory?.name || 'Category'}`
              : 'Specialized Sub-Disciplines'}
          </h2>
        </div>
        <span className="text-xs text-[#72777d] font-mono">
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
              className={`p-3 border rounded-sm transition-all cursor-pointer group flex items-start gap-3 shadow-xs ${
                isSelected
                  ? 'bg-blue-50 border-[#3366cc] ring-1 ring-blue-300'
                  : 'bg-[#ffffff] border-[#eaecf0] hover:border-[#3366cc] hover:bg-[#f8f9fa]'
              }`}
            >
              <div
                className={`p-2 rounded-sm border shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-[#3366cc] text-white border-[#2557bb]'
                    : 'bg-[#f8f9fa] border-[#eaecf0] group-hover:border-[#3366cc] text-[#3366cc]'
                }`}
              >
                {getCategoryIcon(sub.iconName, 15)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3
                    className={`text-xs sm:text-sm font-serif font-semibold truncate transition-colors ${
                      isSelected
                        ? 'text-[#3366cc] font-bold'
                        : 'text-[#101418] group-hover:text-[#3366cc]'
                    }`}
                  >
                    {sub.name}
                  </h3>
                  <span
                    className={`text-[10px] font-mono shrink-0 ${
                      isSelected ? 'text-[#3366cc] font-bold' : 'text-[#72777d]'
                    }`}
                  >
                    {sub.articleCount}
                  </span>
                </div>

                {sub.description && (
                  <p className="text-[11px] text-[#54595d] line-clamp-1 mt-0.5 leading-normal font-sans">
                    {sub.description}
                  </p>
                )}
              </div>

              <ChevronRight
                size={13}
                className={`text-[#a2a9b1] group-hover:text-[#3366cc] group-hover:translate-x-0.5 transition-all shrink-0 self-center ${
                  isSelected ? 'text-[#3366cc] font-bold' : ''
                }`}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};
