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
    <div ref={dropdownRef} role="search" aria-label="Encyclopedia Search" className={`relative w-full ${className}`}>
      <div className="relative flex items-center w-full">
        <Search
          size={isLarge ? 18 : 14}
          className={`absolute ${isLarge ? 'left-4 top-3.5' : 'left-3 top-2.5'} text-[#72777d] pointer-events-none`}
          aria-hidden="true"
        />

        <input
          ref={inputRef}
          type="text"
          id={isLarge ? 'main-encyclopedia-search' : 'header-encyclopedia-search'}
          aria-label={placeholder}
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
          className={`w-full bg-[#ffffff] border border-[#a2a9b1] rounded-sm text-[#202122] placeholder:text-[#72777d] focus:outline-none focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc] focus-visible:ring-2 focus-visible:ring-[#3366cc] transition-all shadow-xs ${
            isLarge
              ? 'py-2.5 px-4 pl-11 text-base'
              : 'py-1.5 px-3 pl-8 text-xs sm:text-sm'
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
            className={`absolute ${isLarge ? 'right-4 top-3' : 'right-2.5 top-2'} text-[#72777d] hover:text-[#202122] cursor-pointer`}
            aria-label="Clear search input"
          >
            <X size={isLarge ? 18 : 14} />
          </button>
        )}
      </div>

      {/* Auto-suggest dropdown */}
      {showDropdown && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-[#ffffff] border border-[#a2a9b1] rounded-sm shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-[#eaecf0] bg-[#f8f9fa] text-[10px] uppercase font-bold text-[#54595d] tracking-wider flex items-center justify-between">
            <span>Matching Entries</span>
            <span className="font-mono text-[#72777d] text-[10px]">{filteredSuggestions.length} found</span>
          </div>
          <ul className="divide-y divide-[#eaecf0] max-h-72 overflow-y-auto">
            {filteredSuggestions.map((article) => (
              <li key={article.id}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false);
                    navigate(`/wiki/${article.slug}`);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#f1f5f9] transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-sm font-semibold text-[#101418] group-hover:text-[#3366cc] block truncate transition-colors">
                      {article.title}
                    </span>
                    <span className="text-xs text-[#54595d] line-clamp-1">
                      {article.summary}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-[#54595d] bg-[#f1f5f9] px-2 py-0.5 rounded-sm border border-[#cbd5e1] shrink-0 ml-2">
                    {article.category}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="p-2 bg-[#f8f9fa] border-t border-[#eaecf0] text-center">
            <button
              type="button"
              onClick={() => handleSearch(query)}
              className="text-xs text-[#3366cc] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
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
