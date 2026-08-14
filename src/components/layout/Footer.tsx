import React from 'react';
import { useRouter } from '../../context/RouterContext';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <footer
      id="encyclopedia-footer"
      className="border-t border-slate-800/80 bg-[#070a12] flex flex-col sm:flex-row items-center justify-between px-6 py-4 text-[11px] text-slate-400 shrink-0 gap-3 select-none"
    >
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/about')}
          className="hover:text-blue-400 hover:underline cursor-pointer transition-colors"
        >
          About TheLegendsWiki
        </button>
        <button
          type="button"
          onClick={() => navigate('/create')}
          className="hover:text-blue-400 hover:underline cursor-pointer transition-colors"
        >
          Community
        </button>
        <button
          type="button"
          onClick={() => navigate('/contact')}
          className="hover:text-blue-400 hover:underline cursor-pointer transition-colors"
        >
          Contact
        </button>
        <button
          type="button"
          onClick={() => navigate('/privacy')}
          className="hover:text-blue-400 hover:underline cursor-pointer transition-colors"
        >
          Privacy Policy
        </button>
        <button
          type="button"
          onClick={() => navigate('/terms')}
          className="hover:text-blue-400 hover:underline cursor-pointer transition-colors"
        >
          Terms of Knowledge
        </button>
      </div>

      <div className="flex items-center gap-4 text-slate-400 font-mono text-[10px]">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          Archive Synchronized
        </span>
        <span>&copy; {new Date().getFullYear()} TheLegendsWiki Codex</span>
      </div>
    </footer>
  );
};
