import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFilters } from './useFilters';
import { formatMoscowDate, getPreviousPeriod } from '../lib/date-utils';
import { toNumber } from '../lib/format';

export interface SalesMetrics {
  totalOrders: number;
  totalUnits: number;
  totalGmv: number;
  totalRevenue: number;
  totalCommissions: number;
  avgOrderValue: number;
  deliveredOrders: number;
  deliveredUnits: number;
  deliveredGmv: number;
  deliveredRevenue: number;
  deliveredCommissions: number;
  cancelledGmv: number;
  inDeliveryGmv: number;
  netProfit: number;
}

export interface DailySalesData {
  date: string;
  orders: number;
  units: number;
  gmv: number;
  revenue: number;
  avgOrderValue: number;
}

const transformSalesMetrics = (data: any): SalesMetrics => ({
  totalOrders: toNumber(data.total_orders),
  totalUnits: toNumber(data.total_units),
  totalGmv: toNumber(data.total_gmv),
  totalRevenue: toNumber(data.total_revenue),
  totalCommissions: toNumber(data.total_commissions),
  avgOrderValue: toNumber(data.avg_order_value),
  deliveredOrders: toNumber(data.delivered_orders),
  deliveredUnits: toNumber(data.delivered_units),
  deliveredGmv: toNumber(data.delivered_gmv),
  deliveredRevenue: toNumber(data.delivered_revenue),
  deliveredCommissions: toNumber(data.delivered_commissions),
  cancelledGmv: toNumber(data.cancelled_gmv),
  inDeliveryGmv: toNumber(data.in_delivery_gmv),
  netProfit: toNumber(data.net_profit),
});

export const useSalesMetrics = () => {
  const { filters } = useFilters();
  
  return useQuery({
    queryKey: ['salesMetrics', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sales_metrics_by_date_type', {
        start_date: formatMoscowDate(filters.dateFrom),
        end_date: formatMoscowDate(filters.dateTo),
        date_type: filters.dateType,
        sku_filter: filters.sku ? parseInt(filters.sku) : null,
        region_filter: filters.region || null,
      });

      if (error) throw error;
      return data?.[0] ? transformSalesMetrics(data[0]) : null;
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
};

export const usePreviousSalesMetrics = () => {
  const { filters } = useFilters();
  const previousPeriod = getPreviousPeriod(filters.dateFrom, filters.dateTo);
  
  return useQuery({
    queryKey: ['salesMetrics', 'previous', previousPeriod, filters.sku, filters.region, filters.dateType],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sales_metrics_by_date_type', {
        start_date: formatMoscowDate(previousPeriod.from),
        end_date: formatMoscowDate(previousPeriod.to),
        date_type: filters.dateType,
        sku_filter: filters.sku ? parseInt(filters.sku) : null,
        region_filter: filters.region || null,
      });

      if (error) throw error;
      return data?.[0] ? transformSalesMetrics(data[0]) : null;
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
};

export const useDailySales = () => {
  const { filters } = useFilters();
  
  return useQuery({
    queryKey: ['dailySales', filters],
    queryFn: async () => {
      let query = supabase
        .from('vw_daily_sales_by_date_type')
        .select('*')
        .eq('date_type', filters.dateType)
        .gte('date_msk', formatMoscowDate(filters.dateFrom))
        .lte('date_msk', formatMoscowDate(filters.dateTo))
        .order('date_msk');

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map((item): DailySalesData => ({
        date: item.date_msk,
        orders: toNumber(item.delivered_orders),
        units: toNumber(item.delivered_units),
        gmv: toNumber(item.delivered_gmv),
        revenue: toNumber(item.delivered_revenue),
        avgOrderValue: toNumber(item.delivered_gmv) / Math.max(toNumber(item.delivered_orders), 1),
      }));
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
};