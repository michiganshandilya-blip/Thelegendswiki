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
      className={`max-w-md mx-auto my-12 p-6 bg-[#ffffff] border border-[#a2a9b1] rounded-sm text-center shadow-xs ${className}`}
    >
      <div className="w-12 h-12 rounded-sm bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-4 shadow-xs">
        <AlertTriangle size={24} />
      </div>
      <h3 className="font-serif text-xl font-bold text-[#101418] mb-2">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#54595d] mb-6 leading-relaxed font-sans">
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
