import React from 'react';
import { Category, Subcategory } from '../../types';
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
  Building,
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

export const getCategoryIcon = (iconName?: string, size = 18) => {
  const iconClass = "text-sky-400 shrink-0";
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
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0e1422] border border-[#1e293b] hover:border-sky-500/50 hover:bg-[#141c2e] transition-colors rounded-sm text-xs text-slate-300 font-medium cursor-pointer ${className}`}
      >
        {getCategoryIcon(category.iconName, 14)}
        <span>{category.name}</span>
        <span className="text-[10px] text-slate-500 font-normal">({category.articleCount})</span>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        id={`category-card-compact-${category.slug}`}
        onClick={handleClick}
        className={`p-3 bg-[#0e1422] border border-[#1e293b] hover:border-sky-500/50 hover:bg-[#141c2e] transition-all rounded-sm cursor-pointer group flex items-start gap-3 ${className}`}
      >
        <div className="p-2 bg-[#141c2e] border border-[#1e293b] rounded-sm group-hover:border-sky-500/40 transition-colors">
          {getCategoryIcon(category.iconName, 16)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-sky-400 font-display truncate transition-colors">
              {category.name}
            </h4>
            <span className="text-[10px] text-slate-500 font-mono shrink-0">
              {category.articleCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
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
        className={`p-5 bg-[#0e1422] border border-[#1e293b] hover:border-sky-500/50 rounded-sm transition-all flex flex-col justify-between ${className}`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#141c2e] border border-[#1e293b] rounded-sm">
                {getCategoryIcon(category.iconName, 18)}
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleClick}
                  className="text-base font-bold text-slate-100 hover:text-sky-400 font-display text-left transition-colors"
                >
                  {category.name}
                </button>
                <div className="text-[11px] text-slate-500 font-mono">
                  {category.articleCount.toLocaleString()} entries
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            {category.description}
          </p>

          {category.subcategories && category.subcategories.length > 0 && (
            <div className="pt-3 border-t border-[#1e293b]">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
                Sub-Disciplines
              </div>
              <div className="flex flex-wrap gap-1.5">
                {category.subcategories.map((sub) => (
                  <button
                    key={sub.slug}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/category/${sub.slug}`);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-[#141c2e] border border-[#1e293b] text-slate-300 hover:bg-[#1a253c] hover:border-sky-500/40 hover:text-sky-400 rounded-sm transition-colors cursor-pointer"
                  >
                    <span>{sub.name}</span>
                    <span className="text-[9px] text-slate-500">({sub.articleCount})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 mt-4 border-t border-[#1e293b] flex items-center justify-between">
          <button
            type="button"
            onClick={handleClick}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Browse {category.name}</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div
      id={`category-card-${category.slug}`}
      onClick={handleClick}
      className={`p-4 border border-[#1e293b] hover:border-sky-500/50 hover:bg-[#141c2e] transition-all cursor-pointer rounded-sm group bg-[#0e1422] flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="p-1.5 bg-[#141c2e] border border-[#1e293b] rounded-sm group-hover:border-sky-500/40 transition-colors">
            {getCategoryIcon(category.iconName, 16)}
          </div>
          <span className="text-[11px] text-slate-400 font-medium font-mono">
            {category.articleCount.toLocaleString()} entries
          </span>
        </div>

        <h4 className="text-sm font-bold text-slate-100 group-hover:text-sky-400 font-display leading-snug transition-colors">
          {category.name}
        </h4>
        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
          {category.description}
        </p>
      </div>

      <div className="mt-3 pt-2 border-t border-[#1e293b] flex items-center justify-between">
        <span className="text-[11px] text-sky-400 font-medium group-hover:text-sky-300">
          Explore discipline
        </span>
        <span className="text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all text-xs">
          &rarr;
        </span>
      </div>
    </div>
  );
};

