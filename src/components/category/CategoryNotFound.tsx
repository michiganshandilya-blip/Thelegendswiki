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
      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-8 shadow-xs">
        <div className="w-12 h-12 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm flex items-center justify-center mx-auto mb-4 text-[#3366cc]">
          <FolderX size={24} />
        </div>

        <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#72777d] mb-1">
          TheLegendsWiki Repository
        </div>

        <h1 className="font-serif text-2xl font-bold text-[#101418] mb-2">
          Category Not Found
        </h1>

        <p className="text-xs sm:text-sm text-[#54595d] max-w-md mx-auto mb-6 leading-relaxed font-sans">
          The discipline &ldquo;<code className="bg-[#f1f5f9] px-1.5 py-0.5 rounded text-[#101418] font-mono text-xs border border-[#cbd5e1]">{slug}</code>&rdquo; does not match any cataloged category or sub-discipline in TheLegendsWiki.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#72777d]" />
            <input
              type="text"
              placeholder="Search across all categories & articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#ffffff] border border-[#a2a9b1] rounded-sm text-[#202122] placeholder:text-[#72777d] focus:outline-none focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc]"
            />
          </div>
          <Button type="submit" size="sm" variant="primary">
            Search
          </Button>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-[#eaecf0]">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/category/all')}
            className="flex items-center gap-1.5"
          >
            <Compass size={13} />
            <span>Browse All Disciplines</span>
          </Button>
          <Button
            variant="secondary"
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
      <div className="bg-[#ffffff] border border-[#eaecf0] rounded-sm p-5 text-left shadow-xs">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#54595d] mb-3">
          Explore Established Disciplines
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {topCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => navigate(`/category/${cat.slug}`)}
              className="p-2.5 bg-[#f8f9fa] border border-[#eaecf0] hover:border-[#3366cc] hover:bg-[#ffffff] rounded-sm text-left flex items-center gap-2 text-xs transition-colors cursor-pointer group"
            >
              <div className="shrink-0 text-[#3366cc]">{getCategoryIcon(cat.iconName, 14)}</div>
              <span className="truncate font-medium text-[#202122] group-hover:text-[#3366cc]">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
