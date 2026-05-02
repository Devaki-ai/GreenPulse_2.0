import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format date to readable string */
export function formatDate(date: string | Date, pattern = 'dd MMM yyyy') {
  return format(new Date(date), pattern);
}

/** Relative time (e.g. "2 hours ago") */
export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/** Format currency in INR */
export function formatCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Capitalize first letter */
export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/** Get health status color */
export function getHealthColor(status: string) {
  const map: Record<string, string> = {
    excellent: 'text-green-600 bg-green-100',
    good:      'text-green-500 bg-green-50',
    fair:      'text-yellow-600 bg-yellow-100',
    poor:      'text-orange-600 bg-orange-100',
    critical:  'text-red-600 bg-red-100',
  };
  return map[status] || 'text-gray-600 bg-gray-100';
}

/** Get health status dot color */
export function getHealthDot(status: string) {
  const map: Record<string, string> = {
    excellent: 'bg-green-500',
    good:      'bg-green-400',
    fair:      'bg-yellow-400',
    poor:      'bg-orange-500',
    critical:  'bg-red-500',
  };
  return map[status] || 'bg-gray-400';
}

/** Get weather condition icon emoji */
export function getWeatherEmoji(condition: string) {
  const map: Record<string, string> = {
    clear:   '☀️',
    cloudy:  '⛅',
    rainy:   '🌧️',
    stormy:  '⛈️',
    foggy:   '🌫️',
    snowy:   '❄️',
    windy:   '💨',
    hazy:    '🌁',
  };
  return map[condition] || '🌤️';
}

/** Truncate text */
export function truncate(str: string, length = 100) {
  return str.length > length ? str.slice(0, length) + '...' : str;
}

/** Get initials from name */
export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Debounce function */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
