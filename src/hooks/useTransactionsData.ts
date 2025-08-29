import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFilters } from './useFilters';
import { formatMoscowDate } from '../lib/date-utils';
import { toNumber } from '../lib/format';
import { useState } from 'react';

export interface TransactionDetail {
  transaction_id: number;
  operation_date_msk: string;
  posting_number: string;
  operation_type: string;
  operation_type_name: string;
  type: string;
  amount: number;
  accruals_for_sale: number;
  sale_commission: number;
  delivery_charge: number;
  return_delivery_charge: number;
  warehouse_id: number;
  service_name: string;
  service_price: number;
  item_sku: number;
  item_name: string;
  category: string;
}

export interface TransactionsTableState {
  page: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  categoryFilter: string;
}

const transformTransactionData = (item: any): TransactionDetail => ({
  transaction_id: toNumber(item.transaction_id),
  operation_date_msk: item.operation_date_msk || '',
  posting_number: item.posting_number || '',
  operation_type: item.operation_type || '',
  operation_type_name: item.operation_type_name || '',
  type: item.type || '',
  amount: toNumber(item.amount),
  accruals_for_sale: toNumber(item.accruals_for_sale),
  sale_commission: toNumber(item.sale_commission),
  delivery_charge: toNumber(item.delivery_charge),
  return_delivery_charge: toNumber(item.return_delivery_charge),
  warehouse_id: toNumber(item.warehouse_id),
  service_name: item.service_name || '',
  service_price: toNumber(item.service_price),
  item_sku: toNumber(item.item_sku),
  item_name: item.item_name || '',
  category: item.category || 'other',
});

export const useTransactionsTable = () => {
  const [tableState, setTableState] = useState<TransactionsTableState>({
    page: 0,
    pageSize: 25,
    search: '',
    sortBy: 'operation_date_msk',
    sortOrder: 'desc',
    categoryFilter: '',
  });

  const updateTableState = (updates: Partial<TransactionsTableState>) => {
    setTableState(prev => ({ ...prev, ...updates }));
  };

  return {
    tableState,
    updateTableState,
  };
};

export const useTransactionsData = (tableState: TransactionsTableState) => {
  const { filters } = useFilters();
  
  return useQuery({
    queryKey: ['transactions', filters, tableState],
    queryFn: async () => {
      let query = supabase
        .from('vw_transaction_details')
        .select('*', { count: 'exact' })
        .gte('operation_date_msk', formatMoscowDate(filters.dateFrom))
        .lte('operation_date_msk', formatMoscowDate(filters.dateTo));

      // Apply search filter
      if (tableState.search) {
        query = query.or(`posting_number.ilike.%${tableState.search}%,operation_type_name.ilike.%${tableState.search}%,service_name.ilike.%${tableState.search}%,item_name.ilike.%${tableState.search}%`);
      }

      // Apply category filter
      if (tableState.categoryFilter) {
        query = query.eq('category', tableState.categoryFilter);
      }

      // Apply SKU filter from global filters
      if (filters.sku) {
        query = query.eq('item_sku', parseInt(filters.sku));
      }

      // Apply region filter (need to join with postings)
      if (filters.region) {
        const { data: postings } = await supabase
          .from('postings_fbs')
          .select('posting_number')
          .ilike('cluster_to', `%${filters.region}%`);
        
        if (postings && postings.length > 0) {
          const postingNumbers = postings.map(p => p.posting_number).filter(Boolean);
          if (postingNumbers.length > 0) {
            query = query.in('posting_number', postingNumbers);
          }
        }
      }

      // Apply sorting
      query = query.order(tableState.sortBy, { ascending: tableState.sortOrder === 'asc' });

      // Apply pagination
      const from = tableState.page * tableState.pageSize;
      const to = from + tableState.pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const transformedData = (data || []).map(transformTransactionData);

      return {
        data: transformedData,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / tableState.pageSize),
      };
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
};

export const useTransactionCategories = () => {
  return useQuery({
    queryKey: ['transactionCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_transaction_details')
        .select('category')
        .not('category', 'is', null);
      
      if (error) throw error;
      
      const categories = [...new Set((data || []).map(item => item.category))]
        .filter(Boolean)
        .sort();
      
      return categories;
    },
  });
};

export const CATEGORY_LABELS: Record<string, string> = {
  sales: 'Продажи',
  commissions: 'Комиссии',
  delivery: 'Доставка',
  returns: 'Возвраты',
  ads: 'Реклама',
  services: 'Услуги',
  other: 'Прочее',
};