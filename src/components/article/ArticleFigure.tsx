import React, { useState } from 'react';
import { ArticleImageFigure } from '../../types';
import { OptimizedImage } from '../common/OptimizedImage';
import { ZoomIn, X, Image as ImageIcon } from 'lucide-react';

interface ArticleFigureProps {
  figure: ArticleImageFigure;
  className?: string;
}

export const ArticleFigure: React.FC<ArticleFigureProps> = ({
  figure,
  className = '',
}) => {
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  if (!figure || !figure.url) return null;

  const getAlignmentClasses = () => {
    switch (figure.align) {
      case 'left':
        return 'md:float-left md:mr-6 md:mb-4 md:max-w-xs w-full clear-left';
      case 'center':
        return 'mx-auto my-6 max-w-xl w-full clear-both';
      case 'full':
        return 'w-full my-6 clear-both';
      case 'right':
      default:
        return 'md:float-right md:ml-6 md:mb-4 md:max-w-xs w-full clear-right';
    }
  };

  const effectiveAlt = figure.alt || figure.caption || 'Archival article illustration';

  return (
    <>
      <figure
        role="group"
        aria-label={figure.caption || effectiveAlt}
        className={`my-4 bg-[#f8f9fa] border border-[#a2a9b1] p-2 rounded-sm shadow-xs transition-all ${getAlignmentClasses()} ${className}`}
      >
        {/* Clickable Image Container */}
        <div
          onClick={() => setIsZoomed(true)}
          className="relative bg-[#ffffff] border border-[#eaecf0] rounded-xs overflow-hidden group cursor-zoom-in"
          title="Click to view full image in high resolution"
        >
          <OptimizedImage
            src={figure.url}
            alt={effectiveAlt}
            containerClassName="w-full max-h-80"
            className="w-full h-auto object-cover max-h-80 group-hover:scale-101 transition-transform"
          />

          {/* Zoom Overlay Pill */}
          <div className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-xs backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={14} />
          </div>
        </div>

        {/* Caption & Source Credit */}
        <figcaption className="mt-2 text-xs text-[#54595d] leading-relaxed text-left font-sans">
          {figure.caption && <span className="font-normal text-[#202122]">{figure.caption}</span>}
          {figure.credit && (
            <span className="block text-[10px] text-[#72777d] mt-1 font-mono tracking-tight">
              Source: {figure.credit}
            </span>
          )}
        </figcaption>
      </figure>

      {/* Lightbox / Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image Zoom View"
        >
          <div
            className="relative bg-[#ffffff] border border-[#a2a9b1] rounded-sm max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#f8f9fa] border-b border-[#eaecf0]">
              <div className="flex items-center gap-2 text-xs font-mono text-[#54595d]">
                <ImageIcon size={14} className="text-[#3366cc]" />
                <span className="font-bold text-[#101418]">Archival Image Inspection</span>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="p-1 text-[#72777d] hover:text-[#101418] hover:bg-[#eaecf0] rounded-sm transition-colors cursor-pointer"
                aria-label="Close image zoom"
              >
                <X size={18} />
              </button>
            </div>

            {/* High-res Image Display */}
            <div className="bg-[#101418] flex items-center justify-center overflow-auto max-h-[68vh] p-2">
              <img
                src={figure.url}
                alt={effectiveAlt}
                className="max-w-full max-h-[64vh] object-contain rounded-xs shadow-md"
              />
            </div>

            {/* Modal Bottom Metadata */}
            <div className="p-4 bg-[#f8f9fa] border-t border-[#eaecf0] text-xs text-[#202122] space-y-1.5 font-sans">
              {figure.caption && <p className="font-medium leading-relaxed">{figure.caption}</p>}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#eaecf0] text-[11px] text-[#72777d] font-mono">
                {figure.credit && <span>Attribution: {figure.credit}</span>}
                <span className="italic">Alt: "{effectiveAlt}"</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
