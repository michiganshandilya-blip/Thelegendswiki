import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from './Button';
import { useRouter } from '../../context/RouterContext';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Information Unavailable',
  message = 'An error occurred while loading this encyclopedia entry. Please try again or return to the main registry.',
  onRetry,
  className = '',
}) => {
  const { navigate } = useRouter();

  return (
    <div
      id="error-state-box"
      className={`max-w-md mx-auto my-12 p-6 bg-[#0e1422] border border-slate-800 rounded-sm text-center shadow-xl shadow-black/40 ${className}`}
    >
      <div className="w-12 h-12 rounded-sm bg-amber-950/60 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-md">
        <AlertTriangle size={24} />
      </div>
      <h3 className="font-display text-xl font-bold text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">
        {message}
      </p>
      <div className="flex items-center justify-center gap-3">
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            icon={<RotateCcw size={14} />}
          >
            Try Again
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/')}
          icon={<Home size={14} />}
        >
          Return to Registry
        </Button>
      </div>
    </div>
  );
};
