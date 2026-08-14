import React from 'react';
import { useRouter } from '../../context/RouterContext';
import {
  BookOpen,
  Shuffle,
  Clock,
  HelpCircle,
  Link as LinkIcon,
  RefreshCw,
  Upload,
  FileText,
  Sparkles,
  BookmarkCheck,
  FolderOpen
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentPath, navigate, getRandomArticleSlug } = useRouter();

  const handleRandomClick = () => {
    const slug = getRandomArticleSlug();
    navigate(`/wiki/${slug}`);
  };

  const navItems = [
    { label: 'Main page', path: '/', icon: <BookOpen size={14} /> },
    { label: 'Random article', action: handleRandomClick, icon: <Shuffle size={14} /> },
    { label: 'Categories', path: '/category/all', icon: <FolderOpen size={14} /> },
    { label: 'Recent changes', path: '/search?sort=recent', icon: <Clock size={14} /> },
    { label: 'Help center', path: '/about', icon: <HelpCircle size={14} /> },
  ];

  const toolItems = [
    { label: 'Contribute entry', path: '/create', icon: <Sparkles size={14} /> },
    { label: 'My contributions', path: '/my-articles', icon: <BookmarkCheck size={14} /> },
    { label: 'Editorial guidelines', path: '/terms', icon: <FileText size={14} /> },
    { label: 'Special archives', path: '/category/history', icon: <BookOpen size={14} /> },
    { label: 'Administration', path: '/admin', icon: <RefreshCw size={14} /> },
  ];

  return (
    <aside
      id="encyclopedia-sidebar"
      className="w-56 shrink-0 border-r border-slate-800/80 bg-[#090d18] flex flex-col p-4 gap-6 hidden md:flex select-none"
    >
      {/* Navigation section */}
      <div>
        <h4 className="text-[10px] uppercase font-bold text-blue-400/80 font-mono tracking-widest mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
          Navigation
        </h4>
        <ul className="space-y-1 text-xs text-slate-400">
          {navItems.map((item) => {
            const isActive = item.path && (currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path)));
            return (
              <li key={item.label}>
                {item.action ? (
                  <button
                    type="button"
                    onClick={item.action}
                    className="flex items-center gap-2 hover:text-blue-300 hover:bg-slate-800/40 rounded-sm px-2 py-1.5 transition-all w-full text-left cursor-pointer"
                  >
                    <span className="text-slate-500 group-hover:text-blue-400">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => item.path && navigate(item.path)}
                    className={`flex items-center gap-2 rounded-sm px-2 py-1.5 transition-all w-full text-left cursor-pointer ${
                      isActive
                        ? 'text-blue-300 font-semibold bg-blue-950/60 border border-blue-800/50 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                        : 'hover:text-slate-100 hover:bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    <span className={isActive ? 'text-blue-400' : 'text-slate-500'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Tools section */}
      <div>
        <h4 className="text-[10px] uppercase font-bold text-blue-400/80 font-mono tracking-widest mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block" />
          Codex Tools
        </h4>
        <ul className="space-y-1 text-xs text-slate-400">
          {toolItems.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2 hover:text-slate-100 hover:bg-slate-800/40 rounded-sm px-2 py-1.5 transition-all w-full text-left cursor-pointer"
              >
                <span className="text-slate-500">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Did You Know box */}
      <div className="mt-auto p-3.5 bg-[#0e1424] border border-slate-800 rounded-sm text-[11px] text-slate-400 leading-relaxed shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <strong className="text-blue-400 font-semibold uppercase tracking-wider text-[10px] font-mono">
            Archival Byte
          </strong>
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
        </div>
        The Royal Library of Alexandria was founded in 331 BC and housed up to 400,000 papyrus scrolls at its zenith.
      </div>
    </aside>
  );
};
