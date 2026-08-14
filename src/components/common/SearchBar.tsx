import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { DEMO_ARTICLES } from '../../data/demoData';

interface SearchBarProps {
  size?: 'compact' | 'large';
  placeholder?: string;
  autoFocus?: boolean;
  initialQuery?: string;
  onSearchSubmit?: (query: string) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  size = 'compact',
  placeholder = 'Search TheLegendsWiki...',
  autoFocus = false,
  initialQuery = '',
  onSearchSubmit,
  className = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { navigate } = useRouter();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setShowDropdown(false);
    if (onSearchSubmit) {
      onSearchSubmit(trimmed);
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(query);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const filteredSuggestions = query.trim().length >= 2
    ? DEMO_ARTICLES.filter((article) => {
        const q = query.toLowerCase();
        return (
          article.title.toLowerCase().includes(q) ||
          article.summary.toLowerCase().includes(q) ||
          article.category.toLowerCase().includes(q) ||
          article.tags.some((t) => t.toLowerCase().includes(q))
        );
      }).slice(0, 5)
    : [];

  const isLarge = size === 'large';

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center w-full">
        <Search
          size={isLarge ? 18 : 15}
          className={`absolute ${isLarge ? 'left-4 top-3.5' : 'left-3.5 top-2.5'} text-blue-400/80 pointer-events-none`}
        />

        <input
          ref={inputRef}
          type="text"
          id={isLarge ? 'main-encyclopedia-search' : 'header-encyclopedia-search'}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full bg-[#0e1424] border border-slate-700/80 rounded-full text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:bg-[#11192e] transition-all shadow-inner ${
            isLarge
              ? 'py-2.5 px-5 pl-11 text-sm sm:text-base'
              : 'py-1.5 px-4 pl-9 text-xs sm:text-sm'
          }`}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setShowDropdown(false);
              inputRef.current?.focus();
            }}
            className={`absolute ${isLarge ? 'right-4 top-3' : 'right-3 top-2'} text-slate-400 hover:text-slate-200 cursor-pointer`}
            aria-label="Clear search input"
          >
            <X size={isLarge ? 18 : 14} />
          </button>
        )}
      </div>

      {/* Auto-suggest dropdown */}
      {showDropdown && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#0f1629] border border-slate-700/80 rounded-sm shadow-2xl z-50 overflow-hidden backdrop-blur-md">
          <div className="p-2 border-b border-slate-800 bg-[#0a0f1c] text-[10px] uppercase font-bold text-blue-400/80 tracking-wider flex items-center justify-between">
            <span>Codex Matching Entries</span>
            <span className="font-mono text-slate-500 text-[9px]">{filteredSuggestions.length} found</span>
          </div>
          <ul className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto">
            {filteredSuggestions.map((article) => (
              <li key={article.id}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false);
                    navigate(`/wiki/${article.slug}`);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#172138] transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 block truncate transition-colors">
                      {article.title}
                    </span>
                    <span className="text-xs text-slate-400 line-clamp-1">
                      {article.summary}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-xs group-hover:text-blue-300 group-hover:border-blue-500/40 border border-slate-700/60 shrink-0 ml-2">
                    {article.category}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="p-2.5 bg-[#0a0f1c] border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => handleSearch(query)}
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Search full archive for "{query}"</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
