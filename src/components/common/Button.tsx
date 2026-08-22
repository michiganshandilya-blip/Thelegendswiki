import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
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
    'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3366cc] focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none rounded-sm select-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2',
    lg: 'text-base px-4.5 py-2 gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-[#3366cc] hover:bg-[#2557bb] active:bg-[#1d4ed8] text-white border border-[#2557bb] shadow-xs',
    secondary: 'bg-[#f8f9fa] text-[#202122] hover:bg-[#eef2f6] hover:text-[#101418] border border-[#a2a9b1] shadow-xs',
    outline: 'bg-transparent text-[#202122] hover:bg-[#f1f5f9] border border-[#a2a9b1]',
    ghost: 'bg-transparent text-[#54595d] hover:text-[#101418] hover:bg-[#f1f5f9]',
    link: 'bg-transparent text-[#3366cc] hover:text-[#1d4ed8] hover:underline p-0 h-auto font-normal focus:ring-0',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-300',
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
