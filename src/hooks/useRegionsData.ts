import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFilters } from './useFilters';
import { formatMoscowDate } from '../lib/date-utils';
import { toNumber } from '../lib/format';

export interface RegionPerformance {
  region: string;
  orders: number;
  units: number;
  gmv: number;
  revenue: number;
  commissions: number;
  netProfit: number | null; // Temporarily null as requested
  avgOrderValue: number;
}

const transformRegionData = (item: any): RegionPerformance => ({
  region: item.region || 'Не указан',
  orders: toNumber(item.delivered_orders),
  units: toNumber(item.delivered_units),
  gmv: toNumber(item.delivered_gmv),
  revenue: toNumber(item.delivered_revenue),
  commissions: Math.abs(toNumber(item.delivered_commissions)),
  netProfit: null, // Temporarily disabled - will be implemented later
  avgOrderValue: toNumber(item.delivered_orders) > 0 
    ? toNumber(item.delivered_gmv) / toNumber(item.delivered_orders) 
    : 0,
});

export const useRegionsData = () => {
  const { filters } = useFilters();
  
  return useQuery({
    queryKey: ['regions', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_regions_performance', {
        start_date: formatMoscowDate(filters.dateFrom),
        end_date: formatMoscowDate(filters.dateTo),
        date_type: filters.dateType,
        sku_filter: filters.sku ? parseInt(filters.sku) : null,
        region_filter: filters.region || null,
      });

      if (error) throw error;

      return (data || []).map(transformRegionData);
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
};

export const useRegionsMetrics = () => {
  const { filters } = useFilters();
  
  return useQuery({
    queryKey: ['regionsMetrics', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_regions_metrics', {
        start_date: formatMoscowDate(filters.dateFrom),
        end_date: formatMoscowDate(filters.dateTo),
        date_type: filters.dateType,
        sku_filter: filters.sku ? parseInt(filters.sku) : null,
        region_filter: filters.region || null,
      });

      if (error) throw error;
      
      const result = data?.[0] || {
        total_regions: 0,
        total_revenue: 0,
        total_units: 0,
        total_orders: 0,
        total_gmv: 0,
        avg_revenue_per_region: 0,
        top_region: null,
        top_region_revenue: 0,
      };

      return {
        totalRegions: toNumber(result.total_regions),
        totalRevenue: toNumber(result.total_revenue),
        totalUnits: toNumber(result.total_units),
        totalOrders: toNumber(result.total_orders),
        totalGmv: toNumber(result.total_gmv),
        avgRevenuePerRegion: toNumber(result.avg_revenue_per_region),
        topRegion: result.top_region,
        topRegionRevenue: toNumber(result.top_region_revenue),
      };
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
};