import React, { useState } from 'react';

export interface TheLegendsWikiLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showText?: boolean;
  textClassName?: string;
  subtextClassName?: string;
  className?: string;
  imgClassName?: string;
  alt?: string;
  onClick?: () => void;
}

const SIZE_MAP: Record<string, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12 sm:w-14 sm:h-14',
  xl: 'w-16 h-16 sm:w-20 sm:h-20',
  hero: 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28',
};

export const TheLegendsWikiLogo: React.FC<TheLegendsWikiLogoProps> = ({
  size = 'md',
  showText = false,
  textClassName = '',
  subtextClassName = '',
  className = '',
  imgClassName = '',
  alt = 'TheLegendsWiki Official Logo',
  onClick,
}) => {
  const [imgSrc, setImgSrc] = useState<string>('/the_legends_wiki_logo.jpg');
  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;

  const imageElement = (
    <div
      onClick={onClick}
      className={`relative shrink-0 flex items-center justify-center aspect-square select-none ${sizeClasses} ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <img
        src={imgSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => {
          if (imgSrc !== '/logo.png') {
            setImgSrc('/logo.png');
          }
        }}
        className={`w-full h-full object-contain aspect-square select-none pointer-events-none rounded-xs transition-transform duration-200 group-hover:scale-105 ${imgClassName}`}
        loading="eager"
      />
    </div>
  );

  if (!showText) {
    return imageElement;
  }

  return (
    <div className="flex items-center gap-2.5">
      {imageElement}
      <div className="flex flex-col text-left">
        <span
          className={`text-base sm:text-lg font-bold text-[#101418] font-serif tracking-tight leading-tight group-hover:text-[#3366cc] transition-colors ${textClassName}`}
        >
          TheLegends<span className="text-[#3366cc] font-semibold">Wiki</span>
        </span>
        <span
          className={`font-handwritten text-xs text-[#64748b] leading-none -mt-0.5 ${subtextClassName}`}
        >
          The Open Knowledge Codex
        </span>
      </div>
    </div>
  );
};

export default TheLegendsWikiLogo;

