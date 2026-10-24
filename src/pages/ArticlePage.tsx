import React from 'react';
import { useRouter } from '../context/RouterContext';
import { useArticle, useArticles } from '../data/dataProvider';
import { useSEO } from '../hooks/useSEO';
import { generateArticleSchema } from '../lib/seo';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { TableOfContents } from '../components/article/TableOfContents';
import { ArticleInfobox } from '../components/article/ArticleInfobox';
import { ArticleFigure } from '../components/article/ArticleFigure';
import { InlineCitationText } from '../components/article/InlineCitationText';
import { ReferenceList } from '../components/article/ReferenceList';
import { RelatedArticles } from '../components/article/RelatedArticles';
import { ArticleActions } from '../components/article/ArticleActions';
import { ArticleShare } from '../components/article/ArticleShare';
import { ArticleNotFound } from '../components/article/ArticleNotFound';
import { ArticleAiCompanion } from '../components/article/ArticleAiCompanion';
import { LoadingState } from '../components/common/LoadingState';
import { EpistemicBadge } from '../components/common/EpistemicBadge';
import { FinancialScandalMechanism } from '../components/article/FinancialScandalMechanism';
import { MediaComparisonSection } from '../components/article/MediaComparisonSection';
import { PrimaryDocumentsSection } from '../components/article/PrimaryDocumentsSection';
import { ControversyAnalysisSection } from '../components/article/ControversyAnalysisSection';
import { InvestigationEvidenceMatrix } from '../components/article/InvestigationEvidenceMatrix';
import { EpistemicClaimsSection } from '../components/article/EpistemicEvidenceCard';
import { InteractiveTimeline } from '../components/article/InteractiveTimeline';
import { HandwrittenMarginNotes } from '../components/article/HandwrittenMarginNotes';
import { DossierProgressIndicator } from '../components/article/DossierProgressIndicator';
import { SensitiveContentDisclaimer } from '../components/article/SensitiveContentDisclaimer';
import { TheLegendsWikiLogo } from '../components/common/TheLegendsWikiLogo';
import {
  Clock,
  Eye,
  Calendar,
  Tag,
  FolderTree,
  FileCheck,
  Share2,
  Bookmark,
  Check,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Key,
} from 'lucide-react';

interface ArticlePageProps {
  slug: string;
}

