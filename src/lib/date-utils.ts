import { format, subDays, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime, format as formatTz } from 'date-fns-tz';

const MOSCOW_TZ = 'Europe/Moscow';

/**
 * Convert date to Moscow timezone
 */
export const toMoscowTime = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return utcToZonedTime(dateObj, MOSCOW_TZ);
};

/**
 * Convert Moscow time to UTC for database queries
 */
export const toUTC = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return zonedTimeToUtc(dateObj, MOSCOW_TZ);
};

/**
 * Format date in Moscow timezone
 */
export const formatMoscowDate = (date: Date | string, pattern = 'yyyy-MM-dd'): string => {
  const moscowDate = toMoscowTime(date);
  return formatTz(moscowDate, pattern, { timeZone: MOSCOW_TZ });
};

/**
 * Get default date range (last 7 days) in Moscow timezone
 */
export const getDefaultDateRange = (): { from: Date; to: Date } => {
  // Use a date range where we have actual data (2025)
  const now = new Date('2025-08-25');
  const moscowNow = toMoscowTime(now);
  const to = endOfDay(moscowNow);
  const from = startOfDay(subDays(moscowNow, 6)); // Last 7 days including today
  
  return { from, to };
};

/**
 * Calculate previous period for comparison
 */
export const getPreviousPeriod = (from: Date, to: Date): { from: Date; to: Date } => {
  const periodLength = differenceInDays(to, from) + 1; // +1 to include both days
  const prevTo = subDays(from, 1);
  const prevFrom = subDays(prevTo, periodLength - 1);
  
  return {
    from: startOfDay(prevFrom),
    to: endOfDay(prevTo),
  };
};

/**
 * Calculate percentage change between current and previous values
 */
export const calculateChange = (current: number, previous: number): {
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'neutral';
} => {
  const value = current - previous;
  const percentage = previous === 0 ? (current > 0 ? 100 : 0) : (value / Math.abs(previous)) * 100;
  
  return {
    value,
    percentage,
    trend: value > 0 ? 'up' : value < 0 ? 'down' : 'neutral',
  };
};

/**
 * Format date range for display
 */
export const formatDateRange = (from: Date, to: Date): string => {
  return `${formatMoscowDate(from, 'dd.MM.yyyy')} - ${formatMoscowDate(to, 'dd.MM.yyyy')}`;
};