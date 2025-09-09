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
  sales: number; // OperationMarketplaceSale
  commissions: number; // OperationMarketplaceServiceItemCommission  
  delivery: number; // OperationMarketplaceServiceItemFBSDelivery
  ads: number; // OperationMarketplaceMarketingActionCost
  services: number; // OperationAgentPerformedService
  acquiring: number; // Other financial operations
  totalIncome: number;
  totalExpenses: number;
  netProfit: number; // Now calculated properly
}

export interface FinanceBreakdownItem {
  date: string;
  posting: string;
  operation_type: string;
  operation_type_name: string;
  accruals_for_sale: number;
  sale_commission: number;
  amount: number;
}

const CATEGORY_COLORS = {
  sales: '#10b981',     // green
  commissions: '#ef4444', // red
  delivery: '#f59e0b',    // amber
  ads: '#06b6d4',         // cyan
  services: '#84cc16',    // lime
  acquiring: '#f97316',   // orange
};

const CATEGORY_LABELS = {
  sales: 'Продажи',
  commissions: 'Комиссии',
  delivery: 'Доставка',
  ads: 'Реклама',
  services: 'Агентские',
  acquiring: 'Эквайринг',
};

export const useFinanceData = () => {
  const { filters } = useFilters();
  
  return useQuery({
    queryKey: ['finance', filters],
    queryFn: async () => {
      console.log('=== FINANCE HOOK EXECUTION (ТЗ: accruals_for_sale + amount by operation_type) ===');
      console.log('Filters received:', filters);
      console.log('Formatted dates:', {
        from: formatMoscowDate(filters.dateFrom),
        to: formatMoscowDate(filters.dateTo)
      });
      
      try {
        // Check if it's a single day period
        const isSingleDay = filters.dateFrom.toDateString() === filters.dateTo.toDateString();
        console.log('Is single day period:', isSingleDay);
        
        // Query finance_transactions table directly (согласно ТЗ)
        let transactionsData: any[] | null = null;
        let transactionsError: any = null;
        
        if (isSingleDay) {
          const singleDayDate = formatMoscowDate(filters.dateFrom);
          const nextDayDate = formatMoscowDate(new Date(filters.dateFrom.getTime() + 24 * 60 * 60 * 1000));
          console.log('Single day date range:', { from: singleDayDate, to: nextDayDate });
          
          const { data: singleDayData, error: singleDayError } = await supabase
            .from('finance_transactions')
            .select('*')
            .gte('operation_date', singleDayDate)
            .lt('operation_date', nextDayDate);
          
          transactionsData = singleDayData;
          transactionsError = singleDayError;
        } else {
          const fromDate = formatMoscowDate(filters.dateFrom);
          const toDateInclusive = formatMoscowDate(new Date(filters.dateTo.getTime() + 24 * 60 * 60 * 1000));
          console.log('Multi-day date range:', { from: fromDate, to: toDateInclusive });
          
          const { data: rangeData, error: rangeError } = await supabase
            .from('finance_transactions')
            .select('*')
            .gte('operation_date', fromDate)
            .lt('operation_date', toDateInclusive);
          
          transactionsData = rangeData;
          transactionsError = rangeError;
        }
        
        console.log('finance_transactions query result:', { data: transactionsData, error: transactionsError });
        
        if (transactionsError) {
          throw transactionsError;
        }
        
        if (!transactionsData || transactionsData.length === 0) {
          console.log('No financial transactions found for the period');
          return {
            summary: {
              sales: 0,
              commissions: 0,
              delivery: 0,
              ads: 0,
              services: 0,
              acquiring: 0,
              totalIncome: 0,
              totalExpenses: 0,
              netProfit: 0,
            },
            categories: []
          };
        }
        
        // Log unique operation types for debugging
        const uniqueOperationTypes = [...new Set(transactionsData.map((t: any) => t.operation_type))].filter(Boolean);
        console.log('Found operation_types in finance_transactions:', uniqueOperationTypes);
        
        // Calculate financial metrics according to ТЗ specification + clarifications
        let sales = 0;          // Выручка = Σ accruals_for_sale
        let commissions = 0;    // Комиссия = Σ sale_commission  
        let delivery = 0;       // Доставка/Логистика = Σ amount - (Σ accruals_for_sale + Σ sale_commission) для операций доставки
        let acquiring = 0;      // Эквайринг = Σ amount по MarketplaceRedistributionOfAcquiringOperation
        let ads = 0;           // Реклама = Σ amount по рекламным операциям
        let services = 0;      // Агентские = Σ amount по OperationAgent*
        let netProfit = 0;     // Чистая прибыль = Σ amount по всем операциям
        
        // Temporary variables for delivery calculation
        let deliveryAccruals = 0;
        let deliveryCommissions = 0;
        let deliveryAmounts = 0;
        
        // Process each transaction according to ТЗ rules + field explanations
        transactionsData.forEach((transaction: any) => {
          const operationType = transaction.operation_type || '';
          const amount = toNumber(transaction.amount || 0);
          const accrualsForSale = toNumber(transaction.accruals_for_sale || 0);
          const saleCommission = toNumber(transaction.sale_commission || 0);
          
          // Чистая прибыль = сумма всех amount
          netProfit += amount;
          
          // Выручка = сумма accruals_for_sale (только по операциям доставки покупателю)
          if (operationType === 'OperationAgentDeliveredToCustomer') {
            sales += accrualsForSale;
            // Комиссия = сумма sale_commission (отрицательная)
            commissions += Math.abs(saleCommission); // берем модуль для отображения как расход
            
            // Для расчета доставки/логистики: amount - (accruals_for_sale + sale_commission)
            deliveryAccruals += accrualsForSale;
            deliveryCommissions += saleCommission;
            deliveryAmounts += amount;
          }
          
          // Эквайринг = сумма amount по MarketplaceRedistributionOfAcquiringOperation
          else if (operationType === 'MarketplaceRedistributionOfAcquiringOperation') {
            acquiring += Math.abs(amount);
          }
          // Реклама = сумма amount по рекламным операциям (расширенный список)
          else if (operationType === 'OperationMarketplaceMarketingActionCost' ||
                   operationType === 'OperationPromotionWithCostPerOrder' ||
                   operationType === 'OperationElectronicServiceStencil' ||
                   operationType === 'OperationGettingToTheTop') {
            ads += Math.abs(amount);
          }
          // Агентские услуги = OperationAgent* (кроме уже учтенных в доставке)
          else if (operationType.startsWith('OperationAgent') && 
                   operationType !== 'OperationAgentDeliveredToCustomer') {
            services += Math.abs(amount);
          }
          // Прочие доставочные операции
          else if (operationType === 'OperationMarketplaceServiceItemFBSDelivery' ||
                   operationType === 'OperationAgentPerformedService') {
            services += Math.abs(amount); // Относим к агентским услугам
          }
        });
        
        // Доставка/Логистика = amount - (accruals_for_sale + sale_commission) для операций доставки
        delivery = Math.abs(deliveryAmounts - (deliveryAccruals + deliveryCommissions));
        
        // Для совместимости с существующим интерфейсом
        const totalIncome = sales;
        const totalExpenses = commissions + delivery + acquiring + ads + services;
        
        console.log('Financial calculations per ТЗ specification:', {
          sales: `${sales} (from accruals_for_sale)`,
          commissions: `${commissions} (from sale_commission)`,
          delivery: `${delivery} (from amount - delivery operations)`,
          acquiring: `${acquiring} (from amount - acquiring operations)`,
          ads: `${ads} (from amount - marketing operations)`,
          services: `${services} (from amount - agent operations)`,
          netProfit: `${netProfit} (from sum of all amounts)`,
          totalIncome,
          totalExpenses
        });
        
        const summary: FinanceSummary = {
          sales,
          commissions,
          delivery,
          ads,
          services,
          acquiring,
          totalIncome,
          totalExpenses,
          netProfit
        };
        
        // Create categories for pie chart (включаем все категории с данными)
        const categoryData = { 
          sales, 
          commissions, 
          delivery, 
          ads, 
          services, 
          acquiring 
        };
        
        const categories: FinanceCategory[] = Object.entries(categoryData)
          .filter(([, value]) => value > 0)
          .map(([key, amount]) => ({
            category: CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS] || key,
            amount,
            percentage: (totalIncome + totalExpenses) > 0 ? Math.round((amount / (totalIncome + totalExpenses)) * 100) : 0,
            color: CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS] || '#cccccc'
          }))
          .sort((a, b) => b.amount - a.amount);
        
        return { summary, categories };
        
      } catch (error) {
        console.error('Error in finance data fetching:', error);
        return {
          summary: {
            sales: 0,
            commissions: 0,
            delivery: 0,
            ads: 0,
            services: 0,
            acquiring: 0,
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
      try {
        const isSingleDay = filters.dateFrom.toDateString() === filters.dateTo.toDateString();
        
        let transactionsData: any[] | null = null;
        
        if (isSingleDay) {
          const singleDayDate = formatMoscowDate(filters.dateFrom);
          const nextDayDate = formatMoscowDate(new Date(filters.dateFrom.getTime() + 24 * 60 * 60 * 1000));
          
          const { data } = await supabase
            .from('finance_transactions')
            .select('*')
            .gte('operation_date', singleDayDate)
            .lt('operation_date', nextDayDate)
            .order('operation_date', { ascending: false });
          
          transactionsData = data;
        } else {
          const fromDate = formatMoscowDate(filters.dateFrom);
          const toDateInclusive = formatMoscowDate(new Date(filters.dateTo.getTime() + 24 * 60 * 60 * 1000));
          
          const { data } = await supabase
            .from('finance_transactions')
            .select('*')
            .gte('operation_date', fromDate)
            .lt('operation_date', toDateInclusive)
            .order('operation_date', { ascending: false });
          
          transactionsData = data;
        }
        
        if (!transactionsData || transactionsData.length === 0) {
          return [];
        }
        
        // Transform data for breakdown table according to ТЗ: operation_date, operation_type_name, posting_number, accruals_for_sale, sale_commission, amount
        const breakdownData: FinanceBreakdownItem[] = transactionsData.map((transaction: any) => ({
          date: formatMoscowDate(new Date(transaction.operation_date)),
          posting: transaction.posting_number || '',
          operation_type: transaction.operation_type || '',
          operation_type_name: transaction.operation_type_name || '',
          accruals_for_sale: toNumber(transaction.accruals_for_sale || 0),
          sale_commission: toNumber(transaction.sale_commission || 0),
          amount: toNumber(transaction.amount || 0),
        }));
        
        return breakdownData;
        
      } catch (error) {
        console.error('Error in finance breakdown fetching:', error);
        return [];
      }
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
};