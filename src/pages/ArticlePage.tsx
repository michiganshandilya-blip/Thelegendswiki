import React from 'react';
import { useRouter } from '../context/RouterContext';
import { useArticle, useArticles } from '../data/dataProvider';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { TableOfContents } from '../components/article/TableOfContents';
import { ArticleInfobox } from '../components/article/ArticleInfobox';
import { ArticleFigure } from '../components/article/ArticleFigure';
import { ReferenceList } from '../components/article/ReferenceList';
import { RelatedArticles } from '../components/article/RelatedArticles';
import { ArticleActions } from '../components/article/ArticleActions';
import { ArticleNotFound } from '../components/article/ArticleNotFound';
import { LoadingState } from '../components/common/LoadingState';
import {
  Clock,
  Eye,
  Calendar,
  Tag,
  FolderTree,
  FileCheck
} from 'lucide-react';

interface ArticlePageProps {
  slug: string;
}

export const ArticlePage: React.FC<ArticlePageProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const { article, loading } = useArticle(slug);
  const { articles: allArticles } = useArticles();

  if (loading && !article) {
    return <LoadingState type="article" />;
  }

  // If no article matches the slug, render the error state
  if (!article) {
    return <ArticleNotFound slug={slug} />;
  }

  // Related articles lookup
  const relatedArticles = allArticles.filter((a) =>
    (article.relatedArticleSlugs || []).includes(a.slug)
  );

  // Structured breadcrumbs
  const breadcrumbItems = [
    { label: article.category, path: `/category/${article.categorySlug}` },
    ...(article.subCategory
      ? [{ label: article.subCategory, path: `/category/${article.categorySlug}` }]
      : []),
    { label: article.title },
  ];

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <article
      id={`wiki-article-${article.slug}`}
      className="space-y-6 max-w-5xl mx-auto pb-12"
    >
      {/* ==================================================
          1. BREADCRUMBS & ARTICLE CONTEXT
          ================================================== */}
      <div className="border-b border-[#1e293b] pb-2.5">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* ==================================================
          2. ARTICLE TITLE & INTRODUCTORY METADATA
          ================================================== */}
      <header className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-4.5xl font-bold text-slate-100 leading-tight tracking-tight">
            {article.title}
          </h1>
          {article.pronunciation && (
            <span className="font-mono text-xs text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60 shrink-0 self-start md:self-auto">
              Pronunciation: {article.pronunciation}
            </span>
          )}
        </div>

        {/* Short Summary Lead Box */}
        <div className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans bg-[#0e1422] border border-[#1e293b] p-4 sm:p-4.5 rounded-sm border-l-4 border-l-sky-500">
          <p className="m-0">{article.summary}</p>
        </div>

        {/* Article Toolbar / Actions (Read, Edit, Discussion, Bookmark, Share, Print) */}
        <ArticleActions
          articleTitle={article.title}
          articleSlug={article.slug}
        />

        {/* Metadata Strip */}
        <div className="flex flex-wrap items-center gap-3.5 text-xs text-slate-400 pt-2 border-t border-[#1e293b] font-sans">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} className="text-sky-400" />
            <span>{article.readingTimeMinutes} min read</span>
          </span>
          <span className="text-slate-600">&bull;</span>
          <span className="inline-flex items-center gap-1 font-mono">
            <Eye size={12} className="text-indigo-400" />
            <span>{article.views.toLocaleString()} views</span>
          </span>
          <span className="text-slate-600">&bull;</span>
          <span className="inline-flex items-center gap-1 font-mono">
            <Calendar size={12} className="text-slate-500" />
            <span>Last updated: {formatDate(article.lastUpdated)}</span>
          </span>
          {article.author && (
            <>
              <span className="text-slate-600">&bull;</span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <FileCheck size={12} className="text-sky-400" />
                <span>{article.author}</span>
              </span>
            </>
          )}
        </div>
      </header>

      {/* ==================================================
          3. MAIN ARTICLE LAYOUT (CONTENT & INFOBOX)
          ================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        {/* Main Left/Center Column: Table of Contents & Article Body */}
        <div className="lg:col-span-8 space-y-6">
          {/* Table of Contents */}
          <TableOfContents
            sections={article.sections}
            hasReferences={article.citations && article.citations.length > 0}
            hasRelated={relatedArticles.length > 0}
          />

          {/* Article Semantic Body Content */}
          <div className="encyclopedia-article-body space-y-8 text-slate-300 text-sm sm:text-base leading-relaxed">
            {article.sections.map((section, sIdx) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 space-y-3"
              >
                {/* Section Heading (H2) */}
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-100 border-b border-[#1e293b] pb-1.5 pt-2">
                  <span className="text-sky-400 font-mono font-normal text-lg mr-2">
                    {sIdx + 1}.
                  </span>
                  {section.title}
                </h2>

                {/* Section Image Figure if present */}
                {section.figure && (
                  <ArticleFigure figure={section.figure} />
                )}

                {/* Section Paragraphs */}
                {section.content.map((paragraph, pIdx) => (
                  <p key={pIdx} className="text-slate-300 leading-relaxed font-sans">
                    {paragraph}
                  </p>
                ))}

                {/* Unordered Bullet Points if present */}
                {section.bulletPoints && section.bulletPoints.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-300 marker:text-sky-400">
                    {section.bulletPoints.map((point, bIdx) => (
                      <li key={bIdx} className="leading-relaxed pl-1">
                        {point}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Ordered Numbered Points if present */}
                {section.orderedPoints && section.orderedPoints.length > 0 && (
                  <ol className="list-decimal pl-5 space-y-2 text-slate-300 marker:font-mono marker:text-sky-400">
                    {section.orderedPoints.map((point, oIdx) => (
                      <li key={oIdx} className="leading-relaxed pl-1">
                        {point}
                      </li>
                    ))}
                  </ol>
                )}

                {/* Subsections (H3) if present */}
                {section.subsections && section.subsections.length > 0 && (
                  <div className="space-y-4 pt-3 pl-2 sm:pl-3 border-l-2 border-[#1e293b]">
                    {section.subsections.map((sub, subIdx) => (
                      <div key={sub.id} id={sub.id} className="scroll-mt-24 space-y-2">
                        <h3 className="font-display text-base sm:text-lg font-bold text-slate-200">
                          <span className="text-sky-400 font-mono text-xs mr-1.5 font-normal">
                            {sIdx + 1}.{subIdx + 1}
                          </span>
                          {sub.title}
                        </h3>

                        {sub.figure && <ArticleFigure figure={sub.figure} />}

                        {sub.paragraphs.map((subP, spIdx) => (
                          <p key={spIdx} className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                            {subP}
                          </p>
                        ))}

                        {sub.bulletPoints && (
                          <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs sm:text-sm marker:text-sky-400">
                            {sub.bulletPoints.map((bp, bpIdx) => (
                              <li key={bpIdx}>{bp}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* ==================================================
              4. REFERENCES & CITATIONS
              ================================================== */}
          <ReferenceList citations={article.citations} />

          {/* ==================================================
              5. CATEGORIES & TAXONOMY
              ================================================== */}
          <section
            id="article-categories"
            aria-label="Article Categories"
            className="pt-4 border-t border-[#1e293b] space-y-2"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Tag size={13} className="text-sky-400" />
              <span>Categories & Topics:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Primary Category Link */}
              <button
                type="button"
                onClick={() => navigate(`/category/${article.categorySlug}`)}
                className="px-2.5 py-1 bg-sky-950/80 text-sky-300 hover:bg-sky-900/80 rounded-sm text-xs font-semibold border border-sky-800/60 transition-colors cursor-pointer"
              >
                {article.category}
              </button>

              {/* SubCategory Link if present */}
              {article.subCategory && (
                <button
                  type="button"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(article.subCategory!)}`)}
                  className="px-2 py-1 bg-[#141c2e] text-slate-300 hover:bg-[#1a253c] hover:text-sky-300 rounded-sm text-xs font-medium border border-[#1e293b] transition-colors cursor-pointer"
                >
                  {article.subCategory}
                </button>
              )}

              {/* Tag Pills */}
              {article.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                  className="px-2 py-0.5 bg-[#0e1422] text-slate-400 hover:text-sky-400 hover:border-sky-500/40 rounded-sm text-xs border border-[#1e293b] transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          {/* ==================================================
              6. LAST UPDATED & DATA SOURCE NOTE
              ================================================== */}
          <div className="p-3 bg-[#0e1422] border border-[#1e293b] rounded-sm text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              This encyclopedia article was last verified on{' '}
              <strong className="text-slate-200 font-medium">{formatDate(article.lastUpdated)}</strong>.
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              ID: {article.id}
            </span>
          </div>

          {/* ==================================================
              7. RELATED ARTICLES
              ================================================== */}
          <RelatedArticles articles={relatedArticles} />
        </div>

        {/* ==================================================
            RIGHT COLUMN: INFOBOX & CONTEXT CARDS (Desktop)
            ================================================== */}
        <div className="lg:col-span-4 w-full space-y-5">
          {/* Infobox */}
          {article.infobox && (
            <ArticleInfobox infobox={article.infobox} />
          )}

          {/* Discipline Navigation Card */}
          <div className="bg-[#0e1422] border border-[#1e293b] rounded-sm p-4 text-xs space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <FolderTree size={14} className="text-sky-400" />
              <span>Discipline Navigation</span>
            </div>
            <p className="text-slate-400 leading-relaxed font-sans">
              This entry is indexed under{' '}
              <button
                type="button"
                onClick={() => navigate(`/category/${article.categorySlug}`)}
                className="text-sky-400 font-bold hover:underline cursor-pointer"
              >
                {article.category}
              </button>
              {article.subCategory && ` / ${article.subCategory}`}.
            </p>
            <div className="pt-2 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => navigate(`/category/${article.categorySlug}`)}
                className="text-sky-400 hover:text-sky-300 font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
              >
                Browse all {article.category} entries &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

