import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFilters } from './useFilters';
import { formatMoscowDate } from '../lib/date-utils';
import { toNumber } from '../lib/format';
import { useState } from 'react';

export interface TransactionDetail {
  transaction_id: number;
  operation_date: string; // operation_date
  posting_number: string; // posting_number
  operation_type: string; // operation_type 
  operation_type_name: string; // operation_type_name
  accruals_for_sale: number; // accruals_for_sale
  sale_commission: number; // sale_commission
  amount: number; // amount
  category: string; // категория по ТЗ
}

export interface TransactionsTableState {
  page: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const transformTransactionData = (item: any): TransactionDetail => {
  // Helper function to categorize operation based on operation_type per ТЗ + уточнения
  const categorizeOperation = (operationType: string): string => {
    if (operationType === 'OperationAgentDeliveredToCustomer') {
      return 'продажи/доставка/комиссия';
    } else if (operationType === 'MarketplaceRedistributionOfAcquiringOperation') {
      return 'эквайринг';
    } else if (operationType === 'OperationMarketplaceMarketingActionCost' ||
               operationType === 'OperationPromotionWithCostPerOrder' ||
               operationType === 'OperationElectronicServiceStencil' ||
               operationType === 'OperationGettingToTheTop') {
      return 'реклама';
    } else if (operationType.startsWith('OperationAgent')) {
      return 'агентские';
    } else if (operationType === 'OperationMarketplaceServiceItemFBSDelivery') {
      return 'агентские';
    } else {
      return 'прочее';
    }
  };
  
  return {
    transaction_id: toNumber(item.transaction_id),
    operation_date: item.operation_date || '',
    posting_number: item.posting_number || '',
    operation_type: item.operation_type || '',
    operation_type_name: item.operation_type_name || '',
    accruals_for_sale: toNumber(item.accruals_for_sale || 0),
    sale_commission: toNumber(item.sale_commission || 0),
    amount: toNumber(item.amount),
    category: categorizeOperation(item.operation_type || ''),
  };
};

export const useTransactionsTable = () => {
  const [tableState, setTableState] = useState<TransactionsTableState>({
    page: 0,
    pageSize: 25,
    search: '',
    sortBy: 'operation_date',
    sortOrder: 'desc',
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
      console.log('=== TRANSACTIONS DATA EXECUTION (finance_transactions) ===');
      console.log('Filters received:', filters);
      
      try {
        // Check if it's a single day period
        const isSingleDay = filters.dateFrom.toDateString() === filters.dateTo.toDateString();
        
        // Build base query using finance_transactions for consistency with finance page
        let query = supabase
          .from('finance_transactions')
          .select('*', { count: 'exact' });
        
        // Apply date filters
        if (isSingleDay) {
          const singleDayDate = formatMoscowDate(filters.dateFrom);
          const nextDayDate = formatMoscowDate(new Date(filters.dateFrom.getTime() + 24 * 60 * 60 * 1000));
          query = query.gte('operation_date', singleDayDate).lt('operation_date', nextDayDate);
        } else {
          const fromDate = formatMoscowDate(filters.dateFrom);
          const toDateInclusive = formatMoscowDate(new Date(filters.dateTo.getTime() + 24 * 60 * 60 * 1000));
          query = query.gte('operation_date', fromDate).lt('operation_date', toDateInclusive);
        }

        // Apply search filter
        if (tableState.search) {
          query = query.or(`posting_number.ilike.%${tableState.search}%,operation_type.ilike.%${tableState.search}%,operation_type_name.ilike.%${tableState.search}%`);
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
      } catch (error) {
        console.error('Error in transactions data fetching:', error);
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
        };
      }
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
};
