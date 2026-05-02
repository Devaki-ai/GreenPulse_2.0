import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'blue' | 'orange' | 'purple' | 'red';
  className?: string;
}

const colorMap = {
  green:  { bg: 'bg-green-50 dark:bg-green-900/20',  icon: 'bg-green-100 dark:bg-green-900/40 text-green-600' },
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',    icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20',icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20',icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600' },
  red:    { bg: 'bg-red-50 dark:bg-red-900/20',      icon: 'bg-red-100 dark:bg-red-900/40 text-red-600' },
};

export default function StatCard({ title, value, icon, change, changeType = 'neutral', color = 'green', className }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div className={cn('card p-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {change && (
            <p className={cn(
              'text-xs font-medium mt-1',
              changeType === 'up'   && 'text-green-600',
              changeType === 'down' && 'text-red-600',
              changeType === 'neutral' && 'text-gray-500',
            )}>
              {changeType === 'up' && '↑ '}
              {changeType === 'down' && '↓ '}
              {change}
            </p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-xl', colors.icon)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
