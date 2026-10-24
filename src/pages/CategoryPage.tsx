import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useResolvedCategory, useCategories } from '../data/dataProvider';
import { useSEO } from '../hooks/useSEO';
import { generateCategorySchema } from '../lib/seo';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { ArticleCard } from '../components/common/ArticleCard';
import { CategoryCard } from '../components/common/CategoryCard';
import { CategoryHeader } from '../components/category/CategoryHeader';
import { CategoryNotFound } from '../components/category/CategoryNotFound';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { Button } from '../components/common/Button';
import { 
  Grid, 
  List, 
  Clock, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Sparkles,
  ShieldCheck,
  Compass,
  FileCheck2,
  Scale,
  Hammer,
  Cpu,
  TrendingDown,
  EyeOff
} from 'lucide-react';
import { KnowledgeDepth } from '../types';

interface CategoryPageProps {
  slug: string;
}

const ITEMS_PER_PAGE = 6;

export const CategoryPage: React.FC<CategoryPageProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'popular' | 'title' | 'recent'>('popular');
  const [filterQuery, setFilterQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');

  const { context: resolved, loading } = useResolvedCategory(slug, { curtainsOnly: true });
  const { categories: allCategoriesList } = useCategories();

  const isAllDossiers = slug === 'all' || slug === 'behind-the-curtains' || slug === 'curtains';

  const categoryName = isAllDossiers
    ? 'All Behind-the-Curtains Dossiers'
    : resolved?.subcategory
    ? resolved.subcategory.name
    : resolved?.category?.name || 'Curtain Dimension';

  // Dynamic SEO Injection for Category
  useSEO(
    resolved && (resolved.category || resolved.subcategory || isAllDossiers)
      ? {
          title: `${categoryName} — Behind the Curtains Codex`,
          description: resolved.category?.description || resolved.subcategory?.description || `Explore cataloged Behind-the-Curtains records and investigative dossiers in ${categoryName}.`,
          keywords: [
            categoryName,
            'behind the curtains',
            'investigative dossiers',
            'declassified archives',
            'hidden history',
            'uncredited creators',
          ],
          canonicalUrl: `/category/${slug}`,
          ogType: 'website',
          structuredData: resolved.category ? generateCategorySchema(resolved.category, resolved.articles.length) : undefined,
        }
      : {
          title: 'Dossier Not Found',
          description: 'The requested Behind-the-Curtains facet could not be found.',
          noindex: true,
        },
    [slug, categoryName, resolved?.articles?.length]
  );

  const articles = resolved?.articles || [];
  const category = resolved?.category;
  const subcategory = resolved?.subcategory;
  const parentCategory = resolved?.parentCategory;
  const isSubcategory = resolved?.isSubcategory;
  const popularArticles = resolved?.popularArticles || [];
  const recentArticles = resolved?.recentArticles || [];

  // Filter and sort articles (unconditional Hook)
  const processedArticles = useMemo(() => {
    if (!articles.length) return [];
    let result = [...articles];

    // Subcategory filter if active
    if (selectedSubcategory !== 'all') {
      result = result.filter(
        (a) =>
          a.subCategory?.toLowerCase() === selectedSubcategory.toLowerCase() ||
          a.tags.some((t) => t.toLowerCase() === selectedSubcategory.toLowerCase())
      );
    }

    // Search query filter
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)) ||
          (a.behindCurtainsContext && a.behindCurtainsContext.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'popular') return b.views - a.views;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'recent') return b.lastUpdated.localeCompare(a.lastUpdated);
      return 0;
    });

    return result;
  }, [articles, filterQuery, sortBy, selectedSubcategory]);

  // Dynamic breadcrumbs (unconditional Hook)
  const breadcrumbItems = useMemo(() => {
    if (isAllDossiers) {
      return [{ label: 'Behind the Curtains' }, { label: 'All Dossiers' }];
    }
    if (isSubcategory && parentCategory && subcategory) {
      return [
        { label: 'Behind the Curtains', path: '/' },
        { label: parentCategory.name, path: `/category/${parentCategory.slug}` },
        { label: subcategory.name },
      ];
    }
    if (category) {
      return [
        { label: 'Behind the Curtains', path: '/' },
        { label: category.name },
      ];
    }
    return [{ label: 'Investigation' }];
  }, [isAllDossiers, isSubcategory, parentCategory, subcategory, category]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(processedArticles.length / ITEMS_PER_PAGE));
  const paginatedArticles = processedArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const availableSubcategories = isSubcategory
    ? parentCategory?.subcategories
    : category?.subcategories;

  if (loading && !resolved) {
    return <LoadingState type="category" />;
  }

  // If slug is invalid
  if (!resolved) {
    return <CategoryNotFound slug={slug} />;
  }

  return (
    <div id="category-page" className="space-y-6 pb-10">
      {/* 1. BREADCRUMBS */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* 2. CATEGORY HEADER */}
      <header className="curtains-atmosphere border border-amber-500/40 text-slate-100 rounded-sm p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-3">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600/30 via-amber-400 to-amber-600/30" />
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-xs border border-amber-400/40 inline-flex items-center gap-1.5 shadow-xs">
              <Sparkles size={11} className="text-amber-400" />
              <span>Behind the Curtains Investigation</span>
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-xs text-slate-400 font-mono">
              {articles.length} Classified Dossiers
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-slate-100">
            {categoryName}
          </h1>

          <p className="text-amber-200/90 font-serif italic text-sm sm:text-base">
            &ldquo;Revealing what happened behind closed doors, decisions, and finished creations.&rdquo;
          </p>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
            {category?.description || subcategory?.description || 'All records and investigations published under strict forensic standards.'}
          </p>
        </div>
      </header>

      {/* 3. SUBCATEGORY PILLS */}
      {availableSubcategories && availableSubcategories.length > 0 && (
        <div className="bg-white border border-[#cbd5e1] p-3 rounded-sm flex flex-wrap items-center gap-2 shadow-xs">
          <span className="text-xs font-mono uppercase font-bold text-slate-500 mr-2">
            Sub-Facets:
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedSubcategory('all');
              setCurrentPage(1);
            }}
            className={`text-xs px-2.5 py-1 rounded-xs font-medium transition-all cursor-pointer ${
              selectedSubcategory === 'all'
                ? 'bg-amber-800 text-white font-bold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Sub-Facets ({articles.length})
          </button>
          {availableSubcategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => {
                setSelectedSubcategory(sub.name);
                setCurrentPage(1);
              }}
              className={`text-xs px-2.5 py-1 rounded-xs font-medium transition-all cursor-pointer ${
                selectedSubcategory.toLowerCase() === sub.name.toLowerCase()
                  ? 'bg-amber-800 text-white font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* 4. FILTER & CONTROLS BAR */}
      <div className="bg-white border border-[#cbd5e1] rounded-sm p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => {
              setFilterQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={`Filter inside ${categoryName}...`}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xs focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all font-sans"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-mono">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-xs px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-amber-600 cursor-pointer"
            >
              <option value="popular">Most Studied</option>
              <option value="recent">Recent Disclosures</option>
              <option value="title">Alphabetical (A–Z)</option>
            </select>
          </div>

          <div className="flex items-center border border-slate-300 rounded-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-amber-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'} transition-colors cursor-pointer`}
              title="Grid View"
            >
              <Grid size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-amber-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'} transition-colors cursor-pointer`}
              title="List View"
            >
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. ARTICLES LIST / GRID */}
      {processedArticles.length === 0 ? (
        <EmptyState
          title="No Behind-the-Curtains Records Found"
          message={`No documented investigations matched your search filter "${filterQuery}".`}
          actionLabel="Clear Filter"
          onAction={() => {
            setFilterQuery('');
            setSelectedSubcategory('all');
          }}
        />
      ) : (
        <div className="space-y-4">
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }
          >
            {paginatedArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                layout={viewMode === 'grid' ? 'vertical' : 'horizontal'}
                showImage={true}
                showViews={true}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-600">
              <span className="font-mono">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, processedArticles.length)} of{' '}
                {processedArticles.length} investigations
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  icon={<ChevronLeft size={13} />}
                >
                  Previous
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-xs font-mono text-xs cursor-pointer transition-colors ${
                      currentPage === pageNum
                        ? 'bg-amber-800 text-white font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  icon={<ChevronRight size={13} />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
