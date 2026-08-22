import React from 'react';
import { Article } from '../../types';
import { ArticleCard } from './ArticleCard';

interface ArticleListProps {
  articles: Article[];
  layout?: 'grid' | 'list' | 'compact';
  columns?: 2 | 3 | 4;
  showImages?: boolean;
  className?: string;
}

export const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  layout = 'grid',
  columns = 3,
  showImages = true,
  className = '',
}) => {
  if (articles.length === 0) {
    return null;
  }

  if (layout === 'list') {
    return (
      <div className={`space-y-4 ${className}`}>
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            layout="horizontal"
            showImage={showImages}
          />
        ))}
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <div className={`divide-y divide-[#eaecf0] bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-3 shadow-xs ${className}`}>
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            layout="compact"
            showImage={showImages}
          />
        ))}
      </div>
    );
  }

  // Grid layout
  const colClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${colClass} gap-4 sm:gap-5 ${className}`}>
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          layout="standard"
          showImage={showImages}
        />
      ))}
    </div>
  );
};
