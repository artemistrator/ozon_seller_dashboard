import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '../../lib/format';

export interface StatCardProps {
  title: string;
  value: number | null;
  previousValue?: number | null;
  format?: 'currency' | 'number' | 'percentage';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  previousValue,
  format = 'number',
  loading = false,
  icon,
}) => {
  const formatValue = (val: number | null) => {
    if (val == null) return '—';
    
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'percentage':
        return formatPercentage(val);
      default:
        return formatNumber(val);
    }
  };

  const getChangeDisplay = () => {
    if (value == null || previousValue == null) {
      return null;
    }

    const change = value - previousValue;
    const changePercent = previousValue === 0 ? 
      (value > 0 ? 100 : 0) : 
      (change / Math.abs(previousValue)) * 100;

    const isPositive = change > 0;
    const isNegative = change < 0;
    const isNeutral = change === 0;

    return (
      <div className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        ${isPositive ? 'text-green-600 bg-green-50' : ''}
        ${isNegative ? 'text-red-600 bg-red-50' : ''}
        ${isNeutral ? 'text-gray-600 bg-gray-50' : ''}
      `}>
        {isPositive && <TrendingUp className="w-3 h-3" />}
        {isNegative && <TrendingDown className="w-3 h-3" />}
        {isNeutral && <Minus className="w-3 h-3" />}
        {formatPercentage(Math.abs(changePercent))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="stat-card">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            {icon && <div className="w-5 h-5 bg-gray-200 rounded"></div>}
          </div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-5 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="metric-label">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      
      <div className="metric-value mb-2">
        {formatValue(value)}
      </div>
      
      {getChangeDisplay()}
    </div>
  );
};