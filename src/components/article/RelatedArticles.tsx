import React from 'react';
import { Article } from '../../types';
import { ArticleCard } from '../common/ArticleCard';
import { Compass } from 'lucide-react';

interface RelatedArticlesProps {
  articles: Article[];
  className?: string;
}

export const RelatedArticles: React.FC<RelatedArticlesProps> = ({
  articles,
  className = '',
}) => {
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <section
      id="related-articles"
      aria-label="Related Articles"
      className={`pt-6 border-t border-[#1e293b] space-y-4 scroll-mt-20 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
        <div className="flex items-center gap-2">
          <Compass size={16} className="text-sky-400" />
          <h2 className="font-display text-lg sm:text-xl font-bold text-slate-100">
            Related Articles
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-sans">
          Cross-referenced knowledge entries
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            layout="standard"
            showImage={true}
            showViews={true}
          />
        ))}
      </div>
    </section>
  );
};

