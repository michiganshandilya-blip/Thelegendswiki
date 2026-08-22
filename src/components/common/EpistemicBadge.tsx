import React from 'react';
import { KnowledgeDepth } from '../../types';
import { ShieldCheck, FileCheck2, Lightbulb, MessageSquareQuote, HelpCircle, AlertTriangle } from 'lucide-react';

export type ExtendedEpistemicDepth =
  | KnowledgeDepth
  | 'Confirmed'
  | 'Alleged'
  | 'Conspiracy Theory'
  | 'Primary Evidence';

interface EpistemicBadgeProps {
  depth?: ExtendedEpistemicDepth | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  showDot?: boolean;
  dark?: boolean;
  className?: string;
}

interface DefinitionConfig {
  label: string;
  dotColor: string;
  desc: string;
  color: string;
  border: string;
  bg: string;
  darkColor: string;
  darkBorder: string;
  darkBg: string;
  icon: any;
}

export const EPISTEMIC_DEFINITIONS: Record<string, DefinitionConfig> = {
  'Documented Fact': {
    label: '🟢 CONFIRMED',
    dotColor: 'bg-emerald-500',
    desc: 'Supported by strong primary or verified reliable secondary evidence.',
    color: 'text-emerald-900',
    border: 'border-emerald-300',
    bg: 'bg-emerald-50',
    darkColor: 'text-emerald-300',
    darkBorder: 'border-emerald-500/50',
    darkBg: 'bg-emerald-950/80',
    icon: ShieldCheck,
  },
  'Confirmed': {
    label: '🟢 CONFIRMED',
    dotColor: 'bg-emerald-500',
    desc: 'Supported by strong primary or verified reliable secondary evidence.',
    color: 'text-emerald-900',
    border: 'border-emerald-300',
    bg: 'bg-emerald-50',
    darkColor: 'text-emerald-300',
    darkBorder: 'border-emerald-500/50',
    darkBg: 'bg-emerald-950/80',
    icon: ShieldCheck,
  },
  'Evidence': {
    label: '🟢 PRIMARY EVIDENCE',
    dotColor: 'bg-teal-500',
    desc: 'Corroborated by original archival records, court filings, or direct documentation.',
    color: 'text-teal-900',
    border: 'border-teal-300',
    bg: 'bg-teal-50',
    darkColor: 'text-teal-300',
    darkBorder: 'border-teal-500/50',
    darkBg: 'bg-teal-950/80',
    icon: FileCheck2,
  },
  'Primary Evidence': {
    label: '🟢 PRIMARY EVIDENCE',
    dotColor: 'bg-teal-500',
    desc: 'Corroborated by original archival records, court filings, or direct documentation.',
    color: 'text-teal-900',
    border: 'border-teal-300',
    bg: 'bg-teal-50',
    darkColor: 'text-teal-300',
    darkBorder: 'border-teal-500/50',
    darkBg: 'bg-teal-950/80',
    icon: FileCheck2,
  },
  'Disputed': {
    label: '🟡 DISPUTED',
    dotColor: 'bg-amber-500',
    desc: 'Credible historical sources, official bodies, or researchers disagree on facts or interpretations.',
    color: 'text-amber-900',
    border: 'border-amber-300',
    bg: 'bg-amber-50',
    darkColor: 'text-amber-300',
    darkBorder: 'border-amber-500/50',
    darkBg: 'bg-amber-950/80',
    icon: AlertTriangle,
  },
  'Claim': {
    label: '🟠 ALLEGED',
    dotColor: 'bg-orange-500',
    desc: 'An assertion or allegation made without definitive conclusive evidentiary establishment.',
    color: 'text-orange-900',
    border: 'border-orange-300',
    bg: 'bg-orange-50',
    darkColor: 'text-orange-300',
    darkBorder: 'border-orange-500/50',
    darkBg: 'bg-orange-950/80',
    icon: MessageSquareQuote,
  },
  'Alleged': {
    label: '🟠 ALLEGED',
    dotColor: 'bg-orange-500',
    desc: 'An assertion or allegation made without definitive conclusive evidentiary establishment.',
    color: 'text-orange-900',
    border: 'border-orange-300',
    bg: 'bg-orange-50',
    darkColor: 'text-orange-300',
    darkBorder: 'border-orange-500/50',
    darkBg: 'bg-orange-950/80',
    icon: MessageSquareQuote,
  },
  'Theory': {
    label: '🔴 THEORY',
    dotColor: 'bg-rose-500',
    desc: 'A theoretical model, speculative hypothesis, or unverified narrative requiring ongoing scrutiny.',
    color: 'text-rose-900',
    border: 'border-rose-300',
    bg: 'bg-rose-50',
    darkColor: 'text-rose-300',
    darkBorder: 'border-rose-500/50',
    darkBg: 'bg-rose-950/80',
    icon: Lightbulb,
  },
  'Conspiracy Theory': {
    label: '🔴 CONSPIRACY THEORY',
    dotColor: 'bg-rose-600',
    desc: 'A speculative secret-society or conspiracy narrative with absence of corroborated documentary proof.',
    color: 'text-rose-950',
    border: 'border-rose-400',
    bg: 'bg-rose-100',
    darkColor: 'text-rose-300',
    darkBorder: 'border-rose-600/50',
    darkBg: 'bg-rose-950/90',
    icon: Lightbulb,
  },
  'Unknown': {
    label: '⚪ UNKNOWN',
    dotColor: 'bg-slate-400',
    desc: 'Historical or factual parameters remain unresolved, lost to time, or subject to open investigation.',
    color: 'text-slate-800',
    border: 'border-slate-300',
    bg: 'bg-slate-100',
    darkColor: 'text-slate-200',
    darkBorder: 'border-slate-700',
    darkBg: 'bg-slate-900/90',
    icon: HelpCircle,
  },
};

