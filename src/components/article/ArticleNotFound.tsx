import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { Button } from '../common/Button';
import { SearchBar } from '../common/SearchBar';
import { FileQuestion, Home, Layers } from 'lucide-react';

interface ArticleNotFoundProps {
  slug: string;
}

export const ArticleNotFound: React.FC<ArticleNotFoundProps> = ({ slug }) => {
  const { navigate } = useRouter();

  return (
    <div id="article-not-found-container" className="py-8 max-w-2xl mx-auto text-center space-y-6">
      <div className="w-14 h-14 bg-[#0e1422] border border-slate-800 rounded-sm text-sky-400 flex items-center justify-center mx-auto shadow-md">
        <FileQuestion size={28} />
      </div>

      <div className="space-y-2">
        <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-sky-400">
          Knowledge Registry
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-100">
          Article Not Found
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg mx-auto">
          The requested encyclopedia article{' '}
          <code className="px-1.5 py-0.5 bg-[#141c2e] text-sky-300 rounded font-mono text-xs border border-slate-700">
            {slug}
          </code>{' '}
          does not exist in the current TheLegendsWiki repository.
        </p>
      </div>

      {/* Suggested Search */}
      <div className="bg-[#0e1422] border border-slate-800 p-5 rounded-sm shadow-xl shadow-black/40 space-y-3">
        <p className="text-xs font-mono uppercase tracking-wider text-slate-400 text-left">
          Search the encyclopedia for related entries:
        </p>
        <SearchBar
          size="medium"
          placeholder="Search by topic, person, or term..."
          onSearchSubmit={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
        />
      </div>

      {/* Action Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/')}
          icon={<Home size={14} />}
        >
          Return to Homepage
        </Button>

        <Button
          variant="outline"
          size="md"
          onClick={() => navigate('/category/all')}
          icon={<Layers size={14} />}
        >
          Browse All Categories
        </Button>
      </div>
    </div>
  );
};
