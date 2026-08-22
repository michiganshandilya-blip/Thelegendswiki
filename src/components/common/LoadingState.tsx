import React from 'react';

interface LoadingStateProps {
  message?: string;
  type?: 'card' | 'article' | 'list';
  count?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading encyclopedia records...',
  type = 'card',
  count = 3,
  className = '',
}) => {
  if (type === 'article') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={message}
        className={`max-w-4xl mx-auto py-8 animate-pulse space-y-6 ${className}`}
      >
        <span className="sr-only">{message}</span>
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-10 bg-slate-200 rounded w-3/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-64 bg-slate-100 rounded w-full border border-slate-200"></div>
        <div className="space-y-3 pt-4">
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          <div className="h-4 bg-slate-200 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full py-6 ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="bg-[#ffffff] border border-[#eaecf0] rounded-sm p-4 animate-pulse space-y-3 shadow-xs">
            <div className="h-32 bg-slate-100 rounded-sm w-full"></div>
            <div className="h-3 bg-slate-200 rounded w-1/3"></div>
            <div className="h-5 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-100 rounded w-full"></div>
            <div className="h-3 bg-slate-100 rounded w-5/6"></div>
          </div>
        ))}
      </div>
      <p className="text-center text-xs font-mono text-[#72777d] mt-4">{message}</p>
    </div>
  );
};
