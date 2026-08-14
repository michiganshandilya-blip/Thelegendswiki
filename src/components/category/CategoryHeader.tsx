import React from 'react';
import { Category, Subcategory } from '../../types';
import { getCategoryIcon } from '../common/CategoryCard';
import { useRouter } from '../../context/RouterContext';
import { Layers, ArrowLeft, Terminal } from 'lucide-react';

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
      className="bg-[#0e1422] border border-slate-800 rounded-sm p-5 sm:p-6 shadow-lg shadow-black/40 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-radial from-blue-600/10 via-transparent to-transparent pointer-events-none" />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#141c2e] border border-slate-700/60 rounded-sm shrink-0 text-sky-400 shadow-md">
            {getCategoryIcon(iconName, 28)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-sm border border-sky-500/30 flex items-center gap-1">
                <Terminal size={10} />
                {disciplineTag}
              </span>
              {parentCategory && subcategory && (
                <button
                  type="button"
                  onClick={() => navigate(`/category/${parentCategory.slug}`)}
                  className="text-xs text-slate-400 hover:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft size={11} />
                  <span>Back to {parentCategory.name}</span>
                </button>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-100 leading-tight">
              {title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800 text-right shrink-0">
          <div className="text-left sm:text-right bg-[#141c2e] sm:bg-transparent border sm:border-0 border-slate-800 px-3 py-1.5 sm:p-0 rounded-sm">
            <span className="text-base sm:text-2xl font-bold text-sky-400 font-mono block">
              {totalArticles.toLocaleString()}
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
              indexed entries
            </span>
          </div>

          {!isAllCategories && category?.subcategories && (
            <div className="text-slate-400 text-[11px] font-mono flex items-center gap-1">
              <Layers size={11} className="text-sky-400" />
              <span>{category.subcategories.length} sub-fields</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
