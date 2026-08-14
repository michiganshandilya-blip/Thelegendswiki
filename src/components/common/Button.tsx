import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:pointer-events-none rounded-sm select-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-1.5 gap-2',
    lg: 'text-base px-5 py-2 gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-[0_0_15px_rgba(37,99,235,0.35)] border border-blue-400/40',
    secondary: 'bg-[#141c2e] text-slate-200 hover:bg-[#1a253c] hover:text-white active:bg-slate-800 border border-slate-700/60',
    outline: 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-800/60 active:bg-slate-800 border border-slate-700 hover:border-blue-500/50',
    ghost: 'bg-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 active:bg-slate-800',
    link: 'bg-transparent text-blue-400 hover:text-blue-300 hover:underline p-0 h-auto font-normal focus:ring-0',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="inline-flex shrink-0">{icon}</span>}
    </button>
  );
};
