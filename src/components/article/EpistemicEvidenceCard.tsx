import React from 'react';
import { EpistemicEvidenceClaim, EpistemicClassification } from '../../types';
import { CheckCircle2, AlertTriangle, HelpCircle, ExternalLink, ShieldCheck, FileText } from 'lucide-react';

export interface EpistemicStandardMeta {
  id: EpistemicClassification;
  label: string;
  badgeLabel: string;
  dot: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  shortExplanation: string;
  colorName: string;
  darkBox: {
    bg: string;
    border: string;
    text: string;
  };
  lightBadge: {
    bg: string;
    border: string;
    text: string;
    iconColor: string;
  };
  optionButton: {
    base: string;
    selected: string;
  };
}

export const EPISTEMIC_EVIDENCE_STANDARDS: Record<EpistemicClassification, EpistemicStandardMeta> = {
  CONFIRMED: {
    id: 'CONFIRMED',
    label: 'Confirmed',
    badgeLabel: '🟢 Confirmed',
    dot: '🟢',
    icon: CheckCircle2,
    description:
      'Empirically verified through official government transcripts, judicial depositions, declassified memos, or peer-reviewed primary archives.',
    shortExplanation: 'Supported by reliable, verifiable evidence.',
    colorName: 'green',
    darkBox: {
      bg: 'bg-slate-800/60',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
    },
    lightBadge: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      text: 'text-emerald-900',
      iconColor: 'text-emerald-700',
    },
    optionButton: {
      base: 'bg-white hover:bg-emerald-50/50 border-slate-300 text-slate-800',
      selected: 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/40 shadow-xs font-semibold',
    },
  },
  DISPUTED: {
    id: 'DISPUTED',
    label: 'Disputed',
    badgeLabel: '🟡 Disputed',
    dot: '🟡',
    icon: AlertTriangle,
    description:
      'Multiple conflicting contemporary accounts or scholarly disagreements exist regarding private motivations or closed-door conversations.',
    shortExplanation: 'Conflicting evidence or credible disagreements.',
    colorName: 'yellow',
    darkBox: {
      bg: 'bg-slate-800/60',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
    },
    lightBadge: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-900',
      iconColor: 'text-amber-700',
    },
    optionButton: {
      base: 'bg-white hover:bg-amber-50/50 border-slate-300 text-slate-800',
      selected: 'bg-amber-50 border-amber-600 text-amber-950 ring-2 ring-amber-500/40 shadow-xs font-semibold',
    },
  },
  ALLEGED: {
    id: 'ALLEGED',
    label: 'Alleged',
    badgeLabel: '🟠 Alleged',
    dot: '🟠',
    icon: AlertTriangle,
    description:
      'Formally stated in investigative journalism or witness testimony, but lacking conclusive documentary or financial confirmation.',
    shortExplanation: 'Allegations or claims not conclusively established.',
    colorName: 'orange',
    darkBox: {
      bg: 'bg-slate-800/60',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
    },
    lightBadge: {
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      text: 'text-orange-900',
      iconColor: 'text-orange-700',
    },
    optionButton: {
      base: 'bg-white hover:bg-orange-50/50 border-slate-300 text-slate-800',
      selected: 'bg-orange-50 border-orange-600 text-orange-950 ring-2 ring-orange-500/40 shadow-xs font-semibold',
    },
  },
  THEORY: {
    id: 'THEORY',
    label: 'Theory',
    badgeLabel: '🔴 Theory',
    dot: '🔴',
    icon: HelpCircle,
    description:
      'Speculative hypotheses or conspiracy mythologies explicitly analyzed and separated from established historical fact.',
    shortExplanation: 'Hypotheses or speculative explanations; not facts.',
    colorName: 'red/pink',
    darkBox: {
      bg: 'bg-slate-800/60',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
    },
    lightBadge: {
      bg: 'bg-rose-50',
      border: 'border-rose-300',
      text: 'text-rose-900',
      iconColor: 'text-rose-700',
    },
    optionButton: {
      base: 'bg-white hover:bg-rose-50/50 border-slate-300 text-slate-800',
      selected: 'bg-rose-50 border-rose-600 text-rose-950 ring-2 ring-rose-500/40 shadow-xs font-semibold',
    },
  },
};

export const normalizeClassification = (
  raw?: string | null
): EpistemicClassification => {
  if (!raw) return 'CONFIRMED';
  const upper = raw.toUpperCase().trim();
  if (upper === 'CONFIRMED' || upper.includes('FACT') || upper.includes('CONFIRM')) return 'CONFIRMED';
  if (upper === 'DISPUTED' || upper.includes('DISPUTE')) return 'DISPUTED';
  if (upper === 'ALLEGED' || upper.includes('ALLEG') || upper.includes('CLAIM')) return 'ALLEGED';
  if (upper === 'THEORY' || upper.includes('THEOR') || upper.includes('HYPOTHESIS')) return 'THEORY';
  return 'CONFIRMED';
};

