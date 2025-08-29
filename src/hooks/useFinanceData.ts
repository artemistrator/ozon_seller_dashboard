import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFilters } from './useFilters';
import { formatMoscowDate } from '../lib/date-utils';
import { toNumber } from '../lib/format';

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
      const { data, error } = await supabase.rpc('get_finance_summary', {
        start_date: formatMoscowDate(filters.dateFrom),
        end_date: formatMoscowDate(filters.dateTo),
        date_type: filters.dateType,
        sku_filter: filters.sku ? parseInt(filters.sku) : null,
        region_filter: filters.region || null,
      });

      if (error) throw error;

      // Transform data into summary
      const summary: FinanceSummary = {
        sales: 0,
        commissions: 0,
        delivery: 0,
        returns: 0,
        ads: 0,
        services: 0,
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
      };

      // Process the RPC results
      (data || []).forEach((item: any) => {
        const amount = toNumber(item.amount);
        const category = item.category as keyof typeof summary;
        
        if (category in summary) {
          summary[category] = amount;
        }
      });

      // Calculate totals
      summary.totalIncome = summary.sales;
      summary.totalExpenses = Math.abs(summary.commissions) + 
                            Math.abs(summary.delivery) + 
                            Math.abs(summary.returns) + 
                            Math.abs(summary.ads) + 
                            Math.abs(summary.services);
      summary.netProfit = summary.totalIncome - summary.totalExpenses;

      // Create categories array for pie chart (excluding zero values)
      const categories: FinanceCategory[] = [];
      const total = summary.totalIncome + summary.totalExpenses;
      
      Object.entries(summary).forEach(([key, value]) => {
        if (key in CATEGORY_COLORS && value !== 0) {
          const amount = key === 'sales' ? value : Math.abs(value);
          categories.push({
            category: CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS],
            amount,
            percentage: total > 0 ? (amount / total) * 100 : 0,
            color: CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS],
          });
        }
      });

      return {
        summary,
        categories: categories.sort((a, b) => b.amount - a.amount),
      };
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
};

export const useFinanceBreakdown = () => {
  const { filters } = useFilters();
  
  return useQuery({
    queryKey: ['financeBreakdown', filters],
    queryFn: async () => {
      let query = supabase
        .from('vw_finance_breakdown')
        .select('*')
        .gte('date_msk', formatMoscowDate(filters.dateFrom))
        .lte('date_msk', formatMoscowDate(filters.dateTo))
        .order('date_msk', { ascending: false });

      if (filters.region) {
        // Join with postings to filter by region
        const { data: postings } = await supabase
          .from('postings_fbs')
          .select('posting_number')
          .ilike('cluster_to', `%${filters.region}%`);
        
        if (postings && postings.length > 0) {
          const postingNumbers = postings.map(p => p.posting_number);
          query = query.in('posting_number', postingNumbers);
        }
      }

      const { data, error } = await query.limit(100);
      
      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        sales: toNumber(item.sales),
        commissions: toNumber(item.commissions),
        delivery: toNumber(item.delivery),
        returns: toNumber(item.returns),
        ads: toNumber(item.ads),
        services: toNumber(item.services),
        net_profit: toNumber(item.net_profit),
      }));
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
};