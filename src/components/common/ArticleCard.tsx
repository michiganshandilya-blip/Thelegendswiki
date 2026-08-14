import React from 'react';
import { Article } from '../../types';
import { useRouter } from '../../context/RouterContext';
import { Clock, Eye, Calendar, Sparkles } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  layout?: 'standard' | 'compact' | 'featured' | 'horizontal' | 'recent' | 'popular';
  showImage?: boolean;
  showDate?: boolean;
  showViews?: boolean;
  className?: string;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  layout = 'standard',
  showImage = true,
  showDate = false,
  showViews = true,
  className = '',
}) => {
  const { navigate } = useRouter();

  const handleCardClick = () => {
    navigate(`/wiki/${article.slug}`);
  };

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/category/${article.categorySlug}`);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // FEATURED LAYOUT
  if (layout === 'featured') {
    return (
      <article
        id={`article-card-featured-${article.slug}`}
        onClick={handleCardClick}
        className={`group relative flex flex-col sm:flex-row gap-5 p-5 bg-[#0e1422] border border-[#1e293b] hover:border-sky-500/50 hover:bg-[#141c2e] transition-all duration-200 rounded-sm cursor-pointer overflow-hidden ${className}`}
      >
        <div className="flex-1 flex flex-col justify-between z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-sky-400 bg-sky-950/70 px-2 py-0.5 rounded-sm border border-sky-800/60">
                <Sparkles size={10} className="text-sky-400" />
                Featured Legend
              </span>
              <button
                type="button"
                onClick={handleCategoryClick}
                className="text-xs text-slate-400 hover:text-sky-400 hover:underline transition-colors"
              >
                {article.category}
              </button>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-100 group-hover:text-sky-400 cursor-pointer mb-2 leading-snug font-display transition-colors">
              {article.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-3 mb-4 font-sans">
              {article.summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium pt-3 border-t border-[#1e293b]">
            <span className="text-slate-300">{article.category}</span>
            <span className="text-slate-600">&bull;</span>
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-sky-400" /> {article.readingTimeMinutes} min read
            </span>
            {showViews && article.views && (
              <>
                <span className="text-slate-600">&bull;</span>
                <span className="flex items-center gap-1">
                  <Eye size={11} className="text-indigo-400" /> {article.views.toLocaleString()} views
                </span>
              </>
            )}
          </div>
        </div>

        {article.image && showImage && (
          <div className="w-full sm:w-52 sm:h-40 h-48 bg-[#141c2e] border border-[#1e293b] rounded-sm overflow-hidden shrink-0 relative">
            <img
              src={article.image}
              alt={article.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1422]/60 via-transparent to-transparent pointer-events-none" />
          </div>
        )}
      </article>
    );
  }

  // RECENTLY ADDED LAYOUT
  if (layout === 'recent') {
    return (
      <article
        id={`article-card-recent-${article.slug}`}
        onClick={handleCardClick}
        className={`group p-4 bg-[#0e1422] border border-[#1e293b] hover:border-sky-500/50 hover:bg-[#141c2e] transition-all duration-200 rounded-sm cursor-pointer flex flex-col justify-between ${className}`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <button
              type="button"
              onClick={handleCategoryClick}
              className="text-[10px] uppercase font-bold tracking-wider text-sky-400 hover:text-sky-300 hover:underline transition-colors"
            >
              {article.category}
            </button>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <Calendar size={11} className="text-slate-500" />
              {formatDate(article.lastUpdated)}
            </span>
          </div>

          <h3 className="font-display text-base font-bold text-slate-100 group-hover:text-sky-400 transition-colors mb-2 leading-snug">
            {article.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {article.summary}
          </p>
        </div>

        <div className="pt-2.5 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Clock size={11} className="text-slate-500" />
            {article.readingTimeMinutes} min read
          </span>
          <span className="text-sky-400 group-hover:text-sky-300 group-hover:underline text-[11px]">Read entry &rarr;</span>
        </div>
      </article>
    );
  }

  // POPULAR LAYOUT
  if (layout === 'popular') {
    return (
      <article
        id={`article-card-popular-${article.slug}`}
        onClick={handleCardClick}
        className={`group p-3.5 bg-[#0e1422] border border-[#1e293b] hover:border-sky-500/50 hover:bg-[#141c2e] transition-all duration-200 rounded-sm cursor-pointer flex items-start gap-3.5 ${className}`}
      >
        {article.image && showImage && (
          <div className="w-16 h-16 bg-[#141c2e] border border-[#1e293b] rounded-sm overflow-hidden shrink-0 mt-0.5">
            <img
              src={article.image}
              alt={article.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 opacity-90 group-hover:opacity-100"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <button
              type="button"
              onClick={handleCategoryClick}
              className="text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-sky-400 truncate transition-colors"
            >
              {article.category}
            </button>
            {showViews && article.views && (
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5 shrink-0">
                <Eye size={10} className="text-indigo-400" />
                {article.views.toLocaleString()}
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-slate-100 group-hover:text-sky-400 font-display leading-snug truncate transition-colors">
            {article.title}
          </h4>
          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
            {article.summary}
          </p>
        </div>
      </article>
    );
  }

  // COMPACT LAYOUT
  if (layout === 'compact') {
    return (
      <article
        id={`article-card-compact-${article.slug}`}
        onClick={handleCardClick}
        className={`group p-3 border border-[#1e293b] hover:border-sky-500/50 hover:bg-[#141c2e] transition-all duration-200 rounded-sm cursor-pointer bg-[#0e1422] ${className}`}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-bold text-slate-100 group-hover:text-sky-400 transition-colors font-display leading-snug">
            {article.title}
          </h4>
          <span className="text-[10px] text-slate-500 font-mono shrink-0">
            {article.readingTimeMinutes}m
          </span>
        </div>
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {article.summary}
        </p>
      </article>
    );
  }

  // HORIZONTAL LAYOUT
  if (layout === 'horizontal') {
    return (
      <article
        id={`article-card-horizontal-${article.slug}`}
        onClick={handleCardClick}
        className={`group flex gap-4 p-4 border border-[#1e293b] hover:border-sky-500/50 rounded-sm bg-[#0e1422] hover:bg-[#141c2e] cursor-pointer transition-all duration-200 ${className}`}
      >
        {article.image && showImage && (
          <div className="w-24 h-24 bg-[#141c2e] border border-[#1e293b] rounded-sm overflow-hidden shrink-0">
            <img
              src={article.image}
              alt={article.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 opacity-90 group-hover:opacity-100"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={handleCategoryClick}
              className="text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-sky-400 transition-colors"
            >
              {article.category}
            </button>
            <span className="text-slate-600">&bull;</span>
            <span className="text-[11px] text-slate-500">{article.readingTimeMinutes} min read</span>
          </div>
          <h3 className="text-base font-bold text-slate-100 group-hover:text-sky-400 font-display mb-1 leading-snug transition-colors">
            {article.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        </div>
      </article>
    );
  }

  // STANDARD CARD LAYOUT
  return (
    <article
      id={`article-card-standard-${article.slug}`}
      onClick={handleCardClick}
      className={`group bg-[#0e1422] border border-[#1e293b] hover:border-sky-500/50 hover:bg-[#141c2e] transition-all duration-200 rounded-sm overflow-hidden cursor-pointer flex flex-col justify-between ${className}`}
    >
      {article.image && showImage && (
        <div className="h-40 bg-[#141c2e] border-b border-[#1e293b] overflow-hidden relative">
          <img
            src={article.image}
            alt={article.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
          />
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#080c14]/90 backdrop-blur-xs text-[10px] uppercase font-bold text-sky-400 rounded-sm border border-[#1e293b]">
            {article.category}
          </div>
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {!article.image && (
            <div className="flex items-center gap-2 mb-1.5">
              <button
                type="button"
                onClick={handleCategoryClick}
                className="text-[10px] uppercase font-bold tracking-wider text-sky-400 hover:underline"
              >
                {article.category}
              </button>
            </div>
          )}

          <h3 className="font-display text-base font-bold text-slate-100 group-hover:text-sky-400 transition-colors mb-2 leading-snug">
            {article.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-3">
            {article.summary}
          </p>
        </div>

        <div className="pt-2.5 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-slate-400 font-medium">
          {showDate ? (
            <span className="flex items-center gap-1 font-mono">
              <Calendar size={11} className="text-slate-500" /> {formatDate(article.lastUpdated)}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-slate-500" /> {article.readingTimeMinutes} min read
            </span>
          )}
          {showViews && (
            <span className="flex items-center gap-1 font-mono text-slate-400">
              <Eye size={10} className="text-indigo-400" /> {article.views.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

