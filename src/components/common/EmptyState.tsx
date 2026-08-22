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
  actionText = 'Explore Disciplines',
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
        return <BookOpen size={24} className="text-[#3366cc]" />;
      case 'explore':
        return <Compass size={24} className="text-[#3366cc]" />;
      case 'search':
      default:
        return <SearchX size={24} className="text-[#3366cc]" />;
    }
  };

  return (
    <div
      id="empty-state-container"
      className={`py-10 px-6 text-center max-w-md mx-auto bg-[#ffffff] border border-[#eaecf0] rounded-sm my-6 shadow-xs ${className}`}
    >
      <div className="w-12 h-12 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm flex items-center justify-center mx-auto mb-3 text-[#3366cc] shadow-xs">
        {getIcon()}
      </div>
      <h3 className="font-serif text-lg font-bold text-[#101418] mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#54595d] mb-5 leading-relaxed font-sans">
        {description}
      </p>
      {actionText && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAction}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};
