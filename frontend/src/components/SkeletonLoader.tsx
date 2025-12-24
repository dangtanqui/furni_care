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
            style={{
              width: index === lines - 1 ? '80%' : '100%',
              height: height || '1rem',
            }}
          />
        ))}
      </div>
    );
  }

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  const variantClass = `skeleton-${variant}`;

  return (
    <div
      className={`skeleton ${variantClass} ${className}`}
      style={style}
      aria-label="Loading..."
      role="status"
    />
  );
}

