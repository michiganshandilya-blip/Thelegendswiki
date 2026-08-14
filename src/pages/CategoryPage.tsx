import React, { useState, useMemo } from 'react';
import { useRouter } from '../context/RouterContext';
import { useResolvedCategory, useCategories } from '../data/dataProvider';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { ArticleCard } from '../components/common/ArticleCard';
import { CategoryCard } from '../components/common/CategoryCard';
import { CategoryHeader } from '../components/category/CategoryHeader';
import { SubcategoryList } from '../components/category/SubcategoryList';
import { CategoryNotFound } from '../components/category/CategoryNotFound';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { 
  Grid, 
  List, 
  Flame, 
  Clock, 
  BookOpen, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Filter
} from 'lucide-react';

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
  const [categoryBrowserQuery, setCategoryBrowserQuery] = useState('');

  const { context: resolved } = useResolvedCategory(slug);
  const { categories: allCategoriesList } = useCategories();

  // If slug is invalid
  if (!resolved) {
    return <CategoryNotFound slug={slug} />;
  }

  const {
    category,
    subcategory,
    parentCategory,
    isSubcategory,
    articles,
    popularArticles,
    recentArticles,
  } = resolved;

  const isAllCategories = slug === 'all';

  // Filter and sort articles for the "All Articles" section
  const processedArticles = useMemo(() => {
    let result = [...articles];

    // Filter by query if user typed into within-category filter
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
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
  }, [articles, filterQuery, sortBy]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(processedArticles.length / ITEMS_PER_PAGE));
  const paginatedArticles = processedArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Filtered categories for "Browse All Categories" view
  const filteredAllCategories = useMemo(() => {
    if (!isAllCategories) return [];
    if (!categoryBrowserQuery.trim()) return allCategoriesList;
    const q = categoryBrowserQuery.toLowerCase();
    return allCategoriesList.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q) ||
        (cat.subcategories &&
          cat.subcategories.some((s) => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)))
    );
  }, [isAllCategories, categoryBrowserQuery, allCategoriesList]);

  // Dynamic breadcrumbs
  const breadcrumbItems = useMemo(() => {
    if (isAllCategories) {
      return [{ label: 'All Categories' }];
    }
    if (isSubcategory && parentCategory && subcategory) {
      return [
        { label: 'Categories', path: '/category/all' },
        { label: parentCategory.name, path: `/category/${parentCategory.slug}` },
        { label: subcategory.name },
      ];
    }
    if (category) {
      return [
        { label: 'Categories', path: '/category/all' },
        { label: category.name },
      ];
    }
    return [{ label: 'Category' }];
  }, [isAllCategories, isSubcategory, parentCategory, subcategory, category]);

  const categoryName = isAllCategories
    ? 'All Categories'
    : subcategory
    ? subcategory.name
    : category?.name || 'Category';

  const subcategoriesToDisplay = isSubcategory
    ? parentCategory?.subcategories
    : category?.subcategories;

  return (
    <div id="category-page" className="space-y-7">
      {/* 1. BREADCRUMBS */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* 2. CATEGORY HEADER */}
      <CategoryHeader
        category={category}
        subcategory={subcategory}
        parentCategory={parentCategory}
        isAllCategories={isAllCategories}
        totalArticles={articles.length}
      />

      {/* 3. BROWSE ALL CATEGORIES DIRECTORY (Shown on /category/all) */}
      {isAllCategories && (
        <section id="all-categories-browser" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-100">
                Core Academic Disciplines
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select a primary discipline or specialized sub-field to explore cataloged articles.
              </p>
            </div>

            {/* Quick search inside categories */}
            <div className="relative w-full sm:w-64">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={categoryBrowserQuery}
                onChange={(e) => setCategoryBrowserQuery(e.target.value)}
                placeholder="Filter disciplines..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0e1422] border border-slate-800 rounded-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAllCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} variant="expanded" />
            ))}
          </div>

          {filteredAllCategories.length === 0 && (
            <div className="py-8 text-center bg-[#0e1422] border border-slate-800 rounded-sm">
              <p className="text-xs text-slate-400">
                No disciplines matching &ldquo;{categoryBrowserQuery}&rdquo;.
              </p>
            </div>
          )}
        </section>
      )}

      {/* 4. SUBCATEGORIES SECTION */}
      {!isAllCategories && subcategoriesToDisplay && subcategoriesToDisplay.length > 0 && (
        <SubcategoryList
          subcategories={subcategoriesToDisplay}
          parentCategory={parentCategory || category}
          currentSubcategorySlug={subcategory?.slug}
        />
      )}

      {/* 5. POPULAR ARTICLES IN CATEGORY */}
      {popularArticles.length > 0 && (
        <section id="popular-articles-section" className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-amber-400" />
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-100">
                Popular in {categoryName}
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              High readership entries
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                layout="popular"
                showImage={true}
                showViews={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* 6. RECENTLY ADDED ARTICLES */}
      {recentArticles.length > 0 && (
        <section id="recent-articles-section" className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-sky-400" />
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-100">
                Recently Updated in {categoryName}
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Latest revisions
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                layout="recent"
                showDate={true}
                showImage={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* 7. ALL ARTICLES IN CATEGORY (With Sort, Layout & Pagination) */}
      <section id="all-category-articles-section" className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-sky-400" />
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-100">
              All {categoryName} Articles
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              ({processedArticles.length})
            </span>
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Input */}
            {articles.length > 3 && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter entries..."
                  value={filterQuery}
                  onChange={(e) => {
                    setFilterQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-7 pr-2 py-1 text-xs bg-[#0e1422] border border-slate-800 rounded-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 w-36 sm:w-44"
                />
                <Filter size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            )}

            {/* Sort Selector */}
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span className="text-slate-500 hidden xs:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-[#0e1422] border border-slate-800 rounded-sm px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="popular">Most Read</option>
                <option value="title">Alphabetical (A–Z)</option>
                <option value="recent">Recently Updated</option>
              </select>
            </div>

            {/* Layout switch */}
            <div className="flex items-center border border-slate-800 rounded-sm overflow-hidden bg-[#0e1422]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 cursor-pointer transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#141c2e] text-sky-400 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Grid layout"
                aria-label="Grid layout"
              >
                <Grid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 cursor-pointer transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#141c2e] text-sky-400 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="List layout"
                aria-label="List layout"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Article Grid / List */}
        {paginatedArticles.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  layout="standard"
                  showImage={true}
                  showDate={sortBy === 'recent'}
                  showViews={true}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  layout="horizontal"
                  showImage={true}
                  showViews={true}
                />
              ))}
            </div>
          )
        ) : (
          /* Empty state */
          <div className="py-6">
            <EmptyState
              title={
                filterQuery
                  ? 'No matching entries'
                  : 'No articles in this category yet'
              }
              description={
                filterQuery
                  ? `No articles in ${categoryName} match "${filterQuery}".`
                  : `There are currently no cataloged articles under ${categoryName}. You can author a new entry or explore other disciplines.`
              }
              actionText={filterQuery ? 'Clear Filter' : 'Browse All Categories'}
              onAction={
                filterQuery
                  ? () => setFilterQuery('')
                  : () => navigate('/category/all')
              }
              iconType="articles"
            />
          </div>
        )}

        {/* 8. PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div
            id="category-pagination"
            className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400"
          >
            <div className="text-slate-500 font-mono">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, processedArticles.length)} of{' '}
              {processedArticles.length} entries
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 h-7"
                aria-label="Previous page"
              >
                <ChevronLeft size={13} />
                <span className="hidden xs:inline ml-1">Previous</span>
              </Button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-sm text-xs font-mono transition-colors cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'text-slate-400 bg-[#0e1422] border border-slate-800 hover:bg-[#141c2e] hover:text-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 h-7"
                aria-label="Next page"
              >
                <span className="hidden xs:inline mr-1">Next</span>
                <ChevronRight size={13} />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
