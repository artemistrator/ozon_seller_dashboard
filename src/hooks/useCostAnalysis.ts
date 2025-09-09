import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFilters } from './useFilters';

export interface CostAnalysis {
  totalCostPrice: number;
  netProfitAfterCosts: number;
  netProfitAfterCostsAndTax: number;
}

// Хук для получения себестоимости проданных товаров
export const useCostAnalysis = () => {
  const { filters } = useFilters();
  
  return useQuery({
    queryKey: ['costAnalysis', filters],
    queryFn: async (): Promise<CostAnalysis> => {
      try {
        // Получаем проданные товары за период с их количеством
        const { data: soldItems, error: soldItemsError } = await supabase
          .from('postings_fbs')
          .select('sku, offer_id, quantity, payout')
          .not('sku', 'is', null)
          .not('offer_id', 'is', null)
          .gte(filters.dateType, filters.dateFrom.toISOString())
          .lt(filters.dateType, new Date(filters.dateTo.getTime() + 24 * 60 * 60 * 1000).toISOString());

        if (soldItemsError) throw soldItemsError;

        // Получаем себестоимость товаров
        const { data: costData, error: costError } = await supabase
          .from('product_costs')
          .select('sku, offer_id, cost_price');

        if (costError) throw costError;

        // Создаем карту себестоимости
        const costMap = new Map<string, number>();
        costData?.forEach(cost => {
          if (cost.cost_price !== null) {
            const key = `${cost.sku}_${cost.offer_id}`;
            costMap.set(key, cost.cost_price);
          }
        });

        // Рассчитываем общую себестоимость проданных товаров
        let totalCostPrice = 0;
        let totalRevenue = 0;

        soldItems?.forEach(item => {
          const key = `${item.sku}_${item.offer_id}`;
          const costPrice = costMap.get(key);
          
          if (costPrice !== undefined && item.quantity) {
            totalCostPrice += costPrice * item.quantity;
          }
          
          if (item.payout) {
            totalRevenue += item.payout;
          }
        });

        // Рассчитываем чистую прибыль за вычетом себестоимости
        const netProfitAfterCosts = totalRevenue - totalCostPrice;
        
        // Рассчитываем чистую прибыль за вычетом себестоимости и 6% налога
        const netProfitAfterCostsAndTax = netProfitAfterCosts * 0.94; // отнимаем 6%

        return {
          totalCostPrice,
          netProfitAfterCosts,
          netProfitAfterCostsAndTax
        };

      } catch (error) {
        console.error('Ошибка при расчете себестоимости:', error);
        return {
          totalCostPrice: 0,
          netProfitAfterCosts: 0,
          netProfitAfterCostsAndTax: 0
        };
      }
    },
    enabled: !!filters,
  });
};