import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { DEMO_CATEGORIES } from '../../data/demoData';
import { Search, Compass, Home, FolderX } from 'lucide-react';
import { Button } from '../common/Button';
import { getCategoryIcon } from '../common/CategoryCard';

interface CategoryNotFoundProps {
  slug: string;
}

export const CategoryNotFound: React.FC<CategoryNotFoundProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const topCategories = DEMO_CATEGORIES.slice(0, 6);

  return (
    <div id="category-not-found-view" className="py-8 max-w-2xl mx-auto text-center space-y-6">
      <div className="bg-[#0e1422] border border-slate-800 rounded-sm p-8 shadow-xl shadow-black/40">
        <div className="w-12 h-12 bg-[#141c2e] border border-slate-700/60 rounded-sm flex items-center justify-center mx-auto mb-4 text-sky-400">
          <FolderX size={24} />
        </div>

        <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-sky-400 mb-1">
          Knowledge Registry
        </div>

        <h1 className="font-display text-2xl font-bold text-slate-100 mb-2">
          Category not found
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
          The discipline or topic &ldquo;<code className="bg-[#141c2e] px-1.5 py-0.5 rounded text-sky-300 font-mono text-xs border border-slate-700">{slug}</code>&rdquo; does not match any cataloged category or sub-discipline in TheLegendsWiki.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search across all categories & articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#141c2e] border border-slate-700 rounded-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40"
            />
          </div>
          <Button type="submit" size="sm" variant="primary">
            Search
          </Button>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-800">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/category/all')}
            className="flex items-center gap-1.5"
          >
            <Compass size={13} />
            <span>Browse All Categories</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5"
          >
            <Home size={13} />
            <span>Return to Main Page</span>
          </Button>
        </div>
      </div>

      {/* Suggested Categories */}
      <div className="bg-[#0e1422] border border-slate-800 rounded-sm p-5 text-left">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
          Explore Established Disciplines
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {topCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => navigate(`/category/${cat.slug}`)}
              className="p-2.5 bg-[#141c2e] border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/80 rounded-sm text-left flex items-center gap-2 text-xs transition-colors cursor-pointer group"
            >
              <div className="shrink-0 text-sky-400">{getCategoryIcon(cat.iconName, 14)}</div>
              <span className="truncate font-medium text-slate-300 group-hover:text-sky-300">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
