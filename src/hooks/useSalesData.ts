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

// Add the missing helper function for manual calculation
const calculateSalesMetricsManually = (data: any[]) => {
  console.log('Calculating sales metrics manually for', data.length, 'items');
  
  // Group by order_id to avoid duplicate counting
  const orderMap = new Map();
  data.forEach(item => {
    if (!orderMap.has(item.order_id)) {
      orderMap.set(item.order_id, []);
    }
    orderMap.get(item.order_id).push(item);
  });
  
  // Convert to array of consolidated orders
  const orderArray = Array.from(orderMap.values()).map(items => {
    // For orders with multiple items, sum the relevant fields
    return items.reduce((acc: any, item: any) => {
      return {
        ...item,
        quantity: acc.quantity + (item.quantity || 0),
        price_total: acc.price_total + (item.price_total || 0),
        payout: acc.payout + (item.payout || 0),
        commission_amount: acc.commission_amount + (item.commission_amount || 0)
      };
    });
  });
  
  // Calculate totals using the correct formula: payout = price_total - commission_amount
  const totalOrders = orderArray.length;
  const totalUnits = orderArray.reduce((sum, item) => sum + toNumber(item.quantity), 0);
  const totalGmv = orderArray.reduce((sum, item) => sum + toNumber(item.price_total), 0);
  // Revenue is payout (price_total - commission_amount)
  const totalRevenue = orderArray.reduce((sum, item) => sum + toNumber(item.payout), 0);
  const totalCommissions = orderArray.reduce((sum, item) => sum + toNumber(item.commission_amount), 0);
  
  // Calculate delivered metrics
  const deliveredItems = orderArray.filter(item => item.status === 'delivered');
  const deliveredOrders = deliveredItems.length;
  const deliveredUnits = deliveredItems.reduce((sum, item) => sum + toNumber(item.quantity), 0);
  const deliveredGmv = deliveredItems.reduce((sum, item) => sum + toNumber(item.price_total), 0);
  // Revenue for delivered orders is also payout
  const deliveredRevenue = deliveredItems.reduce((sum, item) => sum + toNumber(item.payout), 0);
  const deliveredCommissions = deliveredItems.reduce((sum, item) => sum + toNumber(item.commission_amount), 0);
  
  // Calculate other status metrics
  const cancelledGmv = orderArray
    .filter(item => item.status === 'cancelled')
    .reduce((sum, item) => sum + toNumber(item.price_total), 0);
    
  const inDeliveryGmv = orderArray
    .filter(item => item.status === 'in_delivery')
    .reduce((sum, item) => sum + toNumber(item.price_total), 0);
  
  // Net profit calculation: payout - commission_amount
  const netProfit = totalRevenue - totalCommissions;
  
  const result = {
    totalOrders,
    totalUnits,
    totalGmv,
    totalRevenue,
    totalCommissions,
    avgOrderValue: totalOrders > 0 ? totalGmv / totalOrders : 0,
    deliveredOrders,
    deliveredUnits,
    deliveredGmv,
    deliveredRevenue,
    deliveredCommissions,
    cancelledGmv,
    inDeliveryGmv,
    netProfit
  };
  
  console.log('Manual calculation result:', result);
  return result;
};

const transformSalesMetrics = (data: any): SalesMetrics => {
  console.log('Transforming Sales Metrics:', data);
  
  // Revenue should be payout (price_total - commission_amount)
  // The RPC function now returns payout as total_revenue
  const totalRevenue = toNumber(data.total_revenue); // This is now payout
  const deliveredRevenue = toNumber(data.delivered_revenue); // This is now delivered payout
  const totalCommissions = toNumber(data.total_commissions);
  const deliveredCommissions = toNumber(data.delivered_commissions);
  
  // Net profit is already calculated correctly in RPC: payout - commission_amount
  const netProfit = toNumber(data.net_profit);
  
  const result = {
    totalOrders: toNumber(data.total_orders),
    totalUnits: toNumber(data.total_units),
    totalGmv: toNumber(data.total_gmv),
    totalRevenue: totalRevenue, // This is payout
    totalCommissions: totalCommissions,
    avgOrderValue: toNumber(data.avg_order_value),
    deliveredOrders: toNumber(data.delivered_orders),
    deliveredUnits: toNumber(data.delivered_units),
    deliveredGmv: toNumber(data.delivered_gmv),
    deliveredRevenue: deliveredRevenue, // This is delivered payout
    deliveredCommissions: deliveredCommissions,
    cancelledGmv: toNumber(data.cancelled_gmv),
    inDeliveryGmv: toNumber(data.in_delivery_gmv),
    netProfit: netProfit, // Use the pre-calculated value
  };
  
  console.log('Transformed Sales Metrics Result:', result);
  return result;
};

