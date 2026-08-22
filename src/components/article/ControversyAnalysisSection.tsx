import React from 'react';
import { ControversyAnalysis } from '../../types';
import { Scale, Users2, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';

interface ControversyAnalysisSectionProps {
  analysis: ControversyAnalysis;
}

export const ControversyAnalysisSection: React.FC<ControversyAnalysisSectionProps> = ({ analysis }) => {
  return (
    <section className="bg-white border-2 border-purple-200/80 rounded-sm p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xs bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <Scale size={16} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-700 font-bold block">
              Multi-Perspective Historical Analysis
            </span>
            <h3 className="font-serif text-lg font-bold text-slate-900">
              {analysis.coreControversy}
            </h3>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-xs font-bold self-start sm:self-auto">
          Epistemic Inquiry
        </span>
      </div>

      {/* Mainstream vs Alternative View (if provided) */}
      {(analysis.mainstreamView || analysis.alternativeView) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
          {analysis.mainstreamView && (
            <div className="bg-slate-50 border border-slate-200 rounded-xs p-3.5 space-y-1.5">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-600 block">
                Standard Mainstream Historiography
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                {analysis.mainstreamView}
              </p>
            </div>
          )}
          {analysis.alternativeView && (
            <div className="bg-purple-50/50 border border-purple-200/70 rounded-xs p-3.5 space-y-1.5">
              <span className="text-[10px] font-mono uppercase font-bold text-purple-900 block">
                Investigative / Revisionist Finding
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                {analysis.alternativeView}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Conflicting Perspectives (if present) */}
      {analysis.perspectives && analysis.perspectives.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Users2 size={13} className="text-purple-700" />
            <span>Competing Perspectives &amp; Primary Accounts</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.perspectives.map((persp, idx) => (
              <div
                key={idx}
                className="bg-purple-50/30 border border-purple-100 rounded-xs p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-serif font-bold text-xs sm:text-sm text-purple-950">
                    {persp.factionOrScholar}
                  </h5>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {persp.argument}
                </p>
                <div className="pt-1 text-[11px] font-mono text-purple-900 border-t border-purple-100/80">
                  <strong>Cited Key Evidence:</strong> {persp.keyEvidence}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modern Historiographical Consensus */}
      <div className="bg-slate-50 border border-slate-200 rounded-xs p-3.5 flex items-start gap-2.5">
        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
            Current Academic &amp; Archival Consensus
          </span>
          <p className="text-xs text-slate-800 font-serif leading-relaxed">
            {analysis.modernHistoriographicalConsensus}
          </p>
        </div>
      </div>
    </section>
  );
};
