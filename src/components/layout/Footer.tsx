import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { ThemeToggle } from '../common/ThemeToggle';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <footer
      id="encyclopedia-footer"
      role="contentinfo"
      className="border-t border-[#eaecf0] bg-[#f8f9fa] flex flex-col items-center justify-between px-6 py-6 text-xs text-[#54595d] shrink-0 gap-4 select-none"
    >
      <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
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
            onClick={() => navigate('/privacy-policy')}
            className="text-[#3366cc] hover:underline cursor-pointer transition-colors text-xs"
          >
            Privacy Policy
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

        <div className="flex items-center gap-3 text-[#72777d] text-xs">
          <ThemeToggle variant="button" />
          <span className="text-[#cbd5e1]">&bull;</span>
          <span className="font-handwritten text-sm text-[#b45309]">
            The stories behind the stories.
          </span>
          <span className="text-[#cbd5e1]">&bull;</span>
          <span>&copy; {new Date().getFullYear()} TheLegendsWiki</span>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto pt-3 border-t border-[#eaecf0] text-[11px] text-[#72777d] text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>
          TheLegendsWiki is an exclusive Behind-the-Curtains research codex documenting private decisions, development struggles, forensic money flows, and declassified archives.
        </p>
        <span className="font-mono text-[10px] text-[#54595d]">
          Behind the Curtains Edition &bull; Evidence Classified
        </span>
      </div>
    </footer>
  );
};
