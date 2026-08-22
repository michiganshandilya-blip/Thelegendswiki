import React from 'react';
import { FinancialMechanism } from '../../types';
import { TrendingDown, Landmark, AlertTriangle, ArrowRight, ShieldCheck, FileSpreadsheet } from 'lucide-react';

interface FinancialScandalMechanismProps {
  mechanism: FinancialMechanism;
}

export const FinancialScandalMechanism: React.FC<FinancialScandalMechanismProps> = ({ mechanism }) => {
  return (
    <section className="bg-slate-900 border border-amber-500/40 rounded-sm p-5 sm:p-6 text-slate-100 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xs bg-amber-950 border border-amber-500/60 flex items-center justify-center text-amber-400">
            <FileSpreadsheet size={16} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
              Forensic Mechanics &bull; Behind Closed Doors
            </span>
            <h3 className="font-serif text-lg font-bold text-slate-100">
              {mechanism.schemeType}
            </h3>
          </div>
        </div>
        {mechanism.estimatedQuantum && (
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Capital Quantum</span>
            <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/70 border border-amber-400/40 px-2 py-0.5 rounded-xs">
              {mechanism.estimatedQuantum}
            </span>
          </div>
        )}
      </div>

      {/* Step-by-Step Flow */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <span>1. Chronological Step-by-Step Mechanism</span>
        </h4>
        <div className="space-y-2.5">
          {mechanism.stepByStepFlow.map((step) => (
            <div
              key={step.stepNumber}
              className="bg-slate-800/70 border border-slate-700/80 hover:border-amber-400/60 rounded-xs p-3.5 space-y-1.5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-slate-950 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                  {step.stepNumber}
                </span>
                <h5 className="font-serif font-bold text-sm text-amber-200">
                  {step.title}
                </h5>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans pl-7">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Compromised Institutions & Regulatory Failures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {mechanism.institutionsInvolved && mechanism.institutionsInvolved.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-800 rounded-xs p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase">
              <Landmark size={13} />
              <span>Institutions Compromised / Leveraged</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-300 font-sans">
              {mechanism.institutionsInvolved.map((inst, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="text-amber-500 font-bold">&bull;</span>
                  <span>{inst}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {mechanism.regulatoryFailures && mechanism.regulatoryFailures.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-800 rounded-xs p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400 uppercase">
              <AlertTriangle size={13} />
              <span>Systemic Regulatory Loopholes</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-300 font-sans">
              {mechanism.regulatoryFailures.map((fail, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-rose-400 font-bold">&bull;</span>
                  <span className="leading-snug">{fail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Legal & Regulatory Aftermath */}
      {mechanism.legalOutcomes && mechanism.legalOutcomes.length > 0 && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xs p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase">
            <ShieldCheck size={13} />
            <span>Statutory Reforms &amp; Legal Resolution</span>
          </div>
          <ul className="space-y-1 text-xs text-slate-300 font-sans">
            {mechanism.legalOutcomes.map((out, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span className="leading-snug">{out}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
