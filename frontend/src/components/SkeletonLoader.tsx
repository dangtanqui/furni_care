import '../styles/components/SkeletonLoader.css';

interface SkeletonLoaderProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  lines?: number;
}

export default function SkeletonLoader({
  width,
  height,
  className = '',
  variant = 'rectangular',
  lines = 1,
}: SkeletonLoaderProps) {
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`skeleton-text-container ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="skeleton skeleton-text"
            data-width={index === lines - 1 ? '80%' : '100%'}
            data-height={height || '1rem'}
            style={{
              '--skeleton-width': index === lines - 1 ? '80%' : '100%',
              '--skeleton-height': height || '1rem',
            } as React.CSSProperties}
          />
        ))}
      </div>
    );
  }

  const variantClass = `skeleton-${variant}`;
  const styleProps: React.CSSProperties = {};
  if (width) {
    styleProps['--skeleton-width' as string] = width;
  }
  if (height) {
    styleProps['--skeleton-height' as string] = height;
  }

  return (
    <div
      className={`skeleton ${variantClass} ${className}`}
      data-width={width ? 'true' : undefined}
      data-height={height ? 'true' : undefined}
      style={Object.keys(styleProps).length > 0 ? styleProps : undefined}
      aria-label="Loading..."
      role="status"
    />
  );
}
