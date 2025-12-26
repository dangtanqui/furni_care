import { memo } from 'react';
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import '../styles/utilities.css';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  alwaysAutoWidth?: boolean; // Always auto-width even on mobile (for back button)
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

function Button({
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
  };
  
  const sizeMap: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  const variantClass = variantMap[variant];
  const sizeClass = sizeMap[size];
  
  // Width logic:
  // - alwaysAutoWidth: always auto-width even on mobile (for back button) - override CSS with !important
  // - fullWidth: always full-width even on desktop - override CSS
  // - Default: responsive (w-full on mobile, w-auto on desktop from CSS in utilities.css)
  //   Default CSS already has: w-full md:w-auto for all button variants
  let widthClass = '';
  if (alwaysAutoWidth) {
    widthClass = '!w-auto';
  } else if (fullWidth) {
    widthClass = '!w-full';
  }
  // If no widthClass, default CSS w-full md:w-auto will be applied
  
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
  
  // Ensure widthClass is applied after className to override if needed
  const buttonClasses = `${variantClass} ${sizeClass} flex items-center justify-center gap-2 text-center ${className} ${widthClass}`.trim();
  
  // If 'to' prop exists, render as Link from react-router-dom
  if (to) {
    return (
      <Link
        to={to}
        className={buttonClasses}
        style={alwaysAutoWidth ? { width: 'auto', display: 'inline-flex' } : undefined}
        {...(props as Omit<React.ComponentProps<typeof Link>, keyof BaseButtonProps>)}
      >
        {buttonContent}
      </Link>
    );
  }
  
  // If 'href' prop exists, render as anchor
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
  
  // Default: render as button
  return (
    <button
      className={buttonClasses}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {buttonContent}
    </button>
  );
}

export default memo(Button);
