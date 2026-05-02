import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  fullPage?: boolean;
}

const sizes = {
  sm:  'w-4 h-4 border-2',
  md:  'w-6 h-6 border-2',
  lg:  'w-10 h-10 border-3',
  xl:  'w-16 h-16 border-4',
};

export default function LoadingSpinner({ size = 'md', className, text, fullPage }: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full border-green-200 border-t-green-600 animate-spin',
          sizes[size]
        )}
      />
      {text && <p className="text-sm text-gray-500 animate-pulse">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="xl" text="Loading..." />
    </div>
  );
}