export const EpistemicBadge: React.FC<EpistemicBadgeProps> = ({
  depth,
  size = 'sm',
  showTooltip = true,
  showDot = false,
  dark = false,
  className = '',
}) => {
  if (!depth) return null;

  const normalizedKey = (depth in EPISTEMIC_DEFINITIONS)
    ? depth
    : depth.toLowerCase().includes('fact') || depth.toLowerCase().includes('confirm')
    ? 'Documented Fact'
    : depth.toLowerCase().includes('dispute')
    ? 'Disputed'
    : depth.toLowerCase().includes('alleg') || depth.toLowerCase().includes('claim')
    ? 'Claim'
    : depth.toLowerCase().includes('conspiracy')
    ? 'Conspiracy Theory'
    : depth.toLowerCase().includes('theor')
    ? 'Theory'
    : depth.toLowerCase().includes('evidence')
    ? 'Evidence'
    : 'Unknown';

  const config = EPISTEMIC_DEFINITIONS[normalizedKey] || EPISTEMIC_DEFINITIONS['Claim'];
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'text-[9px] px-1 py-0.2 gap-1',
    sm: 'text-[9.5px] px-1.5 py-0.5 gap-1',
    md: 'text-[10.5px] px-2 py-0.5 gap-1.5',
    lg: 'text-xs px-2.5 py-1 gap-2',
  }[size];

  const iconSizes = {
    xs: 9,
    sm: 10,
    md: 11,
    lg: 13,
  }[size];

  const themeClasses = dark
    ? `${config.darkBg} ${config.darkColor} ${config.darkBorder} shadow-xs`
    : `${config.bg} ${config.color} ${config.border}`;

  return (
    <span
      className={`inline-flex items-center font-mono font-bold tracking-tight rounded-xs border ${themeClasses} ${sizeClasses} ${className}`}
      title={showTooltip ? `${config.label.replace(/^[🟢🟡🟠🔴⚪]\s*/, '')}: ${config.desc}` : undefined}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} shrink-0 animate-pulse`} />
      )}
      <Icon size={iconSizes} className="shrink-0 opacity-80" />
      <span>{config.label}</span>
    </span>
  );
};
