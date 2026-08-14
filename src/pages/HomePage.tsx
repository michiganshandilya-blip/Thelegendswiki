import React from 'react';
import { useRouter } from '../context/RouterContext';
import { SearchBar } from '../components/common/SearchBar';
import { ArticleCard } from '../components/common/ArticleCard';
import { CategoryCard } from '../components/common/CategoryCard';
import { Button } from '../components/common/Button';
import { useArticles, useCategories } from '../data/dataProvider';
import { 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Shuffle, 
  Layers,
  ArrowRight,
  BookOpen
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate, getRandomArticleSlug } = useRouter();
  const { articles } = useArticles();
  const { categories } = useCategories();

  // Articles data segmentation from database / fallback
  const featuredArticles = articles.filter((a) => a.featured);
  const primaryFeatured = featuredArticles[0] || articles[0];
  const secondaryFeatured = featuredArticles.slice(1, 3);

  const popularArticles = articles.filter((a) => a.popular).slice(0, 4);
  const recentlyAddedArticles = [...articles]
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, 3);

  const handleRandomArticle = () => {
    const slug = getRandomArticleSlug();
    navigate(`/wiki/${slug}`);
  };

  const handleExploreAll = () => {
    navigate('/category/all');
  };

  return (
    <div className="space-y-10 pb-6">
      {/* ==================================================
          1. WELCOME SECTION
          ================================================== */}
      <section
        id="welcome-section"
        className="relative bg-[#0e1422] border border-[#1e293b] p-6 sm:p-7 rounded-sm overflow-hidden tech-grid-pattern"
      >
        <div className="absolute top-0 right-0 w-72 h-36 bg-gradient-to-bl from-blue-600/10 via-sky-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-sky-400 bg-sky-950/60 px-2.5 py-0.5 rounded-sm border border-sky-800/50 mb-2">
            <Sparkles size={11} className="text-sky-400" />
            Open Knowledge & Legends Archive
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-100 mb-2 leading-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 font-legend tracking-normal">TheLegendsWiki</span>
          </h1>
          <p className="text-slate-400 leading-relaxed text-sm sm:text-base font-sans">
            Explore knowledge, people, places, history, science, technology, sports, culture and iconic legends across all eras.
          </p>
        </div>
      </section>

      {/* ==================================================
          2. MAIN SEARCH
          ================================================== */}
      <section
        id="main-search-section"
        className="bg-[#0e1422] border border-[#1e293b] p-5 sm:p-6 rounded-sm shadow-xs"
      >
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <label
            htmlFor="main-encyclopedia-search"
            className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-display"
          >
            Search the Encyclopedia
          </label>

          <SearchBar
            size="large"
            placeholder="Search TheLegendsWiki records..."
            onSearchSubmit={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
          />

          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-xs text-slate-400">
            <span className="text-slate-500 font-medium">Quick suggestions:</span>
            {['Albert Einstein', 'Library of Alexandria', 'James Webb Space Telescope', 'Ada Lovelace', 'Turing Machine', 'Apollo 11'].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)}
                className="text-slate-400 hover:text-sky-400 hover:bg-[#141c2e] px-2 py-0.5 rounded border border-transparent hover:border-[#1e293b] cursor-pointer transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          3. FEATURED ARTICLES
          ================================================== */}
      <section id="featured-articles-section" className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-sky-400" />
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-100">
              Featured Articles
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Curated scholarly entries
          </span>
        </div>

        {/* Primary Featured Article */}
        <div className="space-y-4">
          <ArticleCard
            article={primaryFeatured}
            layout="featured"
            showImage={true}
            showViews={true}
          />

          {/* Secondary Featured Articles Grid if present */}
          {secondaryFeatured.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {secondaryFeatured.map((article) => (
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
        </div>
      </section>

      {/* ==================================================
          4. POPULAR ARTICLES
          ================================================== */}
      <section id="popular-articles-section" className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-400" />
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-100">
              Popular Articles
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            High readership this month
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

      {/* ==================================================
          5. RECENTLY ADDED
          ================================================== */}
      <section id="recently-added-section" className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-sky-400" />
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-100">
              Recently Added
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Latest additions to the registry
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentlyAddedArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              layout="recent"
              showDate={true}
            />
          ))}
        </div>
      </section>

      {/* ==================================================
          6. BROWSE CATEGORIES
          ================================================== */}
      <section id="browse-categories-section" className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-sky-400" />
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-100">
              Browse Categories
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/category/all')}
            className="text-xs text-sky-400 hover:text-sky-300 hover:underline cursor-pointer transition-colors"
          >
            All 13 disciplines &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              variant="card"
            />
          ))}
        </div>
      </section>

      {/* ==================================================
          7. RANDOM ARTICLE
          ================================================== */}
      <section
        id="random-article-section"
        className="bg-[#0e1422] border border-[#1e293b] rounded-sm p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="p-3 bg-[#141c2e] border border-[#1e293b] rounded-sm text-sky-400 shrink-0 hidden sm:block">
              <Shuffle size={20} />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-slate-100">
                Random Article
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                Discover unexpected knowledge by jumping directly to a randomly selected entry in the knowledge archive.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={handleRandomArticle}
            icon={<Shuffle size={14} />}
            className="shrink-0 w-full sm:w-auto"
          >
            Random Article
          </Button>
        </div>
      </section>

      {/* ==================================================
          8. EXPLORE ALL ARTICLES
          ================================================== */}
      <section
        id="explore-all-section"
        className="bg-[#0e1422] border border-[#1e293b] rounded-sm p-6 text-center space-y-3"
      >
        <div className="w-10 h-10 bg-[#141c2e] border border-[#1e293b] rounded-sm text-sky-400 flex items-center justify-center mx-auto">
          <BookOpen size={20} />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="font-display text-base sm:text-lg font-bold text-slate-100">
            Complete Knowledge Archive
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed font-sans">
            Browse through all structured articles, historical chronologies, and academic disciplines indexed on TheLegendsWiki.
          </p>
        </div>
        <div>
          <Button
            variant="primary"
            size="md"
            onClick={handleExploreAll}
            icon={<ArrowRight size={14} />}
          >
            Explore All Articles
          </Button>
        </div>
      </section>
    </div>
  );
};

