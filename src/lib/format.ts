/**
 * Format number using Russian locale
 */
export const formatNumber = (value: number | null | undefined, options?: Intl.NumberFormatOptions): string => {
  if (value == null || isNaN(value)) return '—';
  
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
};

/**
 * Format currency in Russian rubles
 */
export const formatCurrency = (value: number | null | undefined, options?: Intl.NumberFormatOptions): string => {
  if (value == null || isNaN(value)) return '—';
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
};

/**
 * Format compact currency (with K, M suffixes)
 */
export const formatCompactCurrency = (value: number | null | undefined): string => {
  if (value == null || isNaN(value)) return '—';
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
};

/**
 * Format percentage with proper sign and color indication
 */
export const formatPercentage = (value: number | null | undefined, showSign = true): string => {
  if (value == null || isNaN(value)) return '—';
  
  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    signDisplay: showSign ? 'always' : 'auto',
  }).format(value / 100);
  
  return formatted;
};

/**
 * Format change value with currency and percentage
 */
export const formatChange = (
  currentValue: number,
  previousValue: number,
  isCurrency = false
): {
  valueChange: string;
  percentageChange: string;
  trend: 'up' | 'down' | 'neutral';
} => {
  const value = currentValue - previousValue;
  const percentage = previousValue === 0 ? (currentValue > 0 ? 100 : 0) : (value / Math.abs(previousValue)) * 100;
  
  const valueChange = isCurrency ? formatCurrency(value) : formatNumber(value);
  const percentageChange = formatPercentage(percentage);
  
  return {
    valueChange,
    percentageChange,
    trend: value > 0 ? 'up' : value < 0 ? 'down' : 'neutral',
  };
};

/**
 * Safe number conversion from database values
 */
export const toNumber = (value: any): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};