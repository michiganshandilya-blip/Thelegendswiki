import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  aspectRatio?: 'video' | 'square' | '4/3' | '3/2' | 'auto';
  className?: string;
  containerClassName?: string;
  fallbackSrc?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  aspectRatio = 'auto',
  className = '',
  containerClassName = '',
  fallbackSrc,
  priority = false,
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'video':
        return 'aspect-video';
      case 'square':
        return 'aspect-square';
      case '4/3':
        return 'aspect-4/3';
      case '3/2':
        return 'aspect-3/2';
      default:
        return '';
    }
  };

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-[#f1f5f9] ${getAspectRatioClass()} ${containerClassName}`}
    >
      {/* Loading Skeleton / Blur-up Shimmer Placeholder */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-linear-to-r from-[#f1f5f9] via-[#e2e8f0] to-[#f1f5f9] animate-pulse flex items-center justify-center text-[#94a3b8]"
          aria-hidden="true"
        >
          <ImageIcon size={20} className="opacity-40 animate-pulse" />
        </div>
      )}

      {/* Error Fallback Box */}
      {hasError ? (
        <div
          role="img"
          aria-label={alt || 'Image unavailable'}
          className="w-full h-full min-h-[100px] flex flex-col items-center justify-center p-4 bg-[#f8f9fa] border border-[#cbd5e1] text-[#64748b] text-center"
        >
          <AlertCircle size={20} className="text-[#94a3b8] mb-1" />
          <span className="text-[11px] font-sans text-[#64748b]">Illustration reference archived</span>
        </div>
      ) : (
        <img
          src={currentSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          // @ts-ignore fetchPriority is supported in React 18.2+ and modern browsers
          fetchPriority={priority ? 'high' : 'auto'}
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...rest}
        />
      )}
    </div>
  );
};
