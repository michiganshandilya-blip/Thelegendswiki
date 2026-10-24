import React from 'react';
import { useConsent } from '../../context/ConsentContext';
import { useRouter } from '../../context/RouterContext';
import { ShieldCheck, Sliders, Check, X, Shield, ExternalLink } from 'lucide-react';

export const CookieConsentBanner: React.FC = () => {
  const { isBannerOpen, acceptAll, rejectNonEssential, openPreferencesModal } = useConsent();
  const { navigate } = useRouter();

  if (!isBannerOpen) return null;

  return (
    <div
      role="region"
      aria-label="Privacy and Cookie Consent"
      className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 bg-white/95 backdrop-blur-md border-t-2 border-[#3366cc] shadow-2xl no-print animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Icon & Editorial Copy */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-sm bg-[#3366cc]/10 border border-[#3366cc]/30 text-[#3366cc] flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1 text-xs text-[#54595d] leading-relaxed">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-[#101418]">
                Notice &amp; Privacy Preferences
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#3366cc] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-xs">
                Archival Codex
              </span>
            </div>
            <p>
              TheLegendsWiki uses strictly necessary cookies and local tokens to provide secure authentication, protect against bot abuse, and maintain revision archives. With your consent, we also use preference and anonymous analytics storage to enhance your reading experience.
            </p>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] pt-0.5">
              <button
                type="button"
                onClick={() => navigate('/disclaimer')}
                className="text-[#3366cc] hover:underline cursor-pointer font-medium"
              >
                Disclaimer
              </button>
              <span className="text-[#cbd5e1]">&bull;</span>
              <button
                type="button"
                onClick={() => navigate('/terms')}
                className="text-[#3366cc] hover:underline cursor-pointer font-medium"
              >
                Terms of Use
              </button>
              <span className="text-[#cbd5e1]">&bull;</span>
              <button
                type="button"
                onClick={() => navigate('/privacy-policy')}
                className="text-[#3366cc] hover:underline cursor-pointer font-medium"
              >
                Privacy Policy
              </button>
              <span className="text-[#cbd5e1]">&bull;</span>
              <button
                type="button"
                onClick={() => navigate('/cookie-policy')}
                className="text-[#3366cc] hover:underline cursor-pointer font-medium"
              >
                Cookie Policy
              </button>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={openPreferencesModal}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-medium text-[#202122] bg-[#f8f9fa] hover:bg-[#eaecf0] border border-[#a2a9b1] rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#3366cc]"
          >
            <Sliders size={13} className="text-[#54595d]" />
            <span>Customize</span>
          </button>
          <button
            type="button"
            onClick={rejectNonEssential}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-medium text-[#202122] bg-[#ffffff] hover:bg-[#f8f9fa] border border-[#a2a9b1] rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#3366cc]"
          >
            <X size={13} className="text-[#54595d]" />
            <span>Reject Non-Essential</span>
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-[#3366cc] hover:bg-[#2557bb] rounded-sm transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#3366cc]"
          >
            <Check size={14} />
            <span>Accept All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
