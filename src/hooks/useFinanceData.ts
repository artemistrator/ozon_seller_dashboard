import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFilters } from './useFilters';
import { formatMoscowDate } from '../lib/date-utils';
import { toNumber } from '../lib/format';

// Remove alternative Supabase client - use main client
// const supabaseAlt = createClient(
//   import.meta.env.VITE_SUPABASE_ALT_URL || '',
//   import.meta.env.VITE_SUPABASE_ALT_ANON_KEY || ''
// );

export interface FinanceCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface FinanceSummary {
  sales: number;
  commissions: number;
  delivery: number;
  returns: number;
  ads: number;
  services: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

export interface FinanceBreakdownItem {
  date_msk: string;
  posting_number: string;
  sales: number;
  commissions: number;
  delivery: number;
  returns: number;
  ads: number;
  services: number;
  net_profit: number;
  operation_type: string;
}

const CATEGORY_COLORS = {
  sales: '#10b981',     // green
  commissions: '#ef4444', // red
  delivery: '#f59e0b',    // amber
  returns: '#8b5cf6',     // violet
  ads: '#06b6d4',         // cyan
  services: '#84cc16',    // lime
};

const CATEGORY_LABELS = {
  sales: 'Продажи',
  commissions: 'Комиссии',
  delivery: 'Доставка',
  returns: 'Возвраты',
  ads: 'Реклама',
  services: 'Услуги',
};

export const useFinanceData = () => {
  const { filters } = useFilters();
  
  return useQuery({
    queryKey: ['finance', filters],
    queryFn: async () => {
      console.log('=== FINANCE HOOK EXECUTION ===');
      console.log('Filters received:', filters);
      console.log('Formatted dates:', {
        from: formatMoscowDate(filters.dateFrom),
        to: formatMoscowDate(filters.dateTo)
      });
      
      try {
        // Use RPC function for finance data
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_finance_summary', {
          start_date: formatMoscowDate(filters.dateFrom),
          end_date: formatMoscowDate(filters.dateTo),
          date_type: filters.dateType,
          sku_filter: filters.sku ? parseInt(filters.sku) : null,
          region_filter: filters.region || null,
        });
        
        if (rpcError) {
          console.error('RPC function error:', rpcError);
          throw rpcError;
        }
        
        if (!rpcData || rpcData.length === 0) {
          console.log('No data from RPC function');
          // Return empty data instead of sample data
          return {
            summary: {
              sales: 0,
              commissions: 0,
              delivery: 0,
              returns: 0,
              ads: 0,
              services: 0,
              totalIncome: 0,
              totalExpenses: 0,
              netProfit: 0,
            },
            categories: []
          };
        }
        
        console.log('Using RPC function data:', rpcData);
        
        const item = rpcData[0];
        const summary: FinanceSummary = {
          sales: toNumber(item.sales),
          commissions: toNumber(item.commissions),
          delivery: toNumber(item.delivery),
          returns: toNumber(item.returns),
          ads: toNumber(item.ads),
          services: toNumber(item.services),
          totalIncome: toNumber(item.total_income),
          totalExpenses: toNumber(item.total_expenses),
          netProfit: toNumber(item.net_profit),
        };
        
        // Calculate category data for the pie chart
        const categoryData = {
          sales: toNumber(item.sales),
          commissions: toNumber(item.commissions),
          delivery: toNumber(item.delivery),
          returns: toNumber(item.returns),
          ads: toNumber(item.ads),
          services: toNumber(item.services),
        };
        
        const categories: FinanceCategory[] = Object.entries(categoryData)
          .filter(([, value]) => value > 0)
          .map(([key, amount]) => ({
            category: CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS] || key,
            amount,
            percentage: summary.totalIncome > 0 ? Math.round((amount / summary.totalIncome) * 100) : 0,
            color: CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS] || '#cccccc'
          }))
          .sort((a, b) => b.amount - a.amount);
        
        return { summary, categories };
        
      } catch (error) {
        console.error('Error in finance data fetching:', error);
        // Return empty data instead of sample data
        return {
          summary: {
            sales: 0,
            commissions: 0,
            delivery: 0,
            returns: 0,
            ads: 0,
            services: 0,
            totalIncome: 0,
            totalExpenses: 0,
            netProfit: 0,
          },
          categories: []
        };
      }
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
};

export const useFinanceBreakdown = () => {
  const { filters } = useFilters();
  
  return useQuery({
    queryKey: ['financeBreakdown', filters],
    queryFn: async () => {
      console.log('=== FINANCE BREAKDOWN EXECUTION ===');
      console.log('Filters received:', filters);
      
      try {
        // Try to get detailed breakdown data from RPC function
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_finance_summary', {
          start_date: formatMoscowDate(filters.dateFrom),
          end_date: formatMoscowDate(filters.dateTo),
          date_type: filters.dateType,
          sku_filter: filters.sku ? parseInt(filters.sku) : null,
          region_filter: filters.region || null,
        });
        
        if (!rpcError && rpcData && rpcData.length > 0) {
          console.log('Using RPC function for breakdown');
          const item = rpcData[0];
          
          return [{
            date_msk: formatMoscowDate(filters.dateFrom),
            posting_number: 'SUMMARY',
            sales: toNumber(item.sales),
            commissions: toNumber(item.commissions),
            delivery: toNumber(item.delivery),
            returns: toNumber(item.returns),
            ads: toNumber(item.ads),
            services: toNumber(item.services),
            net_profit: toNumber(item.net_profit),
            operation_type: 'Сводка',
          }];
        }
        
        // If RPC fails, return empty data
        console.log('Breakdown data fetch failed, returning empty data');
        return [];
        
      } catch (error) {
        console.error('Error in finance breakdown fetching:', error);
        return [];
      }
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
};