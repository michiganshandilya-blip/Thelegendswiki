import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { useConsent } from '../../context/ConsentContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { TheLegendsWikiLogo } from '../common/TheLegendsWikiLogo';
import { Sliders, Instagram } from 'lucide-react';
import { INSTAGRAM_PROFILE_URL } from '../../config/socialConfig';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();
  const { openPreferencesModal } = useConsent();

  return (
    <footer
      id="encyclopedia-footer"
      role="contentinfo"
      className="border-t border-[#eaecf0] bg-[#f8f9fa] flex flex-col items-center justify-between px-6 py-6 text-xs text-[#54595d] shrink-0 gap-5 select-none"
    >
      <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3.5">
          <button
            type="button"
            onClick={() => navigate('/about')}
            className="text-[#3366cc] hover:underline cursor-pointer transition-colors text-xs"
          >
            About TheLegendsWiki
          </button>
          <span className="text-[#cbd5e1]">&bull;</span>
          <button
            type="button"
            onClick={() => navigate('/create')}
            className="text-[#3366cc] hover:underline cursor-pointer transition-colors text-xs"
          >
            Contributor Portal
          </button>
          <span className="text-[#cbd5e1]">&bull;</span>
          <button
            type="button"
            onClick={() => navigate('/contact')}
            className="text-[#3366cc] hover:underline cursor-pointer transition-colors text-xs"
          >
            Contact &amp; Errata
          </button>
          <span className="text-[#cbd5e1]">&bull;</span>
          <button
            type="button"
            onClick={() => navigate('/sitemap')}
            className="text-[#3366cc] hover:underline cursor-pointer transition-colors text-xs font-medium"
          >
            Sitemap &amp; Index
          </button>
          <span className="text-[#cbd5e1]">&bull;</span>
          <button
            type="button"
            onClick={() => navigate('/disclaimer')}
            className="text-[#3366cc] hover:underline cursor-pointer transition-colors text-xs"
          >
            Disclaimer
          </button>
          <span className="text-[#cbd5e1]">&bull;</span>
          <button
            type="button"
            onClick={() => navigate('/terms')}
            className="text-[#3366cc] hover:underline cursor-pointer transition-colors text-xs"
          >
            Terms of Use
          </button>
          <span className="text-[#cbd5e1]">&bull;</span>
          <button
            type="button"
            onClick={() => navigate('/privacy-policy')}
            className="text-[#3366cc] hover:underline cursor-pointer transition-colors text-xs"
          >
            Privacy Policy
          </button>
          <span className="text-[#cbd5e1]">&bull;</span>
          <button
            type="button"
            onClick={() => navigate('/cookie-policy')}
            className="text-[#3366cc] hover:underline cursor-pointer transition-colors text-xs"
          >
            Cookie Policy
          </button>
          <span className="text-[#cbd5e1]">&bull;</span>
          <button
            type="button"
            onClick={openPreferencesModal}
            className="text-[#3366cc] hover:underline cursor-pointer transition-colors text-xs inline-flex items-center gap-1 font-medium"
          >
            <Sliders size={11} />
            <span>Cookie Preferences</span>
          </button>
          <span className="text-[#cbd5e1]">&bull;</span>
          <button
            type="button"
            onClick={() => navigate('/editorial-policy')}
            className="text-[#3366cc] hover:underline cursor-pointer transition-colors text-xs"
          >
            Editorial Policy
          </button>
          <span className="text-[#cbd5e1]">&bull;</span>
          <button
            type="button"
            onClick={() => navigate('/content-policy')}
            className="text-[#3366cc] hover:underline cursor-pointer transition-colors text-xs"
          >
            Content Policy
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-[#72777d] text-xs">
          {/* Instagram Section */}
          <a
            id="footer-instagram-link"
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TheLegendsWiki on Instagram"
            title="Follow TheLegendsWiki on Instagram"
            className="inline-flex items-center gap-1.5 text-[#54595d] hover:text-[#E4405F] focus:outline-none focus:ring-2 focus:ring-[#E4405F]/40 rounded-sm px-1.5 py-0.5 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Instagram size={14} className="shrink-0 text-[#E4405F]" aria-hidden="true" />
            <span className="font-medium text-xs">Follow us on Instagram</span>
          </a>
          <span className="text-[#cbd5e1]">&bull;</span>
          <ThemeToggle variant="button" />
          <span className="text-[#cbd5e1]">&bull;</span>
          <span className="font-handwritten text-sm text-[#b45309]">
            The stories behind the stories.
          </span>
          <span className="text-[#cbd5e1]">&bull;</span>
          <div className="inline-flex items-center gap-1.5">
            <TheLegendsWikiLogo size="xs" className="w-4 h-4 shadow-2xs" />
            <span>&copy; {new Date().getFullYear()} TheLegendsWiki</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto pt-3 border-t border-[#eaecf0] text-[11px] text-[#72777d] text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-2.5">
        <div className="flex items-center gap-2">
          <TheLegendsWikiLogo size="xs" className="w-4 h-4 shrink-0 opacity-80" />
          <p>
            TheLegendsWiki is an exclusive Behind-the-Curtains research codex documenting private decisions, development struggles, forensic money flows, and declassified archives.
          </p>
        </div>
        <span className="font-mono text-[10px] text-[#54595d] shrink-0">
          Behind the Curtains Edition &bull; Evidence Classified
        </span>
      </div>
    </footer>
  );
};
