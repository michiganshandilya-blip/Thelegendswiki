import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Sparkles, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'compact' | 'button' | 'card' | 'menu-item';
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'compact',
  className = '',
  showLabel = false,
}) => {
  const { isDark, theme, toggleTheme, setTheme } = useTheme();

  if (variant === 'menu-item') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer text-left ${
          isDark
            ? 'text-slate-200 hover:bg-slate-800'
            : 'text-[#202122] hover:bg-[#f8f9fa]'
        } ${className}`}
        role="menuitem"
      >
        <div className="flex items-center gap-2">
          {isDark ? (
            <Moon size={14} className="text-amber-400" />
          ) : (
            <Sun size={14} className="text-amber-600" />
          )}
          <span>{isDark ? 'Night Vision (Dark)' : 'Codex Theme (Light)'}</span>
        </div>
        <span
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs border ${
            isDark
              ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
              : 'bg-slate-100 border-slate-300 text-slate-600'
          }`}
        >
          {isDark ? 'DARK' : 'LIGHT'}
        </span>
      </button>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`p-3 rounded-sm border transition-all ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 shadow-inner'
            : 'bg-gradient-to-br from-slate-50 to-stone-100/90 border-slate-200/90'
        } ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {isDark ? (
              <Moon size={13} className="text-amber-400" />
            ) : (
              <Sun size={13} className="text-amber-600" />
            )}
            <span
              className={`font-mono text-[10px] uppercase font-bold tracking-wider ${
                isDark ? 'text-amber-300' : 'text-slate-700'
              }`}
            >
              Archival Viewport
            </span>
          </div>
          <span
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded-xs border ${
              isDark
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {isDark ? 'NIGHT VISION' : 'CODEX LIGHT'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`px-2 py-1.5 rounded-xs text-xs font-serif font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
              !isDark
                ? 'bg-white border-blue-400 text-blue-900 shadow-2xs font-semibold'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title="Light Codex Archive"
          >
            <Sun size={12} className={!isDark ? 'text-amber-600' : 'text-slate-400'} />
            <span className="text-[11px]">Codex</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`px-2 py-1.5 rounded-xs text-xs font-serif font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
              isDark
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-2xs font-semibold'
                : 'bg-white/80 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Night Vision Dossier Dark Mode"
          >
            <Moon size={12} className={isDark ? 'text-amber-400' : 'text-slate-500'} />
            <span className="text-[11px]">Night Vision</span>
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to Codex Light Mode' : 'Switch to Archival Night Vision Dark Mode'}
        title={isDark ? 'Switch to Codex Light Mode' : 'Switch to Archival Night Vision Dark Mode'}
        className={`px-2.5 py-1 text-xs rounded-sm border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs group ${
          isDark
            ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/40 hover:border-amber-400'
            : 'bg-[#f8f9fa] hover:bg-[#f1f5f9] text-[#54595d] hover:text-[#202122] border-[#cbd5e1] hover:border-[#94a3b8]'
        } ${className}`}
      >
        <div className="relative w-3.5 h-3.5 flex items-center justify-center">
          {isDark ? (
            <Moon size={13} className="text-amber-400 group-hover:rotate-12 transition-transform" />
          ) : (
            <Sun size={13} className="text-amber-600 group-hover:rotate-45 transition-transform" />
          )}
        </div>
        <span className="font-mono text-[11px] font-medium">
          {isDark ? 'Night Vision' : 'Codex Light'}
        </span>
      </button>
    );
  }

  // Default 'compact' icon button
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Codex Light Mode' : 'Switch to Archival Night Vision Dark Mode'}
      title={isDark ? 'Switch to Codex Light Mode' : 'Switch to Archival Night Vision (Dark Mode)'}
      className={`p-1.5 sm:px-2 sm:py-1 rounded-sm border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs focus-visible:ring-2 focus-visible:ring-[#3366cc] focus-visible:outline-none group ${
        isDark
          ? 'bg-slate-900/90 hover:bg-slate-800 text-amber-300 border-amber-500/40 hover:border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
          : 'bg-[#f8f9fa] hover:bg-[#f1f5f9] text-[#54595d] hover:text-[#202122] border-[#cbd5e1] hover:border-[#94a3b8]'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {isDark ? (
          <Moon size={14} className="text-amber-400 group-hover:scale-110 group-hover:-rotate-12 transition-all" />
        ) : (
          <Sun size={14} className="text-amber-600 group-hover:scale-110 group-hover:rotate-45 transition-all" />
        )}
      </div>
      {showLabel && (
        <span className="hidden sm:inline font-mono text-[11px] font-medium">
          {isDark ? 'Night Vision' : 'Light'}
        </span>
      )}
    </button>
  );
};
