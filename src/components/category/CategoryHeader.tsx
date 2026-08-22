import React from 'react';
import { Category, Subcategory } from '../../types';
import { getCategoryIcon } from '../common/CategoryCard';
import { useRouter } from '../../context/RouterContext';
import { Layers, ArrowLeft } from 'lucide-react';

interface CategoryHeaderProps {
  category?: Category;
  subcategory?: Subcategory;
  parentCategory?: Category;
  isAllCategories?: boolean;
  totalArticles: number;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  category,
  subcategory,
  parentCategory,
  isAllCategories = false,
  totalArticles,
}) => {
  const { navigate } = useRouter();

  const title = isAllCategories
    ? 'All Knowledge Disciplines & Categories'
    : subcategory
    ? subcategory.name
    : category?.name;

  const description = isAllCategories
    ? 'Explore all 13 core academic disciplines, specialized sub-fields, and interdisciplinary domains cataloged in TheLegendsWiki registry.'
    : subcategory
    ? subcategory.description || `Specialized sub-field within the ${parentCategory?.name || 'encyclopedia'} discipline.`
    : category?.description;

  const iconName = isAllCategories
    ? 'Compass'
    : subcategory
    ? subcategory.iconName || parentCategory?.iconName
    : category?.iconName;

  const disciplineTag = isAllCategories
    ? 'Master Directory'
    : subcategory
    ? `Sub-Discipline / ${parentCategory?.name || 'Domain'}`
    : 'Core Discipline';

  return (
    <header
      id="category-header-container"
      className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-5 sm:p-6 shadow-xs relative"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm shrink-0 text-[#3366cc] shadow-xs">
            {getCategoryIcon(iconName, 26)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-[#3366cc] bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
                {disciplineTag}
              </span>
              {parentCategory && subcategory && (
                <button
                  type="button"
                  onClick={() => navigate(`/category/${parentCategory.slug}`)}
                  className="text-xs text-[#54595d] hover:text-[#3366cc] hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft size={11} />
                  <span>Back to {parentCategory.name}</span>
                </button>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#101418] leading-tight">
              {title}
            </h1>

            <p className="text-xs sm:text-sm text-[#54595d] mt-2 max-w-2xl leading-relaxed font-sans">
              {description}
            </p>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#eaecf0] text-right shrink-0">
          <div className="text-left sm:text-right bg-[#f8f9fa] sm:bg-transparent border sm:border-0 border-[#eaecf0] px-3 py-1.5 sm:p-0 rounded-sm">
            <span className="text-base sm:text-2xl font-bold text-[#101418] font-mono block">
              {totalArticles.toLocaleString()}
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#72777d]">
              indexed entries
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
