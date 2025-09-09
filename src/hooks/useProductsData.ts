import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFilters } from './useFilters';
import { formatMoscowDate } from '../lib/date-utils';
import { toNumber } from '../lib/format';
import { useState } from 'react';

export interface ProductPerformance {
  sku: number;
  offer_id: string;
  product_name: string;
  orders: number;
  units: number;
  gmv: number;
  revenue: number;
  commissions: number;
  netProfit: number | null; // Temporarily null as requested
  avgPrice: number;
}

export interface ProductsTableState {
  page: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const transformProductData = (item: any): ProductPerformance => ({
  sku: toNumber(item.sku),
  offer_id: item.offer_id || '',
  product_name: item.product_name || '',
  orders: toNumber(item.delivered_orders),
  units: toNumber(item.delivered_units),
  gmv: toNumber(item.delivered_gmv),
  revenue: toNumber(item.delivered_revenue),
  commissions: Math.abs(toNumber(item.delivered_commissions)),
  netProfit: null, // Temporarily disabled - will be implemented later
  avgPrice: toNumber(item.avg_price),
});

export const useProductsTable = () => {
  const [tableState, setTableState] = useState<ProductsTableState>({
    page: 0,
    pageSize: 20,
    search: '',
    sortBy: 'revenue',
    sortOrder: 'desc',
  });

  const updateTableState = (updates: Partial<ProductsTableState>) => {
    setTableState(prev => ({ ...prev, ...updates }));
  };

  return {
    tableState,
    updateTableState,
  };
};

export const useProductsData = (tableState: ProductsTableState) => {
  const { filters } = useFilters();
  
  return useQuery({
    queryKey: ['products', filters, tableState],
    queryFn: async () => {
      // Get total count first
      const { data: countData, error: countError } = await supabase.rpc('get_products_metrics', {
        start_date: formatMoscowDate(filters.dateFrom),
        end_date: formatMoscowDate(filters.dateTo),
        date_type: filters.dateType,
        sku_filter: filters.sku ? parseInt(filters.sku) : null,
        region_filter: filters.region || null,
      });
      
      if (countError) throw countError;
      
      const totalCount = toNumber(countData?.[0]?.total_products) || 0;
      
      // Get paginated data
      const { data, error } = await supabase.rpc('get_products_performance', {
        start_date: formatMoscowDate(filters.dateFrom),
        end_date: formatMoscowDate(filters.dateTo),
        date_type: filters.dateType,
        sku_filter: filters.sku ? parseInt(filters.sku) : null,
        region_filter: filters.region || null,
        search_term: tableState.search || null,
        sort_by: tableState.sortBy === 'netProfit' ? 'revenue' : tableState.sortBy,
        sort_order: tableState.sortOrder,
        page_offset: tableState.page * tableState.pageSize,
        page_size: tableState.pageSize,
      });

      if (error) throw error;

      const transformedData = (data || []).map(transformProductData);

      return {
        data: transformedData,
        totalCount,
        totalPages: Math.ceil(totalCount / tableState.pageSize),
      };
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
};

export const useProductsMetrics = () => {
  const { filters } = useFilters();
  
  return useQuery({
    queryKey: ['productsMetrics', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_products_metrics', {
        start_date: formatMoscowDate(filters.dateFrom),
        end_date: formatMoscowDate(filters.dateTo),
        date_type: filters.dateType,
        sku_filter: filters.sku ? parseInt(filters.sku) : null,
        region_filter: filters.region || null,
      });

      if (error) throw error;
      
      const result = data?.[0] || {
        total_products: 0,
        total_revenue: 0,
        total_units: 0,
        total_orders: 0,
        avg_revenue_per_product: 0,
      };

      return {
        totalProducts: toNumber(result.total_products),
        totalRevenue: toNumber(result.total_revenue),
        totalUnits: toNumber(result.total_units),
        totalOrders: toNumber(result.total_orders),
        avgRevenuePerProduct: toNumber(result.avg_revenue_per_product),
      };
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
};