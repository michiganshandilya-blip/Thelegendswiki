import React, { useState, useEffect } from 'react';
import { useConsent } from '../../context/ConsentContext';
import { useRouter } from '../../context/RouterContext';
import {
  ShieldCheck,
  Lock,
  Palette,
  BarChart3,
  Film,
  Check,
  X,
  Sliders,
  ExternalLink,
  Info,
} from 'lucide-react';

export const CookiePreferencesModal: React.FC = () => {
  const {
    consent,
    isPreferencesModalOpen,
    closePreferencesModal,
    saveCustomPreferences,
    acceptAll,
    rejectNonEssential,
  } = useConsent();
  const { navigate } = useRouter();

  const [preferences, setPreferences] = useState({
    preferences: consent?.preferences ?? true,
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
  });

  // Sync state whenever modal opens or consent changes
  useEffect(() => {
    if (isPreferencesModalOpen) {
      setPreferences({
        preferences: consent?.preferences ?? true,
        analytics: consent?.analytics ?? false,
        marketing: consent?.marketing ?? false,
      });
    }
  }, [isPreferencesModalOpen, consent]);

  if (!isPreferencesModalOpen) return null;

  const handleSave = () => {
    saveCustomPreferences(preferences);
  };

  const handleNavigatePolicy = (path: string) => {
    closePreferencesModal();
    navigate(path);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div className="bg-white rounded-sm border border-[#a2a9b1] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#eaecf0] bg-[#f8f9fa]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-[#3366cc] text-white flex items-center justify-center font-bold text-sm">
              <Sliders size={16} />
            </div>
            <div>
              <h2 id="cookie-modal-title" className="font-serif text-lg sm:text-xl font-bold text-[#101418]">
                Cookie &amp; Privacy Preferences
              </h2>
              <p className="text-xs text-[#54595d]">
                Control how TheLegendsWiki manages local data, tokens, and telemetry.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closePreferencesModal}
            aria-label="Close preferences"
            className="p-1.5 text-[#72777d] hover:text-[#101418] hover:bg-[#eaecf0] rounded-xs transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - Category List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-[#54595d] flex-1">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-sm text-xs text-blue-900 flex items-start gap-2.5">
            <Info size={16} className="shrink-0 text-[#3366cc] mt-0.5" />
            <div className="leading-relaxed">
              We uphold strict minimal data practices. We never sell your personal information or deploy behavioral third-party advertising trackers. You can adjust your consent categories at any time.
            </div>
          </div>

          {/* 1. Strictly Necessary */}
          <div className="p-4 border border-[#eaecf0] rounded-sm bg-[#f8f9fa] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#101418] font-bold text-sm font-serif">
                <Lock size={16} className="text-[#3366cc]" />
                <span>1. Strictly Necessary Storage &amp; Tokens</span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-xs">
                Always Active
              </span>
            </div>
            <p className="leading-relaxed">
              Essential for secure authentication, token renewal via Firebase Authentication, Cloudflare Turnstile bot verification challenges, CSRF mitigation, and basic navigation routing. The platform cannot function without these mechanisms.
            </p>
            <div className="text-[11px] font-mono text-[#72777d] pt-1">
              Cookies / Tokens: <code className="bg-white px-1 border border-[#eaecf0]">firebase:authUser</code>, <code className="bg-white px-1 border border-[#eaecf0]">cf_clearance</code>, <code className="bg-white px-1 border border-[#eaecf0]">turnstile</code>
            </div>
          </div>

          {/* 2. Preferences */}
          <div className="p-4 border border-[#eaecf0] rounded-sm hover:border-[#cbd5e1] transition-colors space-y-2 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#101418] font-bold text-sm font-serif">
                <Palette size={16} className="text-[#b45309]" />
                <span>2. Reader Preferences &amp; Experience</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.preferences}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, preferences: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#cbd5e1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3366cc]"></div>
              </label>
            </div>
            <p className="leading-relaxed">
              Stores your interface preferences in your browser&apos;s localStorage, such as Dark/Light theme mode, expanded sidebar panels, and draft article recovery buffers.
            </p>
            <div className="text-[11px] font-mono text-[#72777d] pt-1">
              Storage Keys: <code className="bg-[#f8f9fa] px-1 border border-[#eaecf0]">thelegendswiki-theme</code>, <code className="bg-[#f8f9fa] px-1 border border-[#eaecf0]">draft_cache</code>
            </div>
          </div>

          {/* 3. Analytics & Performance */}
          <div className="p-4 border border-[#eaecf0] rounded-sm hover:border-[#cbd5e1] transition-colors space-y-2 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#101418] font-bold text-sm font-serif">
                <BarChart3 size={16} className="text-[#3366cc]" />
                <span>3. Anonymous Readership Metrics</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#cbd5e1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3366cc]"></div>
              </label>
            </div>
            <p className="leading-relaxed">
              Collects anonymous, aggregated statistics regarding which encyclopedia entries are viewed and system performance load. This data helps our editorial board identify topics in need of research expansion.
            </p>
          </div>

          {/* 4. Embedded Archival Media */}
          <div className="p-4 border border-[#eaecf0] rounded-sm hover:border-[#cbd5e1] transition-colors space-y-2 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#101418] font-bold text-sm font-serif">
                <Film size={16} className="text-[#54595d]" />
                <span>4. Embedded External Archival Media</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, marketing: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#cbd5e1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3366cc]"></div>
              </label>
            </div>
            <p className="leading-relaxed">
              Enables rich embedded media players, primary audio recordings, and digitized microfilm viewports from third-party archival partners.
            </p>
          </div>

          {/* Policy Links */}
          <div className="pt-2 border-t border-[#eaecf0] flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#3366cc]">
            <button
              type="button"
              onClick={() => handleNavigatePolicy('/disclaimer')}
              className="hover:underline cursor-pointer font-medium"
            >
              Disclaimer Notice
            </button>
            <span className="text-[#cbd5e1]">&bull;</span>
            <button
              type="button"
              onClick={() => handleNavigatePolicy('/terms')}
              className="hover:underline cursor-pointer font-medium"
            >
              Terms of Use
            </button>
            <span className="text-[#cbd5e1]">&bull;</span>
            <button
              type="button"
              onClick={() => handleNavigatePolicy('/privacy-policy')}
              className="hover:underline cursor-pointer font-medium"
            >
              Privacy Policy
            </button>
            <span className="text-[#cbd5e1]">&bull;</span>
            <button
              type="button"
              onClick={() => handleNavigatePolicy('/cookie-policy')}
              className="hover:underline cursor-pointer font-medium"
            >
              Detailed Cookie Policy
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 p-4 sm:p-5 border-t border-[#eaecf0] bg-[#f8f9fa]">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={rejectNonEssential}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-medium text-[#202122] bg-white hover:bg-[#f8f9fa] border border-[#a2a9b1] rounded-sm transition-colors cursor-pointer"
            >
              Reject Non-Essential
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-medium text-[#202122] bg-white hover:bg-[#f8f9fa] border border-[#a2a9b1] rounded-sm transition-colors cursor-pointer"
            >
              Accept All
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-[#3366cc] hover:bg-[#2557bb] rounded-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check size={14} />
            <span>Save My Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