export const ArticlePage: React.FC<ArticlePageProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const { article, loading } = useArticle(slug);
  const { articles: allArticles } = useArticles();

  // Dynamic SEO and Structured Data injection
  useSEO(
    article
      ? {
          title: `${article.title} — Behind the Curtains`,
          description: article.summary,
          keywords: [
            article.category,
            article.subCategory || '',
            ...(article.tags || []),
            article.title,
            'behind the curtains',
            'investigation',
          ].filter(Boolean),
          canonicalUrl: `/wiki/${article.slug}`,
          ogType: 'article',
          ogImage: article.featuredImage || article.image,
          ogImageAlt: article.imageAlt || article.imageCaption || article.title,
          publishedTime: article.createdAt,
          modifiedTime: article.updatedAt || article.createdAt,
          author: article.author || 'TheLegendsWiki Editorial Desk',
          section: article.category,
          tags: article.tags || [],
          structuredData: generateArticleSchema(article),
        }
      : {
          title: 'Dossier Not Found',
          description: 'The requested Behind-the-Curtains record could not be located in TheLegendsWiki index.',
          noindex: true,
        },
    [article?.id, article?.title, article?.lastUpdated]
  );

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

  // Citations collection
  const citations = article.citations || article.references || [];

  // Structured breadcrumbs
  const breadcrumbItems = [
    { label: 'Behind the Curtains', path: '/' },
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

  const heroImageUrl = article.featuredImage || article.image;
  const hasInfoboxImage = Boolean(article.infobox?.image);

  return (
    <>
      {/* Subtle Sticky Dossier Declassification Progress Indicator */}
      <div className="no-print">
        <DossierProgressIndicator
          articleTitle={article.title}
          classificationLevel="CONFIDENTIAL // DECLASSIFIED"
        />
      </div>

      <article
        id={`wiki-article-${article.slug}`}
        itemScope
        itemType="https://schema.org/Article"
        className="space-y-5 max-w-5xl mx-auto pb-12 pt-2"
      >
      {/* ==================================================
          PRINT-ONLY MASTHEAD & ARCHIVAL RECORD STAMP
          ================================================== */}
      <header className="print-masthead hidden">
        <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-2">
          <div className="flex items-center gap-3">
            <TheLegendsWikiLogo size="md" className="border border-black" />
            <div>
              <div className="font-serif font-bold text-xl tracking-tight text-black">
                TheLegendsWiki &mdash; Behind the Curtains
              </div>
              <div className="text-[8.5pt] font-mono uppercase tracking-wider text-slate-700">
                The Open Knowledge Codex &bull; Investigative Archival Record
              </div>
            </div>
          </div>
          <div className="text-right text-[8pt] font-mono text-slate-700">
            <div className="font-bold border border-black px-1.5 py-0.5 inline-block mb-0.5">
              DECLASSIFIED ARCHIVE
            </div>
            <div>RECORD: /wiki/{article.slug}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[8.5pt] font-sans border-b border-slate-400 pb-2 mb-3">
          <div>
            <div><strong>Discipline:</strong> {article.category}{article.subCategory ? ` / ${article.subCategory}` : ''}</div>
            <div><strong>Curated By:</strong> {article.author || 'TheLegendsWiki Editorial Desk'}</div>
            <div><strong>Epistemic Depth:</strong> {article.knowledgeDepth || 'Documented Fact'}</div>
          </div>
          <div className="text-right">
            <div><strong>Last Revised:</strong> {formatDate(article.lastUpdated)}</div>
            <div><strong>Estimated Reading:</strong> {article.readingTimeMinutes} minutes</div>
            <div><strong>Canonical Permalink:</strong> https://thelegendswiki.org/wiki/{article.slug}</div>
          </div>
        </div>
      </header>

      {/* ==================================================
          1. BREADCRUMBS & ARTICLE CONTEXT
          ================================================== */}
      <div className="border-b border-[#eaecf0] pb-2 no-print">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* ==================================================
          2. ARTICLE TITLE & INTRODUCTORY METADATA
          ================================================== */}
      <header className="space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 border-b border-[#a2a9b1] pb-2">
          <h1
            itemProp="headline"
            className="font-serif text-3xl sm:text-4xl font-bold text-[#101418] leading-tight tracking-tight"
          >
            {article.title}
          </h1>
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {article.pronunciation && (
              <span className="font-mono text-xs text-[#54595d] bg-[#f8f9fa] px-2 py-0.5 rounded-sm border border-[#cbd5e1]">
                Pronunciation: {article.pronunciation}
              </span>
            )}
            <ArticleShare
              articleTitle={article.title}
              articleSlug={article.slug}
              category={article.category}
              summary={article.summary}
              align="right"
            />
          </div>
        </div>

        {/* Article Action Tabs */}
        <ArticleActions
          articleTitle={article.title}
          articleSlug={article.slug}
          category={article.category}
          summary={article.summary}
        />

        {/* Metadata Strip */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#72777d] pt-1 font-sans">
          <span className="inline-flex items-center gap-1.5 text-amber-900 font-serif font-bold">
            <TheLegendsWikiLogo size="xs" />
            <span>TheLegendsWiki &bull; Behind the Curtains</span>
          </span>
          <span className="text-[#cbd5e1]">&bull;</span>
          <button
            type="button"
            onClick={() => navigate(`/category/${article.categorySlug}`)}
            className="inline-flex items-center gap-1 text-amber-800 font-semibold hover:underline cursor-pointer"
          >
            <span>{article.category}</span>
          </button>
          {article.knowledgeDepth && (
            <>
              <span className="text-[#cbd5e1]">&bull;</span>
              <EpistemicBadge depth={article.knowledgeDepth} size="sm" />
            </>
          )}
          <span className="text-[#cbd5e1]">&bull;</span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} className="text-[#72777d]" />
            <span>{article.readingTimeMinutes} min read</span>
          </span>
          <span className="text-[#cbd5e1]">&bull;</span>
          <span className="inline-flex items-center gap-1 font-mono">
            <Eye size={12} className="text-[#72777d]" />
            <span>{article.views.toLocaleString()} views</span>
          </span>
          <span className="text-[#cbd5e1]">&bull;</span>
          <span className="inline-flex items-center gap-1 font-mono">
            <Calendar size={12} className="text-[#72777d]" />
            <span>Revised: {formatDate(article.lastUpdated)}</span>
          </span>
          {article.author && (
            <>
              <span className="text-[#cbd5e1]">&bull;</span>
              <button
                type="button"
                onClick={() => {
                  const authorHandle = article.authorId || article.author.replace(/^@+/, '').replace(/\s+/g, '_').toLowerCase();
                  navigate(`/user/${authorHandle}`);
                }}
                className="inline-flex items-center gap-1 text-[#54595d] hover:text-amber-800 hover:underline cursor-pointer"
                itemProp="author"
                title="View Contributor Profile"
              >
                <FileCheck size={12} className="text-amber-700" />
                <span>{article.author}</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Behind the Curtains Banner */}
      <section className="curtains-atmosphere border border-amber-500/40 rounded-sm p-4 sm:p-5 text-slate-100 space-y-2 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600/30 via-amber-400 to-amber-600/30" />
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-xs bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles size={13} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                Behind the Curtains Dossier
              </span>
              <h3 className="font-serif font-bold text-sm sm:text-base text-amber-200">
                {article.behindCurtainsContext || 'What Happened Behind Closed Doors, Decisions & Public Image'}
              </h3>
            </div>
          </div>
          <EpistemicBadge depth={article.knowledgeDepth || 'Documented Fact'} size="sm" dark={true} />
        </div>
      </section>

      {/* ==================================================
          3. MAIN ARTICLE LAYOUT (CONTENT & INFOBOX)
          ================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        {/* Main Left/Center Column: Table of Contents & Article Body */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Hero / Lead Figure if provided and not in infobox */}
          {heroImageUrl && !hasInfoboxImage && (
            <ArticleFigure
              figure={{
                url: heroImageUrl,
                caption: article.imageCaption || `Archival reference for ${article.title}`,
                alt: article.imageAlt || article.imageCaption || `Archival depiction of ${article.title}`,
                credit: article.imageCredit,
                align: 'right',
              }}
            />
          )}

          {/* Summary Lead Paragraph with interactive citations and wikilinks */}
          <div
            id="article-lead"
            itemProp="description"
            className="text-base text-[#202122] leading-relaxed font-sans border-l-3 border-amber-600 pl-3.5 py-1 bg-[#f8f9fa] rounded-r-xs"
          >
            <p className="m-0">
              <InlineCitationText
                text={article.summary}
                citations={citations}
                paragraphId="lead"
                currentArticleSlug={article.slug}
              />
            </p>
          </div>

          {/* Table of Contents */}
          <TableOfContents
            sections={article.sections}
            hasReferences={citations.length > 0}
            hasRelated={relatedArticles.length > 0 || true}
          />

          {/* Article Semantic Body Content */}
          <div
            id="article-content"
            itemProp="articleBody"
            className="encyclopedia-article-body space-y-7 text-[#202122] text-sm sm:text-base leading-relaxed"
          >
            {article.sections.map((section, sIdx) => (
              <section
                key={section.id || sIdx}
                id={section.id}
                className="scroll-mt-24 space-y-3"
              >
                {/* Section Heading (H2) */}
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#101418] border-b border-[#a2a9b1] pb-1 pt-2">
                  <span className="text-[#54595d] font-mono font-normal text-lg mr-2">
                    {sIdx + 1}.
                  </span>
                  {section.title}
                </h2>

                {/* Section Image Figure if present */}
                {section.figure && (
                  <ArticleFigure figure={section.figure} />
                )}

                {/* Section Paragraphs with interactive inline citations & wikilinks */}
                {(section.content || [])
                  .flatMap((c) => (typeof c === 'string' ? c.split(/\n\n+/) : [c]))
                  .filter((p) => (typeof p === 'string' ? p.trim().length > 0 : Boolean(p)))
                  .map((paragraph, pIdx) => (
                    <p key={pIdx} className="text-[#202122] leading-relaxed font-sans whitespace-pre-line">
                      <InlineCitationText
                        text={paragraph}
                        citations={citations}
                        paragraphId={`s${sIdx}-p${pIdx}`}
                        currentArticleSlug={article.slug}
                      />
                    </p>
                  ))}

                {/* Unordered Bullet Points if present */}
                {section.bulletPoints && section.bulletPoints.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1.5 text-[#202122] marker:text-amber-700">
                    {section.bulletPoints.map((point, bIdx) => (
                      <li key={bIdx} className="leading-relaxed pl-1">
                        <InlineCitationText
                          text={point}
                          citations={citations}
                          paragraphId={`s${sIdx}-b${bIdx}`}
                          currentArticleSlug={article.slug}
                        />
                      </li>
                    ))}
                  </ul>
                )}

                {/* Ordered Numbered Points if present */}
                {section.orderedPoints && section.orderedPoints.length > 0 && (
                  <ol className="list-decimal pl-5 space-y-2 text-[#202122] marker:font-mono marker:text-amber-700">
                    {section.orderedPoints.map((point, oIdx) => (
                      <li key={oIdx} className="leading-relaxed pl-1">
                        <InlineCitationText
                          text={point}
                          citations={citations}
                          paragraphId={`s${sIdx}-o${oIdx}`}
                          currentArticleSlug={article.slug}
                        />
                      </li>
                    ))}
                  </ol>
                )}

                {/* Subsections (H3) if present */}
                {section.subsections && section.subsections.length > 0 && (
                  <div className="space-y-4 pt-2 pl-3 border-l-2 border-[#eaecf0]">
                    {section.subsections.map((sub, subIdx) => (
                      <div key={sub.id || subIdx} id={sub.id} className="scroll-mt-24 space-y-2">
                        <h3 className="font-serif text-base sm:text-lg font-bold text-[#101418]">
                          <span className="text-[#72777d] font-mono text-xs mr-1.5 font-normal">
                            {sIdx + 1}.{subIdx + 1}
                          </span>
                          {sub.title}
                        </h3>

                        {sub.figure && <ArticleFigure figure={sub.figure} />}

                        {(sub.paragraphs || []).map((subP, spIdx) => (
                          <p key={spIdx} className="text-[#202122] text-xs sm:text-sm leading-relaxed">
                            <InlineCitationText
                              text={subP}
                              citations={citations}
                              paragraphId={`s${sIdx}-sub${subIdx}-p${spIdx}`}
                              currentArticleSlug={article.slug}
                            />
                          </p>
                        ))}

                        {sub.bulletPoints && (
                          <ul className="list-disc pl-5 space-y-1 text-[#202122] text-xs sm:text-sm marker:text-amber-700">
                            {sub.bulletPoints.map((bp, bpIdx) => (
                              <li key={bpIdx}>
                                <InlineCitationText
                                  text={bp}
                                  citations={citations}
                                  paragraphId={`s${sIdx}-sub${subIdx}-b${bpIdx}`}
                                  currentArticleSlug={article.slug}
                                />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Epistemic Claims / Evidence Standards */}
                {section.claims && section.claims.length > 0 && (
                  <EpistemicClaimsSection
                    claims={section.claims}
                    title={`Epistemic Evidence Standards: ${section.title}`}
                  />
                )}
              </section>
            ))}
          </div>

          {/* Top-level Epistemic Claims if present */}
          {article.claims && article.claims.length > 0 && (
            <EpistemicClaimsSection claims={article.claims} />
          )}

          {/* ==================================================
              SPECIALIZED RESEARCH COMPONENTS
              ================================================== */}
          {/* 1. Financial Scandal Mechanism */}
          {article.financialMechanism && (
            <FinancialScandalMechanism mechanism={article.financialMechanism} />
          )}

          {/* 2. Media vs Reality Comparison */}
          {article.mediaComparison && (
            <MediaComparisonSection comparison={article.mediaComparison} />
          )}

          {/* 2.5 Evidentiary Dossier & Investigation Engine Matrix */}
          <InvestigationEvidenceMatrix articleSlug={article.slug} articleTitle={article.title} />

          {/* 3. Primary Historical Documents */}
          {article.primaryDocuments && article.primaryDocuments.length > 0 && (
            <PrimaryDocumentsSection documents={article.primaryDocuments} />
          )}

          {/* 4. Controversy Analysis */}
          {article.controversyAnalysis && (
            <ControversyAnalysisSection analysis={article.controversyAnalysis} />
          )}

          {/* 5. Interactive Chronological Timeline */}
          {article.timelineEvents && article.timelineEvents.length > 0 && (
            <InteractiveTimeline events={article.timelineEvents} />
          )}

          {/* ==================================================
              3.5 SENSITIVE CONTENT DISCLAIMER (Near end, before sources)
              ================================================== */}
          {(article.isSensitive || article.contentSensitivity === 'sensitive') && (
            <SensitiveContentDisclaimer
              rationale={article.sensitivityRationale || article.behindCurtainsContext}
            />
          )}

          {/* ==================================================
              4. REFERENCES & CITATIONS
              ================================================== */}
          <ReferenceList citations={citations} />

          {/* ==================================================
              5. CATEGORIES & TAXONOMY
              ================================================== */}
          <section
            id="article-categories"
            aria-label="Article Categories"
            className="p-3.5 bg-[#f8f9fa] border border-[#a2a9b1] rounded-sm space-y-2.5"
          >
            <div className="flex items-center justify-between text-xs font-bold text-[#54595d] uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Tag size={13} className="text-amber-800" />
                <span>Behind the Curtains Facets:</span>
              </div>
              {article.knowledgeDepth && (
                <span className="font-mono text-[10px] text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded-xs font-bold">
                  Epistemic Depth: {article.knowledgeDepth}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-mono text-[11px] mr-1">Discipline:</span>
              <button
                type="button"
                onClick={() => navigate(`/category/${article.categorySlug}`)}
                className="px-2 py-0.5 bg-amber-50 text-amber-900 hover:underline rounded-xs border border-amber-300 font-semibold cursor-pointer"
              >
                {article.category}
              </button>

              {article.subCategory && (
                <button
                  type="button"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(article.subCategory!)}`)}
                  className="px-2 py-0.5 bg-white text-slate-700 hover:underline rounded-xs border border-slate-300 font-medium cursor-pointer"
                >
                  {article.subCategory}
                </button>
              )}

              {article.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                  className="px-2 py-0.5 bg-white text-slate-600 hover:text-amber-800 hover:underline rounded-xs border border-slate-200 cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          {/* Inline Share & Permalink Broadcast Strip */}
          <div className="no-print">
            <ArticleShare
              articleTitle={article.title}
              articleSlug={article.slug}
              category={article.category}
              summary={article.summary}
              variant="inline"
            />
          </div>

          {/* ==================================================
              6. LAST UPDATED & DATA SOURCE NOTE
              ================================================== */}
          <div className="p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm text-xs text-[#54595d] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              This investigation was revised on{' '}
              <strong className="text-[#101418] font-medium">{formatDate(article.lastUpdated)}</strong>.
            </span>
            <span className="font-mono text-[10px] text-[#72777d]">
              Archival Record: /wiki/{article.slug}
            </span>
          </div>

          {/* ==================================================
              7. ARTICLE FOOTER POLICY LINKS
              ================================================== */}
          <div className="p-3 bg-[#ffffff] border border-[#eaecf0] rounded-sm flex flex-wrap items-center justify-center sm:justify-between gap-2.5 text-xs text-[#72777d] no-print">
            <div className="flex items-center gap-1.5">
              <TheLegendsWikiLogo size="xs" className="w-4 h-4" />
              <span className="text-[11px] font-sans font-medium text-[#101418]">TheLegendsWiki Encyclopedia Codex</span>
            </div>
            <nav aria-label="Article Policies" className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => navigate('/privacy-policy')}
                className="text-[#3366cc] hover:underline cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-[#cbd5e1]">&bull;</span>
              <button
                type="button"
                onClick={() => navigate('/terms')}
                className="text-[#3366cc] hover:underline cursor-pointer"
              >
                Terms
              </button>
              <span className="text-[#cbd5e1]">&bull;</span>
              <button
                type="button"
                onClick={() => navigate('/editorial-policy')}
                className="text-[#3366cc] hover:underline cursor-pointer"
              >
                Editorial Policy
              </button>
              <span className="text-[#cbd5e1]">&bull;</span>
              <button
                type="button"
                onClick={() => navigate('/content-policy')}
                className="text-[#3366cc] hover:underline cursor-pointer"
              >
                Content Policy
              </button>
            </nav>
          </div>

          {/* ==================================================
              8. RELATED ARTICLES
              ================================================== */}
          <div className="no-print">
            <RelatedArticles
              articles={relatedArticles}
              currentArticle={article}
            />
          </div>
        </div>

        {/* ==================================================
            RIGHT COLUMN: INFOBOX, NOTES & CONTEXT CARDS
            ================================================== */}
        <div className="lg:col-span-4 w-full space-y-5">
          {/* AI Research Companion (Hidden in Print) */}
          <div className="no-print">
            <ArticleAiCompanion article={article} />
          </div>

          {/* Infobox */}
          {article.infobox && (
            <ArticleInfobox infobox={article.infobox} />
          )}

          {/* Marginalia & Handwritten Notes */}
          {article.handwrittenNotes && article.handwrittenNotes.length > 0 && (
            <HandwrittenMarginNotes notes={article.handwrittenNotes} />
          )}

          {/* Facet Exploration Card (Hidden in Print) */}
          <div className="bg-[#f8f9fa] border border-[#a2a9b1] rounded-sm p-4 text-xs space-y-2 no-print">
            <div className="font-bold text-[#101418] flex items-center gap-1.5">
              <FolderTree size={14} className="text-amber-800" />
              <span>Behind the Curtains Archive</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-sans">
              This dossier is indexed under{' '}
              <button
                type="button"
                onClick={() => navigate(`/category/${article.categorySlug}`)}
                className="text-amber-800 font-bold hover:underline cursor-pointer"
              >
                {article.category}
              </button>
              {article.subCategory && ` / ${article.subCategory}`}.
            </p>
            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => navigate(`/category/${article.categorySlug}`)}
                className="text-amber-800 hover:underline font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
              >
                Browse all {article.category} dossiers &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          PRINT-ONLY FOOTER NOTICE & CITATION STAMP
          ================================================== */}
      <footer className="print-footer-notice hidden">
        <div className="flex items-center justify-between border-t border-slate-500 pt-2 text-[8pt] font-mono text-slate-700">
          <div>
            Retrieved from TheLegendsWiki &bull; https://thelegendswiki.org/wiki/{article.slug}
          </div>
          <div>
            Document Printed: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div className="text-[7.5pt] text-slate-600 font-sans mt-1">
          Text is available under the Creative Commons Attribution-ShareAlike License 4.0 (CC BY-SA 4.0). Confidential &bull; Archival Record.
        </div>
      </footer>
    </article>
    </>
  );
};
