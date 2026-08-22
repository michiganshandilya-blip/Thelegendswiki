import React from 'react';
import { Article } from '../../types';
import { ArticleCard } from '../common/ArticleCard';
import { useRouter } from '../../context/RouterContext';
import { useArticles } from '../../data/dataProvider';
import { Compass, ArrowRight, BookOpen } from 'lucide-react';

interface RelatedArticlesProps {
  articles: Article[];
  currentArticle?: Article;
  className?: string;
}

export const RelatedArticles: React.FC<RelatedArticlesProps> = ({
  articles: explicitRelated,
  currentArticle,
  className = '',
}) => {
  const { navigate } = useRouter();
  const { articles: allArticles } = useArticles();

  // Calculate smart fallback recommendations if explicit related list is small
  let displayArticles = [...explicitRelated];

  if (displayArticles.length < 3 && currentArticle) {
    const existingIds = new Set([currentArticle.id, ...displayArticles.map((a) => a.id)]);
    
    // 1. Match same subcategory
    const sameSubcat = allArticles.filter(
      (a) => !existingIds.has(a.id) && a.subCategory && a.subCategory === currentArticle.subCategory
    );
    sameSubcat.forEach((a) => {
      if (displayArticles.length < 3) {
        displayArticles.push(a);
        existingIds.add(a.id);
      }
    });

    // 2. Match same category
    if (displayArticles.length < 3) {
      const sameCat = allArticles.filter(
        (a) => !existingIds.has(a.id) && a.categorySlug === currentArticle.categorySlug
      );
      sameCat.forEach((a) => {
        if (displayArticles.length < 3) {
          displayArticles.push(a);
          existingIds.add(a.id);
        }
      });
    }

    // 3. Match shared tags
    if (displayArticles.length < 3 && currentArticle.tags) {
      const currentTags = new Set(currentArticle.tags.map((t) => t.toLowerCase()));
      const tagMatches = allArticles.filter((a) => {
        if (existingIds.has(a.id)) return false;
        return a.tags?.some((t) => currentTags.has(t.toLowerCase()));
      });
      tagMatches.forEach((a) => {
        if (displayArticles.length < 3) {
          displayArticles.push(a);
          existingIds.add(a.id);
        }
      });
    }
  }

  if (displayArticles.length === 0) {
    return null;
  }

  const isCurrentCurtains = Boolean(currentArticle?.isBehindCurtains);

  return (
    <section
      id="related-articles"
      aria-label="Related Articles"
      className={`pt-6 border-t border-[#eaecf0] space-y-4 scroll-mt-20 ${className}`}
    >
      <div className={`flex items-center justify-between border-b pb-2 ${isCurrentCurtains ? 'border-amber-500/40' : 'border-[#a2a9b1]'}`}>
        <div className="flex items-center gap-2">
          {isCurrentCurtains ? (
            <Compass size={18} className="text-amber-400" />
          ) : (
            <Compass size={16} className="text-[#2563eb]" />
          )}
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#0f172a]">
            {isCurrentCurtains ? 'FOLLOW THE TRAIL: RELATED FILES' : 'See Also & Related Articles'}
          </h2>
        </div>
        <span className={`text-xs font-mono ${isCurrentCurtains ? 'text-amber-600 font-bold' : 'text-[#64748b]'}`}>
          {isCurrentCurtains ? 'Investigative Cross-References' : 'Cross-referenced knowledge entries'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {displayArticles.slice(0, 3).map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            layout={isCurrentCurtains || article.isBehindCurtains ? 'curtain-dossier' : 'standard'}
            showImage={true}
            showViews={true}
          />
        ))}
      </div>

      {currentArticle && (
        <div className={`p-3.5 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-2 text-xs ${
          isCurrentCurtains
            ? 'curtains-atmosphere border border-amber-500/40 text-slate-200 shadow-md'
            : 'bg-[#f8f9fa] border border-[#cbd5e1] text-[#54595d]'
        }`}>
          <div className="flex items-center gap-2">
            <BookOpen size={14} className={isCurrentCurtains ? 'text-amber-400' : 'text-[#2563eb]'} />
            <span>
              Explore all records indexed under{' '}
              <strong className={isCurrentCurtains ? 'text-amber-300' : 'text-[#0f172a]'}>
                {currentArticle.category}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/category/${currentArticle.categorySlug}${isCurrentCurtains ? '?curtains=true' : ''}`)}
            className={`font-semibold inline-flex items-center gap-1 cursor-pointer hover:underline ${
              isCurrentCurtains ? 'text-amber-400 hover:text-amber-300' : 'text-[#2563eb]'
            }`}
          >
            <span>{isCurrentCurtains ? 'View curtain archives' : 'View discipline portal'}</span>
            <ArrowRight size={12} />
          </button>
        </div>
      )}
    </section>
  );
};
