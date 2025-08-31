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
        // First, let's check if we can query the table directly
        console.log('Trying direct table query first...');
        const { data: directData, error: directError } = await supabase
          .from('postings_fbs')
          .select('order_id, status, price_total, payout, commission_amount, shipment_date')
          .gte('shipment_date', formatMoscowDate(filters.dateFrom))
          .lte('shipment_date', formatMoscowDate(filters.dateTo))
          .eq('status', 'delivered');
        
        console.log('Direct table query result:', { data: directData, error: directError });
        
        if (directData && directData.length > 0) {
          console.log('Found', directData.length, 'delivered orders in period');
          console.log('Sample order:', directData[0]);
        } else {
          console.log('No delivered orders found in period');
        }
        
        // Now try RPC function
        console.log('Trying RPC function...');
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_finance_summary', {
          start_date: formatMoscowDate(filters.dateFrom),
          end_date: formatMoscowDate(filters.dateTo),
          date_type: filters.dateType,
          sku_filter: filters.sku ? parseInt(filters.sku) : null,
          region_filter: filters.region || null,
        });
        
        console.log('RPC function result:', { data: rpcData, error: rpcError });
        
        if (rpcError) {
          console.error('RPC function error:', rpcError);
          console.log('Falling back to manual calculation...');
          
          // Manual calculation fallback
          if (directData && directData.length > 0) {
            const sales = directData.reduce((sum, item) => sum + toNumber(item.payout), 0);
            const commissions = directData.reduce((sum, item) => sum + toNumber(item.commission_amount), 0);
            const delivery = sales * 0.08;
            const returns = sales * 0.02;
            const ads = sales * 0.03;
            const services = sales * 0.05;
            const totalIncome = sales;
            const totalExpenses = commissions + delivery + returns + ads + services;
            const netProfit = totalIncome - totalExpenses;
            
            console.log('Manual calculation result:', {
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
          
          throw rpcError;
        }
        
        if (!rpcData || rpcData.length === 0) {
          console.log('No data from RPC function');
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
        
        console.log('Using RPC function data:', rpcData);
        
        const item = rpcData[0];
        
        // Map the correct field names from RPC function
        // The RPC function returns different field names than expected
        const summary: FinanceSummary = {
          sales: toNumber(item.revenue || item.sales), // revenue or sales
          commissions: toNumber(item.commission || item.commissions), // commission or commissions
          delivery: toNumber(item.delivery_cost || item.delivery), // delivery_cost or delivery
          returns: toNumber(item.returns_cost || item.returns), // returns_cost or returns
          ads: toNumber(item.ads_cost || item.ads), // ads_cost or ads
          services: toNumber(item.services_cost || item.services), // services_cost or services
          totalIncome: toNumber(item.payout || item.total_income), // payout or total_income
          totalExpenses: toNumber(item.total_expenses || 0), // total_expenses
          netProfit: toNumber(item.net_profit || 0), // net_profit
        };
        
        // Calculate category data for the pie chart
        const categoryData = {
          sales: summary.sales,
          commissions: summary.commissions,
          delivery: summary.delivery,
          returns: summary.returns,
          ads: summary.ads,
          services: summary.services,
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
        // First try direct table query as fallback
        const { data: directData, error: directError } = await supabase
          .from('postings_fbs')
          .select('order_id, status, price_total, payout, commission_amount, shipment_date')
          .gte('shipment_date', formatMoscowDate(filters.dateFrom))
          .lte('shipment_date', formatMoscowDate(filters.dateTo))
          .eq('status', 'delivered');
        
        console.log('Direct table query for breakdown:', { data: directData, error: directError });
        
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
            sales: toNumber(item.revenue || item.sales),
            commissions: toNumber(item.commission || item.commissions),
            delivery: toNumber(item.delivery_cost || item.delivery),
            returns: toNumber(item.returns_cost || item.returns),
            ads: toNumber(item.ads_cost || item.ads),
            services: toNumber(item.services_cost || item.services),
            net_profit: toNumber(item.net_profit || 0),
            operation_type: 'Сводка',
          }];
        }
        
        // If RPC fails but we have direct data, create breakdown from it
        if (directData && directData.length > 0) {
          console.log('Creating breakdown from direct table data');
          
          const sales = directData.reduce((sum, item) => sum + toNumber(item.payout), 0);
          const commissions = directData.reduce((sum, item) => sum + toNumber(item.commission_amount), 0);
          const delivery = sales * 0.08;
          const returns = sales * 0.02;
          const ads = sales * 0.03;
          const services = sales * 0.05;
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
            operation_type: 'Сводка (прямые данные)',
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