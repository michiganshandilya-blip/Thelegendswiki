import React from 'react';
import { ArticleImageFigure } from '../../types';

interface ArticleFigureProps {
  figure: ArticleImageFigure;
  className?: string;
}

export const ArticleFigure: React.FC<ArticleFigureProps> = ({
  figure,
  className = '',
}) => {
  const getAlignmentClasses = () => {
    switch (figure.align) {
      case 'left':
        return 'md:float-left md:mr-6 md:mb-4 md:max-w-xs w-full';
      case 'center':
        return 'mx-auto my-6 max-w-xl w-full';
      case 'full':
        return 'w-full my-6';
      case 'right':
      default:
        return 'md:float-right md:ml-6 md:mb-4 md:max-w-xs w-full';
    }
  };

  return (
    <figure
      className={`my-4 bg-[#0e1422] border border-[#1e293b] p-2.5 rounded-sm shadow-xs ${getAlignmentClasses()} ${className}`}
    >
      <div className="bg-[#141c2e] border border-[#1e293b] rounded-xs overflow-hidden">
        <img
          src={figure.url}
          alt={figure.alt || figure.caption}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-auto object-cover max-h-80 opacity-90"
        />
      </div>
      <figcaption className="mt-2 text-xs text-slate-400 leading-relaxed text-left font-sans">
        <span className="font-normal">{figure.caption}</span>
        {figure.credit && (
          <span className="block text-[10px] text-slate-500 mt-1 font-mono">
            Credit: {figure.credit}
          </span>
        )}
      </figcaption>
    </figure>
  );
};

