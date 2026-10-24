import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { useArticles } from '../../data/dataProvider';
import { Button } from '../common/Button';
import { SearchBar } from '../common/SearchBar';
import { FileQuestion, Home, Layers, Sparkles, BookOpen } from 'lucide-react';

interface ArticleNotFoundProps {
  slug: string;
}

export const ArticleNotFound: React.FC<ArticleNotFoundProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const { articles } = useArticles();

  // Find close matches or suggestions based on the requested slug tokens
  const cleanTokens = slug
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const suggestedArticles = articles.filter((a) => {
    const titleLower = a.title.toLowerCase();
    const slugLower = a.slug.toLowerCase();
    const catLower = a.category.toLowerCase();
    return cleanTokens.some(
      (token) => titleLower.includes(token) || slugLower.includes(token) || catLower.includes(token)
    );
  }).slice(0, 3);

  return (
    <div id="article-not-found-container" className="py-8 max-w-2xl mx-auto text-center space-y-6">
      <div className="w-14 h-14 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm text-[#3366cc] flex items-center justify-center mx-auto shadow-xs">
        <FileQuestion size={28} />
      </div>

      <div className="space-y-2">
        <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#72777d]">
          TheLegendsWiki Knowledge Registry
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#101418]">
          Article Not Found
        </h1>
        <p className="text-sm sm:text-base text-[#54595d] leading-relaxed max-w-lg mx-auto">
          The requested encyclopedia entry{' '}
          <code className="px-1.5 py-0.5 bg-[#f1f5f9] text-[#101418] rounded font-mono text-xs border border-[#cbd5e1]">
            /wiki/{slug}
          </code>{' '}
          could not be found in our current archives.
        </p>
      </div>

      {/* Intelligent Similar Match Suggestions */}
      {suggestedArticles.length > 0 && (
        <div className="bg-[#f0f6ff] border border-blue-200 rounded-sm p-4 text-left space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#3366cc]">
            <Sparkles size={14} />
            <span>Did you mean to read one of these entries?</span>
          </div>
          <div className="divide-y divide-blue-100 bg-[#ffffff] rounded-xs border border-blue-200">
            {suggestedArticles.map((sug) => (
              <div
                key={sug.id}
                onClick={() => navigate(`/wiki/${(sug.slug || '').trim() || sug.id}`)}
                className="p-2.5 hover:bg-[#f8f9fa] transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-serif font-bold text-sm text-[#101418] hover:text-[#3366cc]">
                    {sug.title}
                  </div>
                  <div className="text-[11px] text-[#54595d] line-clamp-1">
                    {sug.summary}
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-[#3366cc] bg-blue-50 px-2 py-0.5 rounded-xs border border-blue-200 shrink-0">
                  {sug.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Search */}
      <div className="bg-[#ffffff] border border-[#a2a9b1] p-5 rounded-sm shadow-xs space-y-3">
        <p className="text-xs font-mono uppercase tracking-wider text-[#54595d] text-left">
          Search the encyclopedia for related topics or historical figures:
        </p>
        <SearchBar
          size="compact"
          placeholder="Search by topic, person, or keyword..."
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
          Return to Main Portal
        </Button>

        <Button
          variant="secondary"
          size="md"
          onClick={() => navigate('/category/all')}
          icon={<Layers size={14} />}
        >
          Browse All Disciplines
        </Button>

        <Button
          variant="outline"
          size="md"
          onClick={() => navigate('/create')}
          icon={<BookOpen size={14} />}
        >
          Author This Entry
        </Button>
      </div>
    </div>
  );
};
