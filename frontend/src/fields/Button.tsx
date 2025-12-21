import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import '../styles/utilities.css';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  alwaysAutoWidth?: boolean; // Luôn auto-width kể cả mobile (cho back button)
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  to?: string;
  href?: string;
}

type ButtonProps = BaseButtonProps & 
  (BaseButtonProps['to'] extends string 
    ? { to: string } & Omit<React.ComponentProps<typeof Link>, keyof BaseButtonProps>
    : BaseButtonProps['href'] extends string
    ? { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseButtonProps>
    : Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps>);

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  alwaysAutoWidth = false,
  className = '',
  children,
  leftIcon,
  rightIcon,
  to,
  href,
  ...props
}: ButtonProps) {
  const variantMap: Record<ButtonVariant, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    tertiary: 'btn-tertiary',
    danger: 'btn-danger',
  };
  
  const sizeMap: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  const variantClass = variantMap[variant];
  const sizeClass = sizeMap[size];
  
  // Width logic:
  // - alwaysAutoWidth: luôn auto-width kể cả mobile (cho back button) - override CSS với !important
  // - fullWidth: luôn full-width kể cả desktop - override CSS
  // - Mặc định: responsive (w-full trên mobile, w-auto trên desktop từ CSS trong utilities.css)
  //   CSS mặc định đã có: w-full md:w-auto cho tất cả button variants
  let widthClass = '';
  if (alwaysAutoWidth) {
    widthClass = '!w-auto';
  } else if (fullWidth) {
    widthClass = '!w-full';
  }
  // Nếu không có widthClass, CSS mặc định w-full md:w-auto sẽ được áp dụng
  
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  
  const buttonContent = (
    <>
      {leftIcon && (
        <span className={`${iconSize} flex-shrink-0 flex items-center justify-center`}>
          {leftIcon}
        </span>
      )}
      <span className="text-center">{children}</span>
      {rightIcon && (
        <span className={`${iconSize} flex-shrink-0 flex items-center justify-center`}>
          {rightIcon}
        </span>
      )}
    </>
  );
  
  // Đảm bảo widthClass được apply sau className để override nếu cần
  const buttonClasses = `${variantClass} ${sizeClass} flex items-center justify-center gap-2 text-center ${className} ${widthClass}`.trim();
  
  // Nếu có 'to' prop, render như Link từ react-router-dom
  if (to) {
    return (
      <Link
        to={to}
        className={buttonClasses}
        style={alwaysAutoWidth ? { width: 'auto', display: 'inline-flex' } : undefined}
        {...(props as any)}
      >
        {buttonContent}
      </Link>
    );
  }
  
  // Nếu có 'href', render như anchor
  if (href) {
    return (
      <a
        href={href}
        className={buttonClasses}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {buttonContent}
      </a>
    );
  }
  
  // Mặc định render như button
  return (
    <button
      className={buttonClasses}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {buttonContent}
    </button>
  );
}