interface EpistemicClassificationBadgeProps {
  classification: EpistemicClassification | string;
  size?: 'sm' | 'md';
  dark?: boolean;
}

export const EpistemicClassificationBadge: React.FC<EpistemicClassificationBadgeProps> = ({
  classification,
  size = 'md',
  dark = false,
}) => {
  const norm = normalizeClassification(classification);
  const standard = EPISTEMIC_EVIDENCE_STANDARDS[norm];
  const Icon = standard.icon;

  if (dark) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider rounded-xs border px-2 py-0.5 ${
          size === 'sm' ? 'text-[10px]' : 'text-[11px]'
        } ${standard.darkBox.bg} ${standard.darkBox.text} ${standard.darkBox.border}`}
      >
        <Icon size={size === 'sm' ? 12 : 13} />
        <span>{standard.badgeLabel}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider rounded-xs border px-2 py-0.5 shadow-2xs ${
        size === 'sm' ? 'text-[10px]' : 'text-[11px]'
      } ${standard.lightBadge.bg} ${standard.lightBadge.text} ${standard.lightBadge.border}`}
    >
      <Icon size={size === 'sm' ? 12 : 13} className={standard.lightBadge.iconColor} />
      <span>{standard.badgeLabel}</span>
    </span>
  );
};

interface EpistemicClaimsSectionProps {
  claims: EpistemicEvidenceClaim[];
  title?: string;
  className?: string;
}

export const EpistemicClaimsSection: React.FC<EpistemicClaimsSectionProps> = ({
  claims,
  title = 'Epistemic Evidence & Claim Classifications',
  className = '',
}) => {
  if (!claims || claims.length === 0) return null;

  return (
    <div
      className={`my-4 bg-[#fafbfc] border border-[#cbd5e1] rounded-sm p-4 sm:p-5 space-y-3.5 shadow-2xs ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#3366cc]" />
          <h4 className="font-serif text-sm sm:text-base font-bold text-[#101418]">
            {title}
          </h4>
        </div>
        <span className="text-[10px] font-mono uppercase bg-blue-50 text-[#3366cc] border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
          Strict 4-Tier Epistemic Standard
        </span>
      </div>

      {/* Claim Cards List */}
      <div className="space-y-3">
        {claims.map((item, idx) => {
          const norm = normalizeClassification(item.classification);
          const standard = EPISTEMIC_EVIDENCE_STANDARDS[norm];

          return (
            <div
              key={item.id || idx}
              className={`bg-white border rounded-sm p-3.5 sm:p-4 space-y-2.5 transition-all shadow-xs ${
                norm === 'CONFIRMED'
                  ? 'border-emerald-300/80 hover:border-emerald-400'
                  : norm === 'DISPUTED'
                  ? 'border-amber-300/80 hover:border-amber-400'
                  : norm === 'ALLEGED'
                  ? 'border-orange-300/80 hover:border-orange-400'
                  : 'border-rose-300/80 hover:border-rose-400'
              }`}
            >
              {/* Badge & Claim Statement */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <EpistemicClassificationBadge classification={norm} size="sm" />
                    <span className="text-[10px] font-mono text-[#72777d]">
                      Evidence Record #{idx + 1}
                    </span>
                  </div>
                  <p className="font-serif font-bold text-sm sm:text-base text-[#101418] leading-snug pt-0.5">
                    {item.claim}
                  </p>
                </div>
              </div>

              {/* Epistemic Rationale / Explanation */}
              {item.explanation && (
                <div className="bg-[#f8f9fa] border-l-2 border-[#3366cc] p-2.5 text-xs text-[#374151] rounded-r-xs space-y-0.5 font-sans">
                  <strong className="font-semibold text-[#111827]">Epistemic Rationale:</strong>{' '}
                  <span className="leading-relaxed">{item.explanation}</span>
                </div>
              )}

              {/* Supporting Document / Source Link */}
              {(item.sourceTitle || item.sourceUrl) && (
                <div className="pt-1.5 border-t border-[#f1f5f9] flex items-center gap-1.5 text-xs text-[#54595d] font-mono flex-wrap">
                  <FileText size={12} className="text-[#72777d] shrink-0" />
                  <span className="text-[11px] text-[#72777d]">Supporting Source:</span>
                  {item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3366cc] hover:underline font-semibold inline-flex items-center gap-1 text-[11px] break-all"
                    >
                      <span>{item.sourceTitle || item.sourceUrl}</span>
                      <ExternalLink size={11} className="shrink-0" />
                    </a>
                  ) : (
                    <span className="text-[#101418] font-semibold text-[11px]">
                      {item.sourceTitle}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
