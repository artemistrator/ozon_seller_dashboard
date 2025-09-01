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
        // First, let's check if we can query the existing tables directly
        console.log('Trying direct table query first...');
        
        // Query postings_fbs table for delivered orders (same as useSalesData)
        const { data: postingsData, error: postingsError } = await supabase
          .from('postings_fbs')
          .select('order_id, quantity, price_total, payout, commission_amount, status, in_process_at, shipment_date, delivering_date')
          .gte(filters.dateType, formatMoscowDate(filters.dateFrom))
          .lte(filters.dateType, formatMoscowDate(filters.dateTo))
          .eq('status', 'delivered');
        
        console.log('Postings_fbs table query result:', { data: postingsData, error: postingsError });
        
        // Query vw_transaction_details table for financial data (same as useTransactionsData)
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('vw_transaction_details')
          .select('*')
          .gte('operation_date_msk', formatMoscowDate(filters.dateFrom))
          .lte('operation_date_msk', formatMoscowDate(filters.dateTo));
        
        console.log('vw_transaction_details query result:', { data: transactionsData, error: transactionsError });
        
        if (postingsData && postingsData.length > 0) {
          console.log('Found', postingsData.length, 'delivered orders in period');
          console.log('Sample order:', postingsData[0]);
        } else {
          console.log('No delivered orders found in period');
        }
        
        // Check if it's a single day period
        const isSingleDay = filters.dateFrom.toDateString() === filters.dateTo.toDateString();
        console.log('Is single day period:', isSingleDay);
        
        // Calculate finance data from existing tables
        if (postingsData && postingsData.length > 0) {
          console.log('Calculating finance data from existing tables...');
          
          // Calculate sales (payout from delivered orders)
          const sales = postingsData.reduce((sum, item) => {
            const payout = toNumber(item.payout) || 0;
            const quantity = toNumber(item.quantity) || 1;
            return sum + (payout * quantity);
          }, 0);
          
          // Calculate commissions
          const commissions = postingsData.reduce((sum, item) => {
            const commission = toNumber(item.commission_amount) || 0;
            const quantity = toNumber(item.quantity) || 1;
            return sum + (commission * quantity);
          }, 0);
          
          // Calculate delivery costs (estimate 8% of sales)
          const delivery = sales * 0.08;
          
          // Calculate returns (estimate 2% of sales)
          const returns = sales * 0.02;
          
          // Calculate ads costs (estimate 3% of sales)
          const ads = sales * 0.03;
          
          // Calculate services costs from vw_transaction_details
          let services = 0;
          if (transactionsData && transactionsData.length > 0) {
            // Filter for service transactions
            const serviceTransactions = transactionsData.filter((t: any) => 
              t.category === 'services' || t.operation_type_name?.toLowerCase().includes('service')
            );
            services = serviceTransactions.reduce((sum, t: any) => sum + toNumber(t.amount || 0), 0);
          }
          
          const totalIncome = sales;
          const totalExpenses = commissions + delivery + returns + ads + services;
          const netProfit = totalIncome - totalExpenses;
          
          console.log('Calculated finance data:', {
            sales, commissions, delivery, returns, ads, services,
            totalIncome, totalExpenses, netProfit
          });
          
          const summary: FinanceSummary = {
            sales, commissions, delivery, returns, ads, services,
            totalIncome, totalExpenses, netProfit
          };
          
          const categoryData = { sales, commissions, delivery, returns, ads, services };
          const categories: FinanceCategory[] = Object.entries(categoryData)
            .filter(([, value]) => value > 0)
            .map(([key, amount]) => ({
              category: CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS] || key,
              amount,
              percentage: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0,
              color: CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS] || '#cccccc'
            }))
            .sort((a, b) => b.amount - a.amount);
          
          return { summary, categories };
        }
        
        // If no data from existing tables, return empty data
        console.log('No data available from existing tables');
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
        
      } catch (error) {
        console.error('Error in finance data fetching:', error);
        // Return empty data
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
        // Query existing tables for breakdown data
        const { data: postingsData, error: postingsError } = await supabase
          .from('postings_fbs')
          .select('order_id, quantity, price_total, payout, commission_amount, status, in_process_at, shipment_date, delivering_date')
          .gte(filters.dateType, formatMoscowDate(filters.dateFrom))
          .lte(filters.dateType, formatMoscowDate(filters.dateTo))
          .eq('status', 'delivered');
        
        console.log('Postings_fbs table for breakdown:', { data: postingsData, error: postingsError });
        
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('vw_transaction_details')
          .select('*')
          .gte('operation_date_msk', formatMoscowDate(filters.dateFrom))
          .lte('operation_date_msk', formatMoscowDate(filters.dateTo));
        
        console.log('vw_transaction_details for breakdown:', { data: transactionsData, error: transactionsError });
        
        // Check if it's a single day period
        const isSingleDay = filters.dateFrom.toDateString() === filters.dateTo.toDateString();
        console.log('Is single day period for breakdown:', isSingleDay);
        
        // Create breakdown from existing table data
        if (postingsData && postingsData.length > 0) {
          console.log('Creating breakdown from existing table data');
          
          // Calculate finance metrics
          const sales = postingsData.reduce((sum, item) => {
            const payout = toNumber(item.payout) || 0;
            const quantity = toNumber(item.quantity) || 1;
            return sum + (payout * quantity);
          }, 0);
          
          const commissions = postingsData.reduce((sum, item) => {
            const commission = toNumber(item.commission_amount) || 0;
            const quantity = toNumber(item.quantity) || 1;
            return sum + (commission * quantity);
          }, 0);
          
          const delivery = sales * 0.08;
          const returns = sales * 0.02;
          const ads = sales * 0.03;
          
          // Calculate services from vw_transaction_details
          let services = 0;
          if (transactionsData && transactionsData.length > 0) {
            const serviceTransactions = transactionsData.filter((t: any) => 
              t.category === 'services' || t.operation_type_name?.toLowerCase().includes('service')
            );
            services = serviceTransactions.reduce((sum, t: any) => sum + toNumber(t.amount || 0), 0);
          }
          
          const netProfit = sales - (commissions + delivery + returns + ads + services);
          
          return [{
            date_msk: formatMoscowDate(filters.dateFrom),
            posting_number: 'SUMMARY',
            sales,
            commissions,
            delivery,
            returns,
            ads,
            services,
            net_profit: netProfit,
            operation_type: isSingleDay ? 'Сводка (один день)' : 'Сводка (существующие данные)',
          }];
        }
        
        // If no data at all, return empty
        console.log('No data available for breakdown');
        return [];
        
      } catch (error) {
        console.error('Error in finance breakdown fetching:', error);
        return [];
      }
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
};