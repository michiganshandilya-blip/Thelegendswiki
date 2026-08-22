import React from 'react';
import { Category } from '../../types';
import { useRouter } from '../../context/RouterContext';
import { 
  Users, 
  Landmark, 
  Atom, 
  Cpu, 
  Trophy, 
  Film, 
  Compass, 
  Scale, 
  Briefcase, 
  GraduationCap, 
  Sparkles, 
  Building2, 
  Building, 
  CalendarDays,
  Globe,
  Globe2,
  Scroll,
  BookOpen,
  FlaskConical,
  HeartPulse,
  Rocket,
  Radio,
  Tv,
  Music,
  Waves,
  Mountain,
  MapPin,
  Flag,
  TrendingUp,
  Factory,
  HeartHandshake,
  Flame,
  Clock,
  ChevronRight
} from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  variant?: 'card' | 'compact' | 'pill' | 'expanded';
  className?: string;
}

export const getCategoryIcon = (iconName?: string, size = 16) => {
  const iconClass = "text-[#3366cc] shrink-0";
  switch (iconName) {
    case 'Users':
      return <Users size={size} className={iconClass} />;
    case 'Landmark':
      return <Landmark size={size} className={iconClass} />;
    case 'Atom':
      return <Atom size={size} className={iconClass} />;
    case 'Cpu':
      return <Cpu size={size} className={iconClass} />;
    case 'Trophy':
      return <Trophy size={size} className={iconClass} />;
    case 'Film':
      return <Film size={size} className={iconClass} />;
    case 'Compass':
      return <Compass size={size} className={iconClass} />;
    case 'Scale':
      return <Scale size={size} className={iconClass} />;
    case 'Briefcase':
      return <Briefcase size={size} className={iconClass} />;
    case 'GraduationCap':
      return <GraduationCap size={size} className={iconClass} />;
    case 'Sparkles':
      return <Sparkles size={size} className={iconClass} />;
    case 'Building2':
      return <Building2 size={size} className={iconClass} />;
    case 'Building':
      return <Building size={size} className={iconClass} />;
    case 'CalendarDays':
      return <CalendarDays size={size} className={iconClass} />;
    case 'Globe':
    case 'Globe2':
      return <Globe size={size} className={iconClass} />;
    case 'Scroll':
      return <Scroll size={size} className={iconClass} />;
    case 'FlaskConical':
      return <FlaskConical size={size} className={iconClass} />;
    case 'HeartPulse':
      return <HeartPulse size={size} className={iconClass} />;
    case 'Rocket':
      return <Rocket size={size} className={iconClass} />;
    case 'Radio':
      return <Radio size={size} className={iconClass} />;
    case 'Tv':
      return <Tv size={size} className={iconClass} />;
    case 'Music':
      return <Music size={size} className={iconClass} />;
    case 'Waves':
      return <Waves size={size} className={iconClass} />;
    case 'Mountain':
      return <Mountain size={size} className={iconClass} />;
    case 'MapPin':
      return <MapPin size={size} className={iconClass} />;
    case 'Flag':
      return <Flag size={size} className={iconClass} />;
    case 'TrendingUp':
      return <TrendingUp size={size} className={iconClass} />;
    case 'Factory':
      return <Factory size={size} className={iconClass} />;
    case 'HeartHandshake':
      return <HeartHandshake size={size} className={iconClass} />;
    case 'Flame':
      return <Flame size={size} className={iconClass} />;
    case 'Clock':
      return <Clock size={size} className={iconClass} />;
    default:
      return <BookOpen size={size} className={iconClass} />;
  }
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  variant = 'card',
  className = '',
}) => {
  const { navigate } = useRouter();

  const handleClick = () => {
    navigate(`/category/${category.slug}`);
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        id={`category-pill-${category.slug}`}
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1 bg-[#ffffff] border border-[#eaecf0] hover:border-[#3366cc] hover:bg-[#f8f9fa] transition-colors rounded-sm text-xs text-[#202122] font-medium cursor-pointer shadow-xs ${className}`}
      >
        {getCategoryIcon(category.iconName, 13)}
        <span>{category.name}</span>
        <span className="text-[10px] text-[#72777d] font-normal">({category.articleCount})</span>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        id={`category-card-compact-${category.slug}`}
        onClick={handleClick}
        className={`p-3 bg-[#ffffff] border border-[#eaecf0] hover:border-[#3366cc] hover:bg-[#f8f9fa] transition-all rounded-sm cursor-pointer group flex items-start gap-3 shadow-xs ${className}`}
      >
        <div className="p-1.5 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm group-hover:border-[#3366cc] transition-colors">
          {getCategoryIcon(category.iconName, 15)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs sm:text-sm font-bold text-[#101418] group-hover:text-[#3366cc] font-serif truncate transition-colors">
              {category.name}
            </h4>
            <span className="text-[10px] text-[#72777d] font-mono shrink-0">
              {category.articleCount}
            </span>
          </div>
          <p className="text-[11px] text-[#54595d] line-clamp-1 mt-0.5 font-sans">
            {category.description}
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'expanded') {
    return (
      <div
        id={`category-card-expanded-${category.slug}`}
        onClick={handleClick}
        className={`p-5 bg-[#ffffff] border border-[#cbd5e1] hover:border-[#2563eb] hover:shadow-sm rounded-sm transition-all flex flex-col justify-between cursor-pointer group shadow-xs ${className}`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm group-hover:border-[#2563eb] transition-colors">
                {getCategoryIcon(category.iconName, 20)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#101418] group-hover:text-[#2563eb] font-serif transition-colors">
                  {category.name}
                </h3>
                <div className="text-[11px] text-[#64748b] font-mono">
                  {category.articleCount.toLocaleString()} indexed articles
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#475569] leading-relaxed mb-3 font-sans">
            {category.description}
          </p>
        </div>

        <div className="pt-3 mt-2 border-t border-[#eaecf0] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#2563eb] group-hover:underline inline-flex items-center gap-1">
            <span>Explore {category.name} Archive</span>
          </span>
          <ChevronRight size={14} className="text-[#94a3b8] group-hover:text-[#2563eb] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div
      id={`category-card-${category.slug}`}
      onClick={handleClick}
      className={`p-4 border border-[#eaecf0] hover:border-[#3366cc] hover:bg-[#f8f9fa] transition-all cursor-pointer rounded-sm group bg-[#ffffff] flex flex-col justify-between shadow-xs ${className}`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="p-1.5 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm group-hover:border-[#3366cc] transition-colors">
            {getCategoryIcon(category.iconName, 16)}
          </div>
          <span className="text-[11px] text-[#72777d] font-medium font-mono">
            {category.articleCount.toLocaleString()} entries
          </span>
        </div>

        <h4 className="text-sm font-bold text-[#101418] group-hover:text-[#3366cc] font-serif leading-snug transition-colors">
          {category.name}
        </h4>
        <p className="text-xs text-[#54595d] line-clamp-2 mt-1 leading-relaxed font-sans">
          {category.description}
        </p>
      </div>

      <div className="mt-3 pt-2 border-t border-[#eaecf0] flex items-center justify-between">
        <span className="text-[11px] text-[#3366cc] font-medium group-hover:underline">
          Explore discipline
        </span>
        <span className="text-[#a2a9b1] group-hover:text-[#3366cc] group-hover:translate-x-0.5 transition-all text-xs">
          &rarr;
        </span>
      </div>
    </div>
  );
};
