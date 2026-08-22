import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { ShieldCheck, Scale, FileText, ExternalLink, HelpCircle } from 'lucide-react';

interface SensitiveContentDisclaimerProps {
  rationale?: string;
  className?: string;
}

/**
 * SensitiveContentDisclaimer Component
 * 
 * Automatically displayed near the end of articles containing investigative,
 * sensitive, controversial, financial, corporate, or alleged misconduct topics.
 * Designed to be subtle, objective, educational, and strictly non-sensational.
 */
export const SensitiveContentDisclaimer: React.FC<SensitiveContentDisclaimerProps> = ({
  rationale,
  className = '',
}) => {
  const { navigate } = useRouter();

  return (
    <aside
      role="note"
      aria-label="Sensitive and Investigative Content Disclaimer"
      className={`p-4 sm:p-5 bg-[#f8f9fa] border border-[#cbd5e1] border-l-4 border-l-[#b45309] rounded-sm text-xs text-[#202122] shadow-xs space-y-3 font-sans ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1 bg-amber-100 text-[#b45309] rounded-xs shrink-0 mt-0.5">
          <Scale size={16} />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-[#101418] text-xs uppercase tracking-wide font-serif">
              Editorial &amp; Sensitive Content Notice
            </h3>
            <span className="text-[10px] font-mono text-[#72777d] bg-[#ffffff] border border-[#eaecf0] px-1.5 py-0.5 rounded-xs">
              Public Record &bull; Documentary Research
            </span>
          </div>

          <p className="text-[#54595d] leading-relaxed text-xs">
            This article is compiled and presented strictly for{' '}
            <strong className="text-[#101418]">informational, educational, historical, and journalistic/documentary purposes</strong>.
            Sensitive, corporate, financial, or historical subjects are examined factually, neutrally, and within their documented archival context.
          </p>

          {rationale && (
            <div className="p-2.5 bg-[#ffffff] border border-[#eaecf0] rounded-xs text-[11px] text-[#54595d] italic">
              <span className="font-semibold text-[#101418] not-italic font-mono text-[10px] uppercase mr-1">
                Context:
              </span>
              {rationale}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px] text-[#54595d] leading-normal">
            <div className="space-y-1">
              <div>
                &bull; <strong className="text-[#202122]">Allegations vs. Established Facts:</strong> Unadjudicated claims, indictments, and historical disputes are reported as documented allegations and must not be construed as definitive findings of fact unless substantiated by final judicial verdicts or scholarly consensus.
              </div>
              <div>
                &bull; <strong className="text-[#202122]">Neutral Intent:</strong> TheLegendsWiki does not seek to defame, harass, target, or gratuitously harm any individual or organization.
              </div>
            </div>
            <div className="space-y-1">
              <div>
                &bull; <strong className="text-[#202122]">Source Attribution:</strong> Readers are encouraged to inspect the primary records, regulatory filings, and citations listed below.
              </div>
              <div>
                &bull; <strong className="text-[#202122]">Continuous Errata:</strong> Content is actively maintained and updated when verified new evidence alters the factual record.
              </div>
            </div>
          </div>

          {/* Quick action policy links */}
          <div className="pt-2 border-t border-[#eaecf0] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#72777d]">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/editorial-policy')}
                className="text-[#3366cc] hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
              >
                <FileText size={11} /> Editorial Policy
              </button>
              <span className="text-[#cbd5e1]">&bull;</span>
              <button
                type="button"
                onClick={() => navigate('/content-policy')}
                className="text-[#3366cc] hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
              >
                <ShieldCheck size={11} /> Content Policy
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/contact')}
              className="text-[#72777d] hover:text-[#101418] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle size={11} /> Submit Correction or Errata &rarr;
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