export const useSalesMetrics = () => {
  const { filters } = useFilters();
  
  return useQuery({
    queryKey: ['salesMetrics', filters],
    queryFn: async () => {
      console.log('=== SALES METRICS DEBUG ===');
      console.log('Filters:', filters);
      console.log('Formatted dates:', {
        start_date: formatMoscowDate(filters.dateFrom),
        end_date: formatMoscowDate(filters.dateTo),
        date_type: filters.dateType
      });
      
      // Try the correct RPC function first, fall back to original if it doesn't exist
      try {
        const rpcParams = {
          start_date: formatMoscowDate(filters.dateFrom),
          end_date: formatMoscowDate(filters.dateTo),
          date_type: filters.dateType,
          sku_filter: filters.sku ? parseInt(filters.sku) : null,
          region_filter: filters.region || null,
        };
        
        console.log('RPC Parameters:', rpcParams);
        
        // First try the corrected function
        const { data: correctedData, error: correctedError } = await supabase.rpc('get_sales_metrics_by_date_type_correct', rpcParams);
        
        if (!correctedError && correctedData?.[0]) {
          console.log('Using corrected RPC function:', { data: correctedData, error: correctedError });
          return transformSalesMetrics(correctedData[0]);
        }
        
        // Fall back to original function
        console.log('Falling back to original RPC function');
        const { data, error } = await supabase.rpc('get_sales_metrics_by_date_type', rpcParams);

        console.log('RPC Result:', { data, error });
        
        if (error) throw error;
        return data?.[0] ? transformSalesMetrics(data[0]) : null;
      } catch (error) {
        // Final fallback - direct table query with correct calculation
        console.log('Using direct table query fallback');
        
        let query = supabase
          .from('postings_fbs')
          .select('order_id, quantity, price_total, payout, commission_amount, status, in_process_at, shipment_date, delivering_date')
          .gte(filters.dateType, formatMoscowDate(filters.dateFrom))
          .lte(filters.dateType, formatMoscowDate(filters.dateTo));
          
        if (filters.sku) {
          query = query.eq('sku', parseInt(filters.sku));
        }
        
        if (filters.region) {
          query = query.eq('warehouse_name', filters.region);
        }
        
        const { data: rawData, error: queryError } = await query;
        
        if (queryError) throw queryError;
        
        // Calculate metrics manually with correct formula
        const metrics = calculateSalesMetricsManually(rawData || []);
        return metrics;
      }
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
      console.log('=== PREVIOUS SALES METRICS DEBUG ===');
      console.log('Previous Period:', previousPeriod);
      console.log('Filters:', filters);
      
      // Try the correct RPC function first, fall back to original if it doesn't exist
      try {
        const rpcParams = {
          start_date: formatMoscowDate(previousPeriod.from),
          end_date: formatMoscowDate(previousPeriod.to),
          date_type: filters.dateType,
          sku_filter: filters.sku ? parseInt(filters.sku) : null,
          region_filter: filters.region || null,
        };
        
        console.log('Previous RPC Parameters:', rpcParams);
        
        // First try the corrected function
        const { data: correctedData, error: correctedError } = await supabase.rpc('get_sales_metrics_by_date_type_correct', rpcParams);
        
        if (!correctedError && correctedData?.[0]) {
          console.log('Using corrected RPC function for previous period:', { data: correctedData, error: correctedError });
          return transformSalesMetrics(correctedData[0]);
        }
        
        // Fall back to original function
        console.log('Falling back to original RPC function for previous period');
        const { data, error } = await supabase.rpc('get_sales_metrics_by_date_type', rpcParams);

        console.log('Previous RPC Result:', { data, error });
        
        if (error) throw error;
        return data?.[0] ? transformSalesMetrics(data[0]) : null;
      } catch (error) {
        // Final fallback - direct table query with correct calculation
        console.log('Using direct table query fallback for previous period');
        
        let query = supabase
          .from('postings_fbs')
          .select('order_id, quantity, price_total, payout, commission_amount, status, in_process_at, shipment_date, delivering_date')
          .gte(filters.dateType, formatMoscowDate(previousPeriod.from))
          .lte(filters.dateType, formatMoscowDate(previousPeriod.to));
          
        if (filters.sku) {
          query = query.eq('sku', parseInt(filters.sku));
        }
        
        if (filters.region) {
          query = query.eq('warehouse_name', filters.region);
        }
        
        const { data: rawData, error: queryError } = await query;
        
        if (queryError) throw queryError;
        
        // Calculate metrics manually with correct formula
        const metrics = calculateSalesMetricsManually(rawData || []);
        return metrics;
      }
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
};

export const useDailySales = () => {
  const { filters } = useFilters();
  
  return useQuery({
    queryKey: ['dailySales', filters],
    queryFn: async () => {
      console.log('=== DAILY SALES DEBUG ===');
      console.log('Filters:', filters);
      console.log('Formatted dates:', {
        from: formatMoscowDate(filters.dateFrom),
        to: formatMoscowDate(filters.dateTo)
      });
      
      let query = supabase
        .from('vw_daily_sales_by_date_type')
        .select('*')
        .eq('date_type', filters.dateType)
        .gte('date_msk', formatMoscowDate(filters.dateFrom))
        .lte('date_msk', formatMoscowDate(filters.dateTo))
        .order('date_msk');

      const { data, error } = await query;

      console.log('Daily Sales Query Result:', { data, error });
      
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