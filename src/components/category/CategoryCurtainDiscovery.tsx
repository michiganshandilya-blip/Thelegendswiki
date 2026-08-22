import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { Sparkles, ArrowRight, ShieldAlert, BookOpen, Compass, Key } from 'lucide-react';
import { Article } from '../../types';

interface CategoryCurtainDiscoveryProps {
  categorySlug: string;
  categoryName: string;
  curtainArticles?: Article[];
  className?: string;
}

interface CategoryDossierConfig {
  title: string;
  headline: string;
  description: string;
  dossierHighlights: string[];
}

const CATEGORY_CURTAIN_CONFIGS: Record<string, CategoryDossierConfig> = {
  history: {
    title: 'History — Behind the Curtains',
    headline: 'Forgotten accounts, unresolved questions and deeper historical mysteries.',
    description:
      'Beyond standard historiography lies an archive of lost manuscripts, disputed chronological records, and centuries-old enigmas that standard historical narratives leave unanswered.',
    dossierHighlights: [
      'The Library of Alexandria Burning Discrepancies',
      'Antikythera Mechanism Astronomical Anomalies',
      'The Voynich Manuscript Cryptanalysis',
      'Lost Bronze Age Collapse Hypotheses',
    ],
  },
  business: {
    title: 'Business — Behind the Curtains',
    headline: 'Financial scandals, disputed events and stories hidden beneath the numbers.',
    description:
      'Uncover the obscured mechanisms of corporate sovereign balance sheets, market crashes, covert mergers, and financial structures that reshaped global commerce behind closed doors.',
    dossierHighlights: [
      'Offshore Sovereign Wealth Routing Networks',
      'Historical Commodity Cornering Operations',
      'Early Central Bank Creation Accords',
      'Corporate Intelligence & Industrial Espionage',
    ],
  },
  organizations: {
    title: 'Organizations — Behind the Curtains',
    headline: 'Secretive organizations, controversial histories and unanswered questions.',
    description:
      'Investigate historical fraternities, closed-door policy summits, private intelligence foundations, and the enigmatic institutional architectures that operate beyond public view.',
    dossierHighlights: [
      'Declassified Cold War Scientific Consortiums',
      'Historical Guilds and Scholarly Fraternities',
      'Private Advisory Think Tanks & Geopolitical Conclaves',
      'Monastic Cartographic & Archival Orders',
    ],
  },
  people: {
    title: 'People — Behind the Curtains',
    headline: 'Unpublished manuscripts, enigmatic correspondences, and shadowed biographical chapters.',
    description:
      'Examine the unpublicized journals, eccentric private experiments, disputed authorship claims, and hidden motivations of history’s most influential thinkers and leaders.',
    dossierHighlights: [
      "Nikola Tesla's Wardenclyffe Lost Papers & Seized Notes",
      'Isaac Newton’s Secret Alchemical Manuscripts',
      'Ada Lovelace’s Private Computational Speculations',
      'Disputed Historical Diarists & Pseudonyms',
    ],
  },
  politics: {
    title: 'Politics — Behind the Curtains',
    headline: 'Declassified diplomatic dispatches, classified accords, and covert geopolitical strategies.',
    description:
      'Explore the covert treaties, diplomatic back-channels, intelligence dossiers, and undisclosed territorial pacts that forged the modern international order.',
    dossierHighlights: [
      'Cold War Back-Channel Diplomatic Cables',
      'Unsigned Neutrality & Non-Aggression Understandings',
      'Secret Protocol Annexes to Historic Treaties',
      'Covert Maritime Exclusion Accords',
    ],
  },
  education: {
    title: 'Education — Behind the Curtains',
    headline: 'Suppressed scientific paradigms, lost libraries, and unorthodox research programs.',
    description:
      'Delve into forgotten pedagogical movements, lost classical archives, unorthodox academic experiments, and the institutional resistance encountered by revolutionary scientific theories.',
    dossierHighlights: [
      'The Lost Libraries of Medieval Scholasticism',
      'Suppressed Early Heliocentric & Quantum Models',
      'Unorthodox 19th Century Research Institutes',
      'The Classification of Ancient Mechanical Treatises',
    ],
  },
  events: {
    title: 'Events — Behind the Curtains',
    headline: 'Anomalous chronologies, contested eyewitness accounts, and archival lacunae.',
    description:
      'Scrutinize the historical turning points where official timelines clash with primary witness testimonies, missing logs, and uncorroborated archival gaps.',
    dossierHighlights: [
      'The 1908 Tunguska Explosion Forensic Debates',
      'Unexplained Deep-Sea Acoustic Anomalies',
      'The Lost Expeditions of the High Arctic',
      'Contested Chronologies of Ancient Cataclysms',
    ],
  },
};

export const CategoryCurtainDiscovery: React.FC<CategoryCurtainDiscoveryProps> = ({
  categorySlug,
  categoryName,
  curtainArticles = [],
  className = '',
}) => {
  const { navigate } = useRouter();

  // Normalize slug matching
  const slugClean = categorySlug.toLowerCase().replace(/[^a-z0-9]/g, '');
  const config =
    CATEGORY_CURTAIN_CONFIGS[slugClean] ||
    CATEGORY_CURTAIN_CONFIGS[categorySlug] || {
      title: `${categoryName} — Behind the Curtains`,
      headline: 'Deeper archival accounts, disputed events, and investigative inquiries.',
      description: `Explore the secondary layer of ${categoryName} entries indexed with theoretical frameworks, classified files, and historical investigations.`,
      dossierHighlights: [
        'Classified Historical Dossiers',
        'Controverted Scholarly Inquiries',
        'Unpublished Primary Correspondences',
        'Epistemic Re-examinations',
      ],
    };

  const handleEnterCurtains = () => {
    navigate(`/category/${categorySlug}?curtains=true`);
  };

  return (
    <section
      id={`curtain-discovery-${categorySlug}`}
      aria-label={`${categoryName} Behind the Curtains Discovery`}
      className={`relative overflow-hidden rounded-sm curtains-atmosphere border border-amber-500/40 p-6 sm:p-7 shadow-2xl ${className}`}
    >
      {/* Decorative curtain accent lines */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600/40 via-amber-400 to-amber-600/40" />
      <div className="absolute -right-12 -bottom-12 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles size={15} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                Mysteries Behind the Curtains &bull; Secondary Layer
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-100 leading-tight">
                {config.title}
              </h3>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-300 bg-amber-950/70 border border-amber-500/30 px-2.5 py-0.5 rounded-xs shadow-xs">
            <Key size={11} className="text-amber-400" />
            <span>Curtain Codex Archive</span>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2.5">
            <h4 className="font-serif text-sm sm:text-base font-semibold text-amber-200/90 leading-snug">
              &ldquo;{config.headline}&rdquo;
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {config.description}
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleEnterCurtains}
                className="inline-flex items-center gap-2 px-4.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-serif font-bold text-xs rounded-xs shadow-md hover:shadow-amber-500/25 transition-all cursor-pointer group"
              >
                <span>Explore {categoryName} Behind the Curtains</span>
                <ArrowRight size={13} className="text-slate-950 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Dossier Highlights / Fast peek */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800/90 rounded-xs p-4 space-y-2.5 shadow-inner">
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90 font-bold flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <BookOpen size={11} className="text-amber-400" />
              <span>Key Inquiries in this Domain:</span>
            </div>
            <ul className="space-y-1.5">
              {config.dossierHighlights.map((item, idx) => (
                <li
                  key={idx}
                  onClick={handleEnterCurtains}
                  className="text-[11px] text-slate-300 hover:text-amber-300 font-sans flex items-start gap-1.5 cursor-pointer group transition-colors"
                >
                  <span className="text-amber-500 font-mono text-[10px] select-none">&bull;</span>
                  <span className="line-clamp-1 group-hover:underline">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
