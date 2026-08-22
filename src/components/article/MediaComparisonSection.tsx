import React from 'react';
import { MediaComparison } from '../../types';
import { Film, AlertCircle, CheckCircle2, Clapperboard, BookOpen } from 'lucide-react';

interface MediaComparisonSectionProps {
  comparison: MediaComparison;
}

export const MediaComparisonSection: React.FC<MediaComparisonSectionProps> = ({ comparison }) => {
  return (
    <section className="bg-white border-2 border-rose-200/80 rounded-sm p-5 sm:p-6 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xs bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <Film size={16} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-rose-700 font-bold block">
              Popular Media vs Reality Fact-Check
            </span>
            <h3 className="font-serif text-lg font-bold text-slate-900">
              {comparison.workTitle}
            </h3>
          </div>
        </div>
        <span className="font-mono text-xs text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-xs self-start sm:self-auto">
          {comparison.workType}
        </span>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dramatized Elements */}
        <div className="bg-rose-50/40 border border-rose-200/70 rounded-xs p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-800 uppercase">
            <Clapperboard size={13} />
            <span>Cinematic Inaccuracies &amp; Simplifications</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700 font-sans">
            {comparison.dramatizedElements.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <AlertCircle size={13} className="text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Omitted Realities */}
        <div className="bg-amber-50/40 border border-amber-200/70 rounded-xs p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-900 uppercase">
            <BookOpen size={13} />
            <span>Omitted Archival Facts</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700 font-sans">
            {comparison.omittedRealities.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-600 font-bold shrink-0 mt-0.5">&bull;</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Historical Consensus Footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-xs p-3.5 flex items-start gap-2.5">
        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
            Archival Consensus
          </span>
          <p className="text-xs text-slate-800 font-serif leading-relaxed">
            {comparison.historicalConsensus}
          </p>
        </div>
      </div>
    </section>
  );
};
