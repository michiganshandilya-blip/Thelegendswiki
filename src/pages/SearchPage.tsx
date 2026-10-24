import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useArticles, useCategories } from '../data/dataProvider';
import { useSEO } from '../hooks/useSEO';
import { performAiSearch, AiSearchResponse } from '../services/aiService';
import { SearchBar } from '../components/common/SearchBar';
import { ArticleCard } from '../components/common/ArticleCard';
import { EmptyState } from '../components/common/EmptyState';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import {
  Filter,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Key,
} from 'lucide-react';

interface SearchPageProps {
  query: string;
  categoryFilter?: string;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  query: initialQuery,
  categoryFilter: initialCategory,
}) => {
  const { navigate } = useRouter();
  const { articles } = useArticles();
  const { categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');

  // AI Semantic Search State
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AiSearchResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCategory(initialCategory || 'all');
  }, [initialCategory]);

  useSEO(
    {
      title: initialQuery ? `Behind the Curtains: "${initialQuery}"` : 'Search Behind-the-Curtains Archives',
      description: initialQuery
        ? `Investigate behind-the-scenes accounts, private decisions, and declassified files matching "${initialQuery}".`
        : 'Search and investigate Behind-the-Curtains stories across all historical, scientific, and corporate records.',
      canonicalUrl: initialQuery ? `/search?q=${encodeURIComponent(initialQuery)}` : '/search',
      noindex: Boolean(initialQuery),
    },
    [initialQuery, selectedCategory]
  );

  const rawQuery = initialQuery.trim().toLowerCase();

  // Trigger AI Semantic Search when a natural language query is detected or query has 3+ words
  useEffect(() => {
    let isMounted = true;

    async function runAiSearch() {
      if (!rawQuery || rawQuery.length < 3 || !aiEnabled) {
        setAiResult(null);
        setAiError(null);
        return;
      }

      setAiLoading(true);
      setAiError(null);

      try {
        const response = await performAiSearch({
          query: initialQuery,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          availableArticles: articles.map((a) => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            category: a.category,
            summary: a.summary,
            tags: a.tags,
            readingTime: a.readingTimeMinutes,
            featuredImage: a.featuredImage,
          })),
        });

        if (isMounted) {
          if (response.error) {
            setAiError(response.error);
            setAiResult(null);
          } else {
            setAiResult(response);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setAiError(err?.message || 'Semantic search unavailable.');
        }
      } finally {
        if (isMounted) {
          setAiLoading(false);
        }
      }
    }

    runAiSearch();

    return () => {
      isMounted = false;
    };
  }, [initialQuery, selectedCategory, aiEnabled]);

  // Standard keyword filtering across articles with primary category
  const filteredArticles = articles.filter((article) => {
    const matchesCategory =
      selectedCategory === 'all' || article.categorySlug === selectedCategory;

    if (!matchesCategory) {
      return false;
    }

    if (!rawQuery) {
      return true;
    }

    const inTitle = article.title.toLowerCase().includes(rawQuery);
    const inSummary = article.summary.toLowerCase().includes(rawQuery);
    const inTags = article.tags.some((t) => t.toLowerCase().includes(rawQuery));
    const inContext = article.behindCurtainsContext
      ? article.behindCurtainsContext.toLowerCase().includes(rawQuery)
      : false;

    return inTitle || inSummary || inTags || inContext;
  });

  return (
    <div id="search-results-page" className="space-y-6 pb-10">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Behind the Curtains', path: '/' },
          { label: initialQuery ? `Search: "${initialQuery}"` : 'Investigate Archives' },
        ]}
      />

      {/* Main Search Bar Header */}
      <header className="curtains-atmosphere border border-amber-500/40 text-slate-100 rounded-sm p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-amber-400" />
          <span className="font-mono text-xs uppercase font-bold tracking-widest text-amber-300">
            Behind the Curtains Search
          </span>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-50">
          {initialQuery
            ? `Behind-the-Curtains Records: "${initialQuery}"`
            : 'Investigate Behind-the-Curtains Records'}
        </h1>

        <div className="max-w-2xl">
          <SearchBar
            initialValue={initialQuery}
            size="large"
            placeholder="Search behind-the-scenes accounts, private letters, scams, decisions..."
            onSearchSubmit={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
          />
        </div>
      </header>

      {/* Facet Filter Bar */}
      <section className="bg-white border border-[#cbd5e1] p-4 rounded-sm space-y-2 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono text-slate-500 uppercase text-[10px] tracking-wider mr-1 flex items-center gap-1">
            <Filter size={11} className="text-amber-800" /> Curtains Facet:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-xs text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-amber-800 text-white font-bold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Facets ({articles.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-2.5 py-1 rounded-xs text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-amber-800 text-white font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* AI Semantic Synthesis */}
      {initialQuery && aiEnabled && (
        <section className="bg-gradient-to-r from-amber-50/60 to-stone-100/90 border border-amber-300/80 rounded-sm p-4 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-xs bg-amber-800 text-amber-100 flex items-center justify-center shadow-xs">
                <Sparkles size={13} />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#101418]">
                Behind-the-Scenes Synthesis &amp; Query Analysis
              </h3>
              <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-xs font-bold">
                Archival Grounded
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              Model: Gemini 3.7 Flash
            </span>
          </div>

          {aiLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-600 py-2">
              <Loader2 size={15} className="animate-spin text-amber-700" />
              <span>Investigating Behind-the-Curtains records for "{initialQuery}"...</span>
            </div>
          )}

          {aiError && (
            <div className="p-3 bg-red-50/70 border border-red-200 rounded-sm text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0 text-red-600" />
              <span>Search notice: {aiError} (Showing catalog records below)</span>
            </div>
          )}

          {aiResult && (
            <div className="space-y-3">
              {aiResult.directAnswer && (
                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-white p-3.5 border border-amber-200 rounded-xs shadow-xs">
                  <p className="font-sans font-bold text-slate-900 mb-1">
                    Archival Overview:
                  </p>
                  <p>{aiResult.directAnswer}</p>
                </div>
              )}

              {aiResult.relevanceExplanation && (
                <p className="text-xs text-slate-600 italic font-sans">
                  <strong>Relevance context:</strong> {aiResult.relevanceExplanation}
                </p>
              )}

              {/* Matched articles */}
              {aiResult.matchedArticles &&
                aiResult.matchedArticles.filter((mArt) => articles.some((a) => a.slug === mArt.slug)).length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-mono uppercase font-bold text-slate-600 flex items-center gap-1">
                    <BookOpen size={11} className="text-amber-700" />
                    <span>Prioritized Behind-the-Curtains Dossiers:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {aiResult.matchedArticles
                      .filter((mArt) => articles.some((a) => a.slug === mArt.slug))
                      .map((mArt) => (
                      <div
                        key={mArt.slug}
                        onClick={() => navigate(`/wiki/${mArt.slug}`)}
                        className="bg-white border border-[#cbd5e1] hover:border-amber-600 p-2.5 rounded-xs transition-all cursor-pointer group shadow-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono uppercase text-amber-800 font-semibold">
                            {mArt.category}
                          </span>
                          <ArrowRight size={12} className="text-slate-400 group-hover:text-amber-800 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <h4 className="font-serif font-bold text-xs text-slate-900 group-hover:text-amber-900 transition-colors line-clamp-1">
                          {mArt.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 font-sans">
                          {mArt.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Results List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="font-serif font-bold text-slate-900 text-sm">
            Cataloged Dossiers ({filteredArticles.length})
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Strict Epistemic Classification
          </span>
        </div>

        {filteredArticles.length === 0 ? (
          <EmptyState
            title="No Matching Records Found"
            message={`No verified Behind-the-Curtains dossiers matched your query "${initialQuery}".`}
            actionLabel="View All Dossiers"
            onAction={() => navigate('/category/all')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                layout="horizontal"
                showImage={true}
                showViews={true}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
