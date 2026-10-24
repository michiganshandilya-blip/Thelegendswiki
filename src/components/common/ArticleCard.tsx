import React from 'react';
import { Article } from '../../types';
import { useRouter } from '../../context/RouterContext';
import { generateSlugFromTitle } from '../../lib/validation';
import { OptimizedImage } from './OptimizedImage';
import { EpistemicBadge } from './EpistemicBadge';
import { Clock, Eye, Calendar, Sparkles, ArrowRight, Layers, FileText } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  layout?: 'standard' | 'compact' | 'featured' | 'horizontal' | 'recent' | 'popular' | 'curtain-dossier' | 'vertical';
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

  const articleSlug =
    (article.slug || '').trim() ||
    (article.title ? generateSlugFromTitle(article.title) : '') ||
    (article.id || '').trim();

  const handleCardClick = () => {
    if (articleSlug) {
      navigate(`/wiki/${articleSlug}`);
    }
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

  const articleImg = article.featuredImage || article.image;
  const isCurtains = Boolean(article.isBehindCurtains);

  // =========================================================================
  // 1. BEHIND THE CURTAINS DOSSIER CARD (Distinctive Deeper Layer Card Style)
  // =========================================================================
  if (isCurtains || layout === 'curtain-dossier') {
    const fileRefNumber = `ARC-${(article.title.length * 17 + Number(article.id || 1) * 31) % 900 + 100}`;
    return (
      <article
        id={`article-card-curtains-${articleSlug || article.id}`}
        onClick={handleCardClick}
        className={`group relative overflow-hidden bg-gradient-to-b from-[#0e1626] via-[#0a0f1d] to-[#060912] border border-amber-500/30 hover:border-amber-400/80 rounded-xs cursor-pointer transition-all duration-200 shadow-md hover:shadow-2xl hover:shadow-black/70 flex flex-col justify-between ${className}`}
      >
        {/* Subtle decorative curtain ambient highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600/30 via-amber-400 to-amber-600/30" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        {articleImg && showImage && (
          <div className="h-44 bg-slate-950 border-b border-slate-800/80 overflow-hidden relative">
            <OptimizedImage
              src={articleImg}
              alt={article.imageAlt || article.title}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 opacity-90 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1d] via-transparent to-black/40" />
            {/* Top metadata tags */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 z-10">
              <span className="px-2 py-0.5 bg-black/85 backdrop-blur-xs text-[10px] uppercase font-mono font-bold text-amber-300 rounded-xs border border-amber-400/50 flex items-center gap-1 shadow-xs">
                <Sparkles size={10} className="text-amber-400" />
                <span>Curtain Archive</span>
              </span>
              <button
                type="button"
                onClick={handleCategoryClick}
                className="px-2 py-0.5 bg-slate-900/90 text-[10px] uppercase font-mono font-bold text-slate-200 hover:text-amber-200 rounded-xs border border-slate-700/80 backdrop-blur-xs transition-colors"
              >
                {article.category}
              </button>
            </div>
            {/* File reference tag */}
            <div className="absolute bottom-2 left-2.5 z-10">
              <span className="px-1.5 py-0.5 bg-black/80 font-mono text-[9px] text-slate-300 border border-slate-800 rounded-xs">
                {fileRefNumber}
              </span>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 relative z-10">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                {!articleImg && (
                  <>
                    <span className="font-mono text-[10px] text-amber-400/90 font-bold">
                      {fileRefNumber}
                    </span>
                    <span className="text-slate-600">&bull;</span>
                    <button
                      type="button"
                      onClick={handleCategoryClick}
                      className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-300 hover:underline"
                    >
                      {article.category}
                    </button>
                  </>
                )}
              </div>
              {article.knowledgeDepth && (
                <EpistemicBadge depth={article.knowledgeDepth} size="sm" dark={true} />
              )}
            </div>

            <h3 className="font-serif text-base sm:text-lg font-bold text-slate-100 group-hover:text-amber-200 transition-colors leading-snug">
              {article.title}
            </h3>

            <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mt-2 font-sans">
              {article.summary}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800/90 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Clock size={11} className="text-amber-500/80" />
              <span>{article.readingTimeMinutes || 5} min read</span>
            </span>
            <span className="text-amber-300 group-hover:text-amber-200 group-hover:underline flex items-center gap-1 font-sans font-semibold text-xs">
              <span>Read dossier</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </article>
    );
  }

  // =========================================================================
  // 2. FEATURED CODEX ENTRY LAYOUT
  // =========================================================================
  if (layout === 'featured') {
    return (
      <article
        id={`article-card-featured-${articleSlug || article.id}`}
        onClick={handleCardClick}
        className={`group relative flex flex-col md:flex-row gap-5 p-5 bg-[#ffffff] border border-[#cbd5e1] hover:border-[#2563eb] hover:bg-[#fbfcfd] transition-all duration-150 rounded-sm cursor-pointer shadow-xs ${className}`}
      >
        <div className="flex-1 flex flex-col justify-between z-10">
          <div>
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono font-bold tracking-wider text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
                <Sparkles size={10} className="text-[#2563eb]" />
                Curator's Feature
              </span>
              <button
                type="button"
                onClick={handleCategoryClick}
                className="text-xs font-bold uppercase tracking-wider text-[#475569] hover:text-[#2563eb] hover:underline transition-colors"
              >
                {article.category}
              </button>
              {article.knowledgeDepth && (
                <EpistemicBadge depth={article.knowledgeDepth} size="sm" />
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-[#0f172a] group-hover:text-[#2563eb] cursor-pointer mb-2.5 leading-snug font-serif transition-colors">
              {article.title}
            </h3>

            <p className="text-xs sm:text-sm text-[#334155] leading-relaxed line-clamp-3 mb-4 font-sans">
              {article.summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#64748b] font-medium pt-3 border-t border-[#e2e8f0]">
            <span className="text-[#0f172a] font-semibold">{article.category}</span>
            <span className="text-[#cbd5e1]">&bull;</span>
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-[#64748b]" /> {article.readingTimeMinutes || 5} min read
            </span>
            {showViews && article.views && (
              <>
                <span className="text-[#cbd5e1]">&bull;</span>
                <span className="flex items-center gap-1 font-mono">
                  <Eye size={11} className="text-[#64748b]" /> {article.views.toLocaleString()} views
                </span>
              </>
            )}
          </div>
        </div>

        {articleImg && showImage && (
          <div className="w-full md:w-60 md:h-44 h-48 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm overflow-hidden shrink-0 relative">
            <OptimizedImage
              src={articleImg}
              alt={article.imageAlt || article.title}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
            />
          </div>
        )}
      </article>
    );
  }

  // =========================================================================
  // 3. RECENTLY REVISED LAYOUT
  // =========================================================================
  if (layout === 'recent') {
    return (
      <article
        id={`article-card-recent-${articleSlug || article.id}`}
        onClick={handleCardClick}
        className={`group p-4 bg-[#ffffff] border border-[#cbd5e1] hover:border-[#2563eb] hover:bg-[#fbfcfd] transition-all duration-150 rounded-sm cursor-pointer flex flex-col justify-between shadow-xs ${className}`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleCategoryClick}
                className="text-[10px] uppercase font-bold tracking-wider text-[#2563eb] hover:underline transition-colors"
              >
                {article.category}
              </button>
              {article.knowledgeDepth && (
                <EpistemicBadge depth={article.knowledgeDepth} size="sm" />
              )}
            </div>
            <span className="text-[11px] text-[#64748b] flex items-center gap-1 font-mono">
              <Calendar size={11} className="text-[#94a3b8]" />
              {formatDate(article.lastUpdated)}
            </span>
          </div>

          <h3 className="font-serif text-base font-bold text-[#0f172a] group-hover:text-[#2563eb] transition-colors mb-2 leading-snug">
            {article.title}
          </h3>

          <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed mb-3 font-sans">
            {article.summary}
          </p>
        </div>

        <div className="pt-2.5 border-t border-[#eaecf0] flex items-center justify-between text-[11px] text-[#64748b] font-medium">
          <span className="flex items-center gap-1">
            <Clock size={11} className="text-[#94a3b8]" />
            {article.readingTimeMinutes || 5} min read
          </span>
          <span className="text-[#2563eb] group-hover:underline text-[11px] font-semibold">Read entry &rarr;</span>
        </div>
      </article>
    );
  }

  // =========================================================================
  // 4. POPULAR RECORDS LAYOUT
  // =========================================================================
  if (layout === 'popular') {
    return (
      <article
        id={`article-card-popular-${articleSlug || article.id}`}
        onClick={handleCardClick}
        className={`group p-3.5 bg-[#ffffff] border border-[#cbd5e1] hover:border-[#2563eb] hover:bg-[#fbfcfd] transition-all duration-150 rounded-sm cursor-pointer flex items-start gap-3 shadow-xs ${className}`}
      >
        {articleImg && showImage && (
          <div className="w-14 h-14 bg-[#f8f9fa] border border-[#e2e8f0] rounded-sm overflow-hidden shrink-0 mt-0.5">
            <OptimizedImage
              src={articleImg}
              alt={article.imageAlt || article.title}
              aspectRatio="square"
              containerClassName="w-full h-full"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-150"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <button
              type="button"
              onClick={handleCategoryClick}
              className="text-[10px] uppercase font-bold tracking-wider text-[#64748b] hover:text-[#2563eb] truncate transition-colors"
            >
              {article.category}
            </button>
            {showViews && article.views && (
              <span className="text-[10px] text-[#64748b] font-mono flex items-center gap-0.5 shrink-0">
                <Eye size={10} className="text-[#94a3b8]" />
                {article.views.toLocaleString()}
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-[#0f172a] group-hover:text-[#2563eb] font-serif leading-snug truncate transition-colors">
            {article.title}
          </h4>
          <p className="text-xs text-[#475569] line-clamp-1 mt-0.5 font-sans">
            {article.summary}
          </p>
        </div>
      </article>
    );
  }

  // =========================================================================
  // 5. HORIZONTAL LAYOUT
  // =========================================================================
  if (layout === 'horizontal') {
    return (
      <article
        id={`article-card-horizontal-${articleSlug || article.id}`}
        onClick={handleCardClick}
        className={`group flex gap-4 p-4 border border-[#cbd5e1] hover:border-[#2563eb] rounded-sm bg-[#ffffff] hover:bg-[#fbfcfd] cursor-pointer transition-all duration-150 shadow-xs ${className}`}
      >
        {articleImg && showImage && (
          <div className="w-24 h-24 bg-[#f8f9fa] border border-[#e2e8f0] rounded-sm overflow-hidden shrink-0">
            <OptimizedImage
              src={articleImg}
              alt={article.imageAlt || article.title}
              aspectRatio="square"
              containerClassName="w-full h-full"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-150"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <button
              type="button"
              onClick={handleCategoryClick}
              className="text-[10px] uppercase font-bold tracking-wider text-[#64748b] hover:text-[#2563eb] transition-colors"
            >
              {article.category}
            </button>
            {article.knowledgeDepth && (
              <EpistemicBadge depth={article.knowledgeDepth} size="sm" />
            )}
            <span className="text-[#cbd5e1]">&bull;</span>
            <span className="text-[11px] text-[#64748b] font-mono">{article.readingTimeMinutes || 5} min read</span>
          </div>
          <h3 className="text-base font-bold text-[#0f172a] group-hover:text-[#2563eb] font-serif mb-1 leading-snug transition-colors">
            {article.title}
          </h3>
          <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed font-sans">
            {article.summary}
          </p>
        </div>
      </article>
    );
  }

  // =========================================================================
  // 6. STANDARD CARD LAYOUT (FRONT KNOWLEDGE CODEX)
  // =========================================================================
  return (
    <article
      id={`article-card-standard-${articleSlug || article.id}`}
      onClick={handleCardClick}
      className={`group bg-[#ffffff] border border-[#cbd5e1] hover:border-[#2563eb] hover:bg-[#fbfcfd] transition-all duration-150 rounded-sm overflow-hidden cursor-pointer flex flex-col justify-between shadow-xs ${className}`}
    >
      {articleImg && showImage && (
        <div className="h-36 bg-[#f8f9fa] border-b border-[#eaecf0] overflow-hidden relative">
          <OptimizedImage
            src={articleImg}
            alt={article.imageAlt || article.title}
            containerClassName="w-full h-full"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
          />
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <div className="px-2 py-0.5 bg-[#ffffff]/95 text-[10px] uppercase font-bold text-[#475569] rounded-xs border border-[#cbd5e1] shadow-xs">
              {article.category}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {!articleImg && (
              <button
                type="button"
                onClick={handleCategoryClick}
                className="text-[10px] uppercase font-bold tracking-wider text-[#2563eb] hover:underline"
              >
                {article.category}
              </button>
            )}
            {article.knowledgeDepth && (
              <EpistemicBadge depth={article.knowledgeDepth} size="sm" />
            )}
          </div>

          <h3 className="font-serif text-base font-bold text-[#0f172a] group-hover:text-[#2563eb] transition-colors mb-2 leading-snug">
            {article.title}
          </h3>

          <p className="text-xs text-[#475569] line-clamp-3 leading-relaxed mb-3 font-sans">
            {article.summary}
          </p>
        </div>

        <div className="pt-2.5 border-t border-[#eaecf0] flex items-center justify-between text-[11px] text-[#64748b] font-medium">
          {showDate ? (
            <span className="flex items-center gap-1 font-mono">
              <Calendar size={11} className="text-[#94a3b8]" /> {formatDate(article.lastUpdated)}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-[#94a3b8]" /> {article.readingTimeMinutes || 5} min read
            </span>
          )}
          {showViews && (
            <span className="flex items-center gap-1 font-mono text-[#64748b]">
              <Eye size={10} className="text-[#94a3b8]" /> {article.views?.toLocaleString() || 0}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
