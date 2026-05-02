import { cn } from '@/lib/utils';

type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'orange' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  green:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  red:    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  blue:   'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  gray:   'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const dotColors: Record<BadgeVariant, string> = {
  green:  'bg-green-500',
  yellow: 'bg-yellow-500',
  red:    'bg-red-500',
  blue:   'bg-blue-500',
  gray:   'bg-gray-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
};

export default function Badge({ children, variant = 'gray', className, dot = false }: BadgeProps) {
  return (
    <span className={cn('badge', variants[variant], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}

/** Map health status to badge variant */
export function HealthBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    excellent: 'green',
    good:      'green',
    fair:      'yellow',
    poor:      'orange',
    critical:  'red',
  };
  return <Badge variant={map[status] || 'gray'} dot>{status}</Badge>;
}
