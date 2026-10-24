import React from 'react';
import { useRouter } from '../context/RouterContext';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { useSEO } from '../hooks/useSEO';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { EpistemicBadge } from '../components/common/EpistemicBadge';
import { Button } from '../components/common/Button';
import {
  Compass,
  ArrowRight,
  Sparkles,
  FileText,
  Clock,
  ShieldCheck,
  Eye,
  Key,
  Layers,
  HelpCircle,
  TrendingDown,
  Cpu,
  Scale
} from 'lucide-react';

interface SeriesPageProps {
  slug?: string;
}

export const SeriesPage: React.FC<SeriesPageProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const { settings } = useSystemSettings();
  const series = settings.featuredSeries || {
    title: 'Who Taught Us to Want This?',
    slug: 'who-taught-us-to-want-this',
    subtitle: 'Behind manufactured desires, advertising psychology & algorithmic conditioning',
    description: 'An authoritative forensic deep-dive into the engineers, psychologists, and boardroom strategists who constructed modern consumer desire, engineered social status, and shaped what society craves behind closed doors.',
    bannerImageUrl: '',
    active: true,
    targetPath: '/series/who-taught-us-to-want-this',
  };

  const currentTitle = series.title || 'Who Taught Us to Want This?';

  useSEO({
    title: `${currentTitle} — Featured Investigation Series | TheLegendsWiki`,
    description: series.description || 'An investigative dossier series on manufactured desires and behavioral architecture.',
    canonicalUrl: `/series/${series.slug || 'who-taught-us-to-want-this'}`,
    ogType: 'website',
  });

  const breadcrumbItems = [
    { label: 'Behind the Curtains', path: '/' },
    { label: 'Featured Series', path: '/series' },
    { label: currentTitle },
  ];

  const seriesChapters = [
    {
      number: 'PART I',
      title: 'The Architecture of Manufactured Scarcity',
      subtitle: 'How artificial stock bubbles, synthetic panics, and FOMO were weaponized to dictate desire.',
      dossierSlug: 'harshad-mehta-1992',
      dossierTitle: 'Behind the Curtains: Harshad Mehta and the 1992 Securities Scam',
      icon: <TrendingDown size={16} className="text-amber-500" />,
      epistemic: 'Confirmed' as const,
      summary: 'Before desire can be monetized, scarcity must be fabricated. How banking circulars and interbank receipts created the illusion of unstoppable growth, driving millions of everyday savers to abandon caution for manufactured euphoria.',
      records: ['RBI Janakiraman Committee Reports (1992–1993)', 'Bank Receipts (BR) Syndicate Deposition Exhibits'],
    },
    {
      number: 'PART II',
      title: 'The Engineering of Corporate Infallibility',
      subtitle: 'The fabrication of public trust, prestige accounting, and off-balance-sheet mythology.',
      dossierSlug: 'enron-arthur-andersen',
      dossierTitle: 'Behind the Curtains: Enron & Arthur Andersen Document Shredding',
      icon: <Cpu size={16} className="text-purple-500" />,
      epistemic: 'Confirmed' as const,
      summary: 'How Fortune’s "Most Innovative Company in America" used sophisticated public relations, theatrical trading floors, and prestigious audit certifications to manufacture institutional credibility while hiding billions in toxic debt.',
      records: ['SEC Enforcement Division Filing 01-CV-3624', 'Powers Investigative Committee Report (2002)'],
    },
    {
      number: 'PART III',
      title: 'The Hidden Machinery of Public Consensus',
      subtitle: 'From historic secret orders to modern behavioral focus groups.',
      dossierSlug: 'bavarian-illuminati',
      dossierTitle: 'Behind the Curtains: The Bavarian Illuminati Original Charters',
      icon: <Scale size={16} className="text-blue-500" />,
      epistemic: 'Confirmed' as const,
      summary: 'Declassified archival orders revealing how small circles sought to quietly steer social values, institutional appointments, and moral definitions without public detection or democratic consultation.',
      records: ['Bavarian State Archives Electorate Decrees (1784–1787)', 'Schwedenkiste Secret Diplomatic Dossiers'],
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 pt-2">
      {/* Breadcrumbs */}
      <div className="border-b border-[#eaecf0] dark:border-slate-800 pb-2">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Archival Masthead Header */}
      <header className="space-y-4 border-b border-[#a2a9b1] dark:border-slate-700 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-950/90 border border-amber-500/50 text-amber-300 font-mono text-[11px] font-bold tracking-wider uppercase rounded-xs flex items-center gap-1.5 shadow-xs">
              <Sparkles size={12} className="text-amber-400" />
              <span>Special Investigation Series</span>
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull;</span>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              SERIAL REF: SRS-2026-DESIRE
            </span>
          </div>
          <EpistemicBadge level="Confirmed" size="sm" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            {currentTitle}
          </h1>
          {series.subtitle && (
            <p className="font-serif italic text-base sm:text-lg text-amber-800 dark:text-amber-300/90 leading-relaxed">
              {series.subtitle}
            </p>
          )}
        </div>

        {/* Custom Promotional Banner Artwork (if provided) */}
        {series.bannerImageUrl && (
          <div className="rounded-xs overflow-hidden border border-[#cbd5e1] dark:border-slate-800 shadow-sm bg-slate-950">
            <img
              src={series.bannerImageUrl}
              alt={series.bannerImageAlt || currentTitle}
              className="w-full h-auto max-h-56 sm:max-h-72 object-cover object-center"
            />
          </div>
        )}

        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xs text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans space-y-2">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider font-bold text-slate-600 dark:text-slate-400">
            <Key size={13} className="text-amber-600" />
            <span>Series Investigative Thesis</span>
          </div>
          <p>
            {series.description ||
              'Every era imagines its desires are organic. We believe we freely choose the careers we envy, the luxuries we pursue, the investments we rush into, and the status markers we exhaust ourselves to attain. This investigation traces the boardroom records, declassified behavioral trials, and psychological campaigns that designed our consensus from behind closed doors.'}
          </p>
        </div>
      </header>

      {/* Series Chapters / Associated Investigations */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#cbd5e1] dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-amber-700 dark:text-amber-400" />
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Curated Series Chapters &amp; Archival Records
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-500">
            {seriesChapters.length} Correlated Dossiers
          </span>
        </div>

        <div className="space-y-4">
          {seriesChapters.map((chapter) => (
            <div
              key={chapter.number}
              className="p-5 bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 hover:border-amber-500/70 rounded-xs transition-all shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest">
                      {chapter.number}
                    </span>
                    <span className="text-slate-400 font-mono text-xs">&bull;</span>
                    <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                      {chapter.icon}
                      <span>Investigation</span>
                    </span>
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                    {chapter.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-sans">
                    {chapter.subtitle}
                  </p>
                </div>
                <div className="shrink-0 self-start sm:self-auto">
                  <EpistemicBadge level={chapter.epistemic} size="sm" />
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                {chapter.summary}
              </p>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-xs space-y-1 text-xs">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Primary Source Exhibits Cited:
                </span>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5">
                  {chapter.records.map((rec, i) => (
                    <li key={i} className="font-mono text-[11px]">{rec}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-mono text-slate-500">
                  Target Dossier: <strong className="text-slate-800 dark:text-slate-200">{chapter.dossierTitle}</strong>
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/wiki/${chapter.dossierSlug}`)}
                  icon={<ArrowRight size={13} />}
                  className="bg-amber-800 hover:bg-amber-700 text-white font-mono text-xs"
                >
                  Examine Dossier
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Editorial Codex Notice */}
      <section className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xs p-5 text-center space-y-2 text-xs text-slate-600 dark:text-slate-400 font-sans">
        <p className="font-serif italic text-sm text-slate-800 dark:text-slate-200">
          "The most potent form of censorship is not the deletion of words, but the engineering of what a culture never thinks to question."
        </p>
        <p className="font-mono text-[11px] text-slate-500">
          TheLegendsWiki Editorial Codex &bull; Archival Series Compilation
        </p>
      </section>
    </div>
  );
};
