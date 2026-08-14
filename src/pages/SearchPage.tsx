import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useArticles, useCategories } from '../data/dataProvider';
import { SearchBar } from '../components/common/SearchBar';
import { ArticleCard } from '../components/common/ArticleCard';
import { EmptyState } from '../components/common/EmptyState';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Filter } from 'lucide-react';

interface SearchPageProps {
  query: string;
  categoryFilter?: string;
}

export const SearchPage: React.FC<SearchPageProps> = ({ query: initialQuery, categoryFilter: initialCategory }) => {
  const { navigate } = useRouter();
  const { articles } = useArticles();
  const { categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');

  useEffect(() => {
    setSelectedCategory(initialCategory || 'all');
  }, [initialCategory]);

  const rawQuery = initialQuery.trim().toLowerCase();

  const filteredArticles = articles.filter((article) => {
    const matchesCategory =
      selectedCategory === 'all' || article.categorySlug === selectedCategory;

    if (!rawQuery) {
      return matchesCategory;
    }

    const inTitle = article.title.toLowerCase().includes(rawQuery);
    const inSummary = article.summary.toLowerCase().includes(rawQuery);
    const inCategory = article.category.toLowerCase().includes(rawQuery);
    const inTags = (article.tags || []).some((t) => t.toLowerCase().includes(rawQuery));
    const inSections = (article.sections || []).some(
      (s) =>
        s.title.toLowerCase().includes(rawQuery) ||
        (s.content || []).some((p) => p.toLowerCase().includes(rawQuery))
    );

    return matchesCategory && (inTitle || inSummary || inCategory || inTags || inSections);
  });

  const breadcrumbs = [
    { label: 'Search Results' },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      {/* Search Header */}
      <section className="bg-[#0e1422] border border-slate-800 rounded-sm p-6 space-y-4 shadow-xl shadow-black/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-blue-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-2xl relative z-10">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400 mb-1">
            Global Search Engine
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
            Encyclopedia Search
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
            Search entries across all historical archives, scientific discoveries, biographical profiles, and disciplines.
          </p>
          <SearchBar
            size="large"
            initialQuery={initialQuery}
            onSearchSubmit={(newQ) => navigate(`/search?q=${encodeURIComponent(newQ)}`)}
          />
        </div>

        {/* Filter by category pills */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-xs relative z-10">
          <span className="font-mono text-slate-500 uppercase text-[10px] tracking-wider mr-1 flex items-center gap-1">
            <Filter size={11} className="text-sky-400" /> Filter discipline:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-sm text-xs transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'bg-[#141c2e] border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            All Disciplines
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-2.5 py-1 rounded-sm text-xs transition-colors cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'bg-[#141c2e] border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Search results list */}
      <section className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="font-display text-lg font-bold text-slate-100">
            {initialQuery ? (
              <span>
                Search Results for <span className="text-sky-400">"{initialQuery}"</span>
              </span>
            ) : (
              <span>All Indexed Articles</span>
            )}
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {filteredArticles.length} matching {filteredArticles.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {filteredArticles.length === 0 ? (
          <EmptyState
            title="No Results Found"
            description={`We could not find any articles matching "${initialQuery}". Try searching for broader terms, checking spelling, or browsing categories.`}
            actionText="Clear Search Query"
            actionPath="/search"
            iconType="search"
          />
        ) : (
          <div className="space-y-3">
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                layout="horizontal"
                showImage={true}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
