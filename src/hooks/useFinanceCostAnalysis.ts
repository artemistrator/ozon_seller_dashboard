import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFilters } from './useFilters';
import { formatMoscowDate } from '../lib/date-utils';
import { toNumber } from '../lib/format';

export interface FinanceCostAnalysis {
  totalCostPrice: number;
  netProfitAfterCosts: number;    // Выручка - Себестоимость (для совместимости)
  netProfitAfterCostsAndTax: number; // То же + 6% налог (для совместимости)
  totalRevenue: number;
}

// Хук для получения себестоимости товаров из finance_transactions (для вкладки Финансы)
export const useFinanceCostAnalysis = () => {
  const { filters } = useFilters();
  
  return useQuery({
    queryKey: ['financeCostAnalysis', filters],
    queryFn: async (): Promise<FinanceCostAnalysis> => {
      try {
        console.log('=== FINANCE COST ANALYSIS (по товарам из finance_transactions) ===');
        
        const isSingleDay = filters.dateFrom.toDateString() === filters.dateTo.toDateString();
        
        // Получаем товары из finance_transaction_items за период
        let query = supabase
          .from('finance_transaction_items')
          .select(`
            sku,
            name,
            finance_transactions!inner(
              operation_date,
              operation_type,
              operation_type_name,
              accruals_for_sale,
              amount,
              posting_number
            )
          `);
        
        if (isSingleDay) {
          const singleDayDate = formatMoscowDate(filters.dateFrom);
          const nextDayDate = formatMoscowDate(new Date(filters.dateFrom.getTime() + 24 * 60 * 60 * 1000));
          query = query
            .gte('finance_transactions.operation_date', singleDayDate)
            .lt('finance_transactions.operation_date', nextDayDate);
        } else {
          const fromDate = formatMoscowDate(filters.dateFrom);
          const toDateInclusive = formatMoscowDate(new Date(filters.dateTo.getTime() + 24 * 60 * 60 * 1000));
          query = query
            .gte('finance_transactions.operation_date', fromDate)
            .lt('finance_transactions.operation_date', toDateInclusive);
        }
        
        const { data: financeItems, error: financeItemsError } = await query;
        
        if (financeItemsError) throw financeItemsError;
        
        console.log('Finance items found:', financeItems?.length || 0);
        
        if (!financeItems || financeItems.length === 0) {
          return {
            totalCostPrice: 0,
            netProfitAfterCosts: 0,
            netProfitAfterCostsAndTax: 0,
            totalRevenue: 0
          };
        }
        
        // Получаем себестоимость товаров из product_costs
        const { data: costData, error: costError } = await supabase
          .from('product_costs')
          .select('sku, offer_id, cost_price');

        if (costError) throw costError;

        // Создаем карту себестоимости по SKU (для finance_transaction_items используем только SKU)
        const costMap = new Map<number, number>();
        costData?.forEach(cost => {
          if (cost.cost_price !== null && cost.sku) {
            costMap.set(cost.sku, cost.cost_price);
          }
        });
        
        console.log('Cost map size:', costMap.size);

        // Рассчитываем себестоимость и выручку по товарам из finance_transactions
        let totalCostPrice = 0;
        let totalRevenue = 0;
        let itemsWithCosts = 0;
        
        // Группируем по SKU и операциям для правильного подсчета
        const itemsGrouped = new Map<string, { sku: number; revenue: number; count: number }>();
        
        financeItems.forEach((item: any) => {
          const transaction = item.finance_transactions;
          if (!transaction || !item.sku) return;
          
          const operationType = transaction.operation_type || '';
          const accrualsForSale = toNumber(transaction.accruals_for_sale || 0);
          
          // Считаем выручку только по операциям доставки (согласно логике useFinanceData)
          if (operationType === 'OperationAgentDeliveredToCustomer' && accrualsForSale > 0) {
            const key = `${item.sku}_${transaction.posting_number}`;
            
            if (itemsGrouped.has(key)) {
              const existing = itemsGrouped.get(key)!;
              existing.revenue += accrualsForSale;
              existing.count += 1;
            } else {
              itemsGrouped.set(key, {
                sku: item.sku,
                revenue: accrualsForSale,
                count: 1
              });
            }
          }
        });
        
        console.log('Grouped items count:', itemsGrouped.size);
        
        // Рассчитываем себестоимость по сгруппированным товарам
        itemsGrouped.forEach((groupedItem) => {
          const costPrice = costMap.get(groupedItem.sku);
          
          totalRevenue += groupedItem.revenue;
          
          if (costPrice !== undefined) {
            // Используем количество операций как приблизительное количество единиц
            // В идеале нужно иметь quantity в finance_transaction_items
            totalCostPrice += costPrice * groupedItem.count;
            itemsWithCosts++;
          }
        });
        
        console.log('Financial cost analysis results:', {
          totalRevenue,
          totalCostPrice,
          itemsWithCosts,
          groupedItemsCount: itemsGrouped.size
        });

        // Рассчитываем чистую прибыль за вычетом себестоимости
        const netProfitAfterCosts = totalRevenue - totalCostPrice;
        
        // Рассчитываем чистую прибыль за вычетом себестоимости и 6% налога
        const netProfitAfterCostsAndTax = netProfitAfterCosts * 0.94; // отнимаем 6%

        return {
          totalCostPrice,
          netProfitAfterCosts,
          netProfitAfterCostsAndTax,
          totalRevenue
        };

      } catch (error) {
        console.error('Ошибка при расчете финансовой себестоимости:', error);
        return {
          totalCostPrice: 0,
          netProfitAfterCosts: 0,
          netProfitAfterCostsAndTax: 0,
          totalRevenue: 0
        };
      }
    },
    enabled: !!filters,
  });
};