import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  showSpinner?: boolean;
  className?: string;
  textClassName?: string;
  spinnerClassName?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({
  size = 'md',
  text = 'Loading...',
  showSpinner = true,
  className = '',
  textClassName = '',
  spinnerClassName = '',
  padding = 'sm'
}: LoadingSpinnerProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  const sizeClassMap = {
    sm: styles.loaderSm,
    md: styles.loaderMd,
    lg: styles.loaderLg
  };

  const paddingClass = paddingClasses[padding];
  const baseTextClass = 'text-sm text-gray-400';
  const loaderClasses = `${styles.loader} ${sizeClassMap[size]}`;

  return (
    <div className={`flex items-center gap-2 ${paddingClass} ${className}`}>
      {showSpinner && (
        <div 
          className={`${loaderClasses} ${spinnerClassName}`}
          role="status"
          aria-hidden="true"
        />
      )}
      {text && (
        <span 
          className={`${baseTextClass} ${textClassName}`}
          role="status"
          aria-live="polite"
        >
          {text}
        </span>
      )}
    </div>
  );
}

// Specialized variants for common use cases
export function LoadingText({ 
  text = 'Loading...', 
  className = '',
  size = 'md',
  padding = 'sm'
}: Pick<LoadingSpinnerProps, 'text' | 'className' | 'size' | 'padding'>) {
  return (
    <LoadingSpinner 
      text={text} 
      showSpinner={false} 
      className={className}
      size={size}
      padding={padding}
    />
  );
}

export function LoadingCard({ 
  title = 'Loading...', 
  className = '',
  padding = 'md'
}: { 
  title?: string; 
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}) {
  return (
    <article className={`bg-card border border-border rounded-lg p-8 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <LoadingSpinner size="md" text={title} padding={padding} />
      </div>
      <div className="h-12 bg-muted rounded animate-pulse mb-2"></div>
      <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
    </article>
  );
}

export function LoadingMetric({ 
  text = 'Loading...', 
  className = '',
  padding = 'sm'
}: { 
  text?: string; 
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}) {
  return (
    <LoadingSpinner 
      text={text} 
      size="sm" 
      className={className}
      padding={padding}
    />
  );
}
