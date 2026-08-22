import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { SearchBar } from '../components/common/SearchBar';
import { ArticleCard } from '../components/common/ArticleCard';
import { CategoryCard } from '../components/common/CategoryCard';
import { Button } from '../components/common/Button';
import { EpistemicBadge } from '../components/common/EpistemicBadge';
import { HeroBrandWordmark } from '../components/common/HeroBrandWordmark';
import { useArticles, useCategories } from '../data/dataProvider';
import { useSEO } from '../hooks/useSEO';
import { generateWebsiteSchema } from '../lib/seo';
import { 
  Sparkles, 
  TrendingDown, 
  Scale, 
  Film, 
  FileCheck2, 
  Cpu, 
  Hammer, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  Shuffle,
  PenTool,
  Clock,
  Compass,
  FileText,
  Key,
  Globe2
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate, getRandomArticleSlug } = useRouter();
  const { articles } = useArticles();
  const { categories } = useCategories();
  const [selectedFacet, setSelectedFacet] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  // Dynamic SEO & Structured Data
  useSEO({
    title: 'TheLegendsWiki — Behind the Curtains Knowledge Platform',
    description: 'The dedicated Behind-the-Curtains knowledge platform. Revealing what happens behind the scenes, behind closed doors, behind public images, and behind finished stories.',
    canonicalUrl: '/',
    ogType: 'website',
    structuredData: generateWebsiteSchema(),
  });

  // Featured flagship investigations
  const featuredArticles = articles.filter((a) => a.featured);
  const primaryFeatured = featuredArticles[0] || articles[0];
  const secondaryFeatured = featuredArticles.slice(1, 4);

  // Filtered investigations by facet and region
  const filteredArticles = articles.filter((a) => {
    const matchesFacet = selectedFacet === 'all' || a.categorySlug === selectedFacet;
    const matchesRegion = selectedRegion === 'All' || a.region === selectedRegion;
    return matchesFacet && matchesRegion;
  });

  // Media fact-check spotlight entries
  const mediaComparisonArticles = articles.filter((a) => a.mediaComparison).slice(0, 3);

  // Recent disclosures
  const recentArticles = [...articles]
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, 4);

  const handleRandomArticle = () => {
    const slug = getRandomArticleSlug();
    navigate(`/wiki/${slug}`);
  };

  return (
    <div className="space-y-10 pb-12">
      {/* ==================================================
          1. IMMERSIVE HERO: EXCLUSIVELY BEHIND THE CURTAINS
          ================================================== */}
      <section
        id="curtains-hero"
        aria-label="Behind the Curtains Platform Welcome"
        className="relative overflow-hidden rounded-sm curtains-atmosphere border border-amber-500/40 p-6 sm:p-10 shadow-2xl text-slate-100"
      >
        {/* Subtle decorative curtain drapery gradient and atmospheric spotlights */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600/30 via-amber-400 to-amber-600/30" />
        <div className="absolute -top-28 -right-28 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -left-28 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-800/90">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-amber-950/90 border border-amber-400/50 text-amber-300 text-[11px] uppercase font-mono font-bold tracking-widest rounded-xs flex items-center gap-1.5 shadow-xs">
                  <Sparkles size={12} className="text-amber-400" />
                  <span>The Dedicated Behind-the-Curtains Codex</span>
                </span>
                <span className="text-xs text-amber-200/60 font-mono hidden sm:inline">&bull;</span>
                <span className="font-handwritten text-sm text-amber-200/90 font-medium">
                  The stories behind the stories.
                </span>
              </div>

              {/* Large Hand-Painted Brush-Calligraphy Brand Wordmark with Falling Leaves */}
              <HeroBrandWordmark />

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-sans max-w-2xl font-light">
                Every story has a visible surface. <strong className="text-amber-200 font-semibold">TheLegendsWiki reveals what happened behind the scenes</strong>—the closed-door bargains, forensic money flows, uncredited inventors, engineering crises, and suppressed records.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRandomArticle}
                icon={<Shuffle size={13} />}
                className="bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                Random Dossier
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/create')}
                icon={<PenTool size={13} />}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold border-amber-400"
              >
                Contribute Story
              </Button>
            </div>
          </div>

          {/* Search inside the Curtains Gateway */}
          <div className="pt-2 max-w-3xl space-y-3">
            <SearchBar
              size="large"
              placeholder="Search behind-the-scenes stories, decisions, scandals, declassified files..."
              onSearchSubmit={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
            />

            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-300">
              <span className="font-medium text-amber-300/80 font-mono text-[11px] flex items-center gap-1">
                <Key size={11} /> Key Inquiries:
              </span>
              {[
                { label: 'Harshad Mehta 1992 Scam', slug: 'harshad-mehta-1992-securities-scam' },
                { label: 'Gandhi & Bhagat Singh (1931)', slug: 'gandhi-bhagat-singh-delhi-pact' },
                { label: 'Enron & Arthur Andersen', slug: 'enron-scandal-and-arthur-andersen' },
                { label: 'Apollo 11 1202 Alarm', slug: 'apollo-11-moon-landing' },
                { label: 'Bavarian Illuminati (1776)', slug: 'order-of-the-bavarian-illuminati' },
                { label: 'Ada Lovelace Note G', slug: 'ada-lovelace' },
              ].map((term) => (
                <button
                  key={term.slug}
                  type="button"
                  onClick={() => navigate(`/wiki/${term.slug}`)}
                  className="text-amber-200/90 hover:text-amber-100 hover:underline px-2 py-0.5 bg-slate-900/80 border border-slate-700/80 hover:border-amber-400/60 rounded-xs cursor-pointer text-xs transition-colors"
                >
                  {term.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          2. BEHIND-THE-CURTAINS CORE FACETS NAVIGATOR
          ================================================== */}
      <section className="bg-white border border-[#cbd5e1] p-5 rounded-sm shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-amber-700" />
            <h2 className="text-sm sm:text-base font-serif font-bold text-[#0f172a]">
              Behind the Curtains Investigative Dimensions
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Explore by Type of Behind-the-Scenes Insight</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {[
            { name: 'Behind Financial Markets', icon: <TrendingDown size={14} className="text-amber-700" />, path: '/category/behind-financial-markets' },
            { name: 'Behind Corporations', icon: <Cpu size={14} className="text-purple-700" />, path: '/category/behind-corporations' },
            { name: 'Behind History', icon: <Scale size={14} className="text-blue-700" />, path: '/category/behind-history' },
            { name: 'Behind the Evidence', icon: <FileCheck2 size={14} className="text-emerald-700" />, path: '/category/behind-the-evidence' },
            { name: 'Behind the Mysteries', icon: <EyeOff size={14} className="text-stone-700" />, path: '/category/behind-the-mysteries' },
          ].map((facet) => (
            <button
              key={facet.name}
              type="button"
              onClick={() => navigate(facet.path)}
              className="text-left p-3 bg-slate-50/70 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-400/80 rounded-xs transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  {facet.icon}
                  <span className="text-xs font-serif font-bold text-slate-900 group-hover:text-amber-900">
                    {facet.name}
                  </span>
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-200/60 text-[10px] font-mono text-amber-800 group-hover:translate-x-0.5 transition-transform flex items-center justify-between">
                <span>View Dossiers</span>
                <span>&rarr;</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ==================================================
          3. FEATURED INVESTIGATION OF THE CODEX
          ================================================== */}
      {primaryFeatured && (
        <section id="featured-dossier-section" className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-600" />
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#0f172a]">
                Lead Behind-the-Curtains Investigation
              </h2>
            </div>
            <span className="font-mono text-xs text-amber-800 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-xs">
              Declassified Dossier
            </span>
          </div>

          <div className="space-y-4">
            <ArticleCard
              article={primaryFeatured}
              layout="featured"
              showImage={true}
              showViews={true}
            />

            {/* Secondary Flagship Dossiers */}
            {secondaryFeatured.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {secondaryFeatured.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    layout="curtain-dossier"
                    showImage={true}
                    showViews={true}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ==================================================
          4. MEDIA VS REALITY: WHAT CINEMA & POP CULTURE OMITTED
          ================================================== */}
      {mediaComparisonArticles.length > 0 && (
        <section className="bg-white border border-[#cbd5e1] rounded-sm p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#eaecf0] pb-3">
            <div className="flex items-center gap-2.5">
              <Film size={20} className="text-rose-600" />
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#0f172a]">
                  Popular Media vs. What Actually Happened
                </h2>
                <p className="text-xs text-[#64748b] font-sans">
                  The documented historical facts that mainstream movies, television series, and popular summaries simplified or omitted
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono uppercase font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-xs hidden sm:inline">
              Forensic Comparison
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mediaComparisonArticles.map((art) => (
              <div 
                key={art.id} 
                onClick={() => navigate(`/wiki/${art.slug}`)}
                className="p-4 bg-slate-50 border border-slate-200 hover:border-rose-300 hover:bg-rose-50/20 rounded-xs transition-all cursor-pointer space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded-xs">
                      {art.mediaComparison?.workType.toUpperCase()}
                    </span>
                    <EpistemicBadge level={art.knowledgeDepth} size="sm" />
                  </div>
                  <h3 className="font-serif font-bold text-sm text-slate-900 hover:text-rose-700 transition-colors">
                    {art.mediaComparison?.workTitle}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-sans">
                    {art.mediaComparison?.historicalConsensus}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-amber-900 font-mono font-bold">
                  <span>Explore Behind the Curtains</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==================================================
          5. REGIONAL ARCHIVE EXPLORATION & RECENT DISCLOSURES
          ================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#cbd5e1] pb-2.5">
          <div className="flex items-center gap-2">
            <Globe2 size={18} className="text-amber-800" />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#0f172a]">
              Regional Behind-the-Scenes Inquiries
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {['All', 'India', 'Europe', 'North America', 'Asia', 'Global'].map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => setSelectedRegion(region)}
                className={`text-xs px-2.5 py-1 rounded-xs font-mono transition-colors cursor-pointer ${
                  selectedRegion === region
                    ? 'bg-amber-800 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {filteredArticles.slice(0, 4).map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              layout="vertical"
              showImage={true}
              showViews={true}
            />
          ))}
        </div>
      </section>

      {/* ==================================================
          6. STRICT 4-TIER EPISTEMIC EVIDENCE STANDARDS
          ================================================== */}
      <section className="bg-slate-900 text-slate-100 p-6 rounded-sm space-y-4 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <h3 className="font-serif text-base sm:text-lg font-bold text-white">
              TheLegendsWiki Epistemic Evidence Standards
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Strict Classification Applied to All Curtains Dossiers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-800/60 border border-emerald-500/30 rounded-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold uppercase text-[11px]">
              <CheckCircle2 size={13} />
              <span>🟢 Confirmed</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Empirically verified through official government transcripts, judicial depositions, declassified memos, or peer-reviewed primary archives.
            </p>
          </div>

          <div className="p-3 bg-slate-800/60 border border-amber-500/30 rounded-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold uppercase text-[11px]">
              <AlertTriangle size={13} />
              <span>🟡 Disputed</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Multiple conflicting contemporary accounts or scholarly disagreements exist regarding private motivations or closed-door conversations.
            </p>
          </div>

          <div className="p-3 bg-slate-800/60 border border-orange-500/30 rounded-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-orange-400 font-mono font-bold uppercase text-[11px]">
              <AlertTriangle size={13} />
              <span>🟠 Alleged</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Formally stated in investigative journalism or witness testimony, but lacking conclusive documentary or financial confirmation.
            </p>
          </div>

          <div className="p-3 bg-slate-800/60 border border-rose-500/30 rounded-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-rose-400 font-mono font-bold uppercase text-[11px]">
              <HelpCircle size={13} />
              <span>🔴 Theory</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Speculative hypotheses or conspiracy mythologies explicitly analyzed and separated from established historical fact.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================
          7. EDITORIAL CODEX CHARTER
          ================================================== */}
      <section className="bg-gradient-to-r from-amber-50/70 to-stone-100/90 border border-amber-200/80 rounded-sm p-6 sm:p-8 text-center space-y-3 shadow-xs">
        <div className="max-w-2xl mx-auto space-y-2">
          <span className="font-mono uppercase tracking-widest text-[10px] text-amber-900 font-bold block">
            Exclusive Editorial Mandate
          </span>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0f172a]">
            Documenting the Hidden Architecture of History &amp; Innovation
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
            TheLegendsWiki accepts only Behind-the-Curtains investigations. Every contributor submission must reveal the making, development, private decisions, challenges, hidden details, or lesser-known events behind a public subject.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/create')}
            icon={<PenTool size={14} />}
            className="bg-amber-700 hover:bg-amber-600 text-white font-bold"
          >
            Submit a Behind-the-Curtains Story
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleRandomArticle}
            icon={<Shuffle size={14} />}
          >
            Inspect Random Dossier
          </Button>
        </div>
      </section>
    </div>
  );
};
