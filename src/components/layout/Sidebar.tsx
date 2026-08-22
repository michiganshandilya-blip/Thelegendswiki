import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  Sparkles,
  Shuffle,
  Clock,
  HelpCircle,
  BookmarkCheck,
  FileCheck2,
  Key,
  Shield,
  ShieldCheck,
  PenTool,
  TrendingDown,
  Scale,
  Hammer,
  EyeOff
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentPath, navigate, getRandomArticleSlug } = useRouter();
  const { isSuperAdmin, isAdmin } = useAuth();

  const handleRandomClick = () => {
    const slug = getRandomArticleSlug();
    navigate(`/wiki/${slug}`);
  };

  const navItems = [
    { label: 'All Dossiers', path: '/', icon: <Sparkles size={14} className="text-amber-500" /> },
    { label: 'Behind Financial Markets', path: '/category/behind-financial-markets', icon: <TrendingDown size={14} /> },
    { label: 'Behind Corporations', path: '/category/behind-corporations', icon: <Key size={14} /> },
    { label: 'Behind History', path: '/category/behind-history', icon: <Scale size={14} /> },
    { label: 'Behind the Evidence', path: '/category/behind-the-evidence', icon: <FileCheck2 size={14} /> },
    { label: 'Behind the Mysteries', path: '/category/behind-the-mysteries', icon: <EyeOff size={14} /> },
    { label: 'Random Investigation', action: handleRandomClick, icon: <Shuffle size={14} /> },
    { label: 'Recent Disclosures', path: '/search?sort=recent', icon: <Clock size={14} /> },
  ];

  const toolItems = [
    { label: 'Submit Behind-the-Curtains Story', path: '/create', icon: <PenTool size={14} /> },
    { label: 'My Submissions', path: '/my-articles', icon: <BookmarkCheck size={14} /> },
    { label: 'Curtains Editorial Standards', path: '/terms', icon: <FileCheck2 size={14} /> },
  ];

  return (
    <aside
      id="encyclopedia-sidebar"
      aria-label="Encyclopedia Sidebar"
      className="w-60 shrink-0 border-r border-[#eaecf0] bg-[#fbfbfd]/80 backdrop-blur-[1px] flex flex-col p-4 gap-5 hidden md:flex select-none"
    >
      {/* Editorial Mission Statement */}
      <div className="p-3 bg-gradient-to-br from-amber-50/80 to-stone-100/90 border border-amber-300/60 rounded-sm">
        <div className="flex items-center gap-1.5 text-amber-900 mb-1">
          <Sparkles size={12} className="text-amber-600" />
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
            Behind the Curtains
          </span>
        </div>
        <p className="text-[11px] text-stone-700 leading-tight font-serif italic">
          &ldquo;Revealing what happens behind the scenes, behind the public image, and behind the finished story.&rdquo;
        </p>
      </div>

      {/* Navigation section */}
      <nav aria-label="Behind the Curtains Dimensions">
        <h4 className="text-[11px] uppercase font-bold text-[#54595d] font-mono tracking-wider mb-2 flex items-center justify-between">
          <span>Curtain Facets</span>
          <span className="font-handwritten text-xs text-[#b45309] lowercase font-normal">untold</span>
        </h4>
        <ul className="space-y-0.5 text-xs text-[#54595d]">
          {navItems.map((item) => {
            const isActive = item.path && (currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path)));
            return (
              <li key={item.label}>
                {item.action ? (
                  <button
                    type="button"
                    onClick={item.action}
                    className="flex items-center gap-2 hover:text-[#3366cc] hover:bg-[#ffffff] rounded-sm px-2 py-1.5 transition-all w-full text-left cursor-pointer text-[#54595d] focus-visible:ring-2 focus-visible:ring-[#3366cc] focus-visible:outline-none"
                  >
                    <span className="text-[#72777d]">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => item.path && navigate(item.path)}
                    className={`flex items-center gap-2 rounded-sm px-2 py-1.5 transition-all w-full text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3366cc] focus-visible:outline-none ${
                      isActive
                        ? 'text-amber-950 font-semibold bg-[#ffffff] border border-amber-300/80 shadow-xs'
                        : 'hover:text-[#202122] hover:bg-[#ffffff] text-[#54595d]'
                    }`}
                  >
                    <span className={isActive ? 'text-amber-700' : 'text-[#72777d]'}>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Governance & Administration Section - role protected */}
      {(isSuperAdmin || isAdmin) && (
        <nav aria-label="Governance & Administration">
          <h4 className="text-[11px] uppercase font-bold text-[#54595d] font-mono tracking-wider mb-2 flex items-center justify-between">
            <span>Governance</span>
            <span className="font-mono text-[9px] text-[#3366cc] lowercase font-normal">verified</span>
          </h4>
          <ul className="space-y-0.5 text-xs text-[#54595d]">
            {/* SUPER ADMIN ONLY ENTRY */}
            {isSuperAdmin && (
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/super-admin')}
                  className={`flex items-center gap-2 rounded-sm px-2 py-1.5 transition-all w-full text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                    currentPath.startsWith('/super-admin')
                      ? 'text-amber-950 font-bold bg-amber-100 border border-amber-400 shadow-xs'
                      : 'text-amber-900 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/60 font-semibold'
                  }`}
                >
                  <ShieldCheck size={14} className="text-amber-700 shrink-0" />
                  <span className="truncate">Super Admin Control</span>
                </button>
              </li>
            )}

            {/* ADMIN / SUPER ADMIN GOVERNANCE DESK */}
            {isAdmin && (
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className={`flex items-center gap-2 rounded-sm px-2 py-1.5 transition-all w-full text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3366cc] focus-visible:outline-none ${
                    currentPath.startsWith('/admin') && !currentPath.startsWith('/super-admin')
                      ? 'text-[#3366cc] font-semibold bg-[#ffffff] border border-blue-300 shadow-xs'
                      : 'hover:text-[#202122] hover:bg-[#ffffff] text-[#54595d]'
                  }`}
                >
                  <Shield size={14} className="text-[#3366cc] shrink-0" />
                  <span className="truncate">Editorial Desk</span>
                </button>
              </li>
            )}
          </ul>
        </nav>
      )}

      {/* Tools section */}
      <nav aria-label="Codex Tools">
        <h4 className="text-[11px] uppercase font-bold text-[#54595d] font-mono tracking-wider mb-2 flex items-center justify-between">
          <span>Investigation Tools</span>
          <span className="font-handwritten text-xs text-[#b45309] lowercase font-normal">verify</span>
        </h4>
        <ul className="space-y-0.5 text-xs text-[#54595d]">
          {toolItems.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2 hover:text-[#3366cc] hover:bg-[#ffffff] rounded-sm px-2 py-1.5 transition-all w-full text-left cursor-pointer text-[#54595d] focus-visible:ring-2 focus-visible:ring-[#3366cc] focus-visible:outline-none text-xs"
              >
                <span className="text-[#72777d]">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Archival Theme Switcher Viewport Card */}
      <ThemeToggle variant="card" />

      {/* Editorial Epistemic Standard */}
      <div className="mt-auto p-3 bg-[#ffffff] border border-[#eaecf0] rounded-sm text-[11px] text-[#54595d] leading-relaxed shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <strong className="text-[#101418] font-serif font-bold text-xs flex items-center gap-1">
            <span>Epistemic Rule</span>
          </strong>
          <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded-2xs border border-emerald-200">
            Strict Fact-Check
          </span>
        </div>
        <p className="text-[#475569] text-[11px] leading-tight font-sans">
          Only documented behind-the-scenes accounts, primary letters, verified money flows, and declassified files are accepted.
        </p>
      </div>
    </aside>
  );
};
