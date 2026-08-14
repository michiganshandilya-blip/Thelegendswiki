import React from 'react';
import { SearchX, Compass, BookOpen } from 'lucide-react';
import { Button } from './Button';
import { useRouter } from '../../context/RouterContext';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionPath?: string;
  onAction?: () => void;
  iconType?: 'search' | 'articles' | 'explore';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Entries Found',
  description = 'There are no encyclopedia entries matching your current search parameters or category filter.',
  actionText = 'Explore Categories',
  actionPath = '/',
  onAction,
  iconType = 'search',
  className = '',
}) => {
  const { navigate } = useRouter();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionPath) {
      navigate(actionPath);
    }
  };

  const getIcon = () => {
    switch (iconType) {
      case 'articles':
        return <BookOpen size={24} className="text-sky-400" />;
      case 'explore':
        return <Compass size={24} className="text-sky-400" />;
      case 'search':
      default:
        return <SearchX size={24} className="text-sky-400" />;
    }
  };

  return (
    <div
      id="empty-state-container"
      className={`py-10 px-6 text-center max-w-md mx-auto bg-[#0e1422] border border-slate-800 rounded-sm my-6 shadow-xl shadow-black/40 ${className}`}
    >
      <div className="w-12 h-12 bg-[#141c2e] border border-slate-700/60 rounded-sm flex items-center justify-center mx-auto mb-3 text-sky-400 shadow-md">
        {getIcon()}
      </div>
      <h3 className="font-display text-lg font-bold text-slate-100 mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-400 mb-5 leading-relaxed">
        {description}
      </p>
      {actionText && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAction}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};
