import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFilters } from './useFilters';

export interface ProductCost {
  id: number;
  sku: number;
  offer_id: string;
  product_name: string;
  unit_price: number; // стоимость за единицу из последних данных postings_fbs
  cost_price: number | null; // себестоимость, введенная пользователем
  updated_at: string;
  created_at: string;
}

export interface ProductCostInput {
  sku: number;
  offer_id: string;
  product_name: string;
  cost_price: number;
}

export interface ProductCostUpdate {
  id: number;
  cost_price: number;
}

// Хук для получения списка товаров с себестоимостью
export const useProductCosts = () => {
  const { filters } = useFilters();
  
  return useQuery({
    queryKey: ['productCosts', filters],
    queryFn: async (): Promise<ProductCost[]> => {
      // Получаем последние данные по товарам из postings_fbs
      const { data: postingsData, error: postingsError } = await supabase
        .from('postings_fbs')
        .select('sku, offer_id, product_name, price')
        .order('id', { ascending: false }); // используем id вместо created_at

      if (postingsError) throw postingsError;

      // Группируем по SKU + offer_id, чтобы получить последние цены (берем первое вхождение как последнее)
      const latestPrices = new Map<string, { sku: number; offer_id: string; product_name: string; price: number }>();
      
      postingsData?.forEach(item => {
        const key = `${item.sku}_${item.offer_id}`;
        if (!latestPrices.has(key) && item.sku && item.offer_id && item.product_name) {
          latestPrices.set(key, {
            sku: item.sku,
            offer_id: item.offer_id,
            product_name: item.product_name,
            price: item.price || 0
          });
        }
      });

      // Получаем данные о себестоимости
      const { data: costsData, error: costsError } = await supabase
        .from('product_costs')
        .select('*')
        .order('updated_at', { ascending: false });

      if (costsError) throw costsError;

      // Создаем карту себестоимости по SKU + offer_id
      const costsMap = new Map<string, { id: number; cost_price: number; updated_at: string; created_at: string }>();
      costsData?.forEach(cost => {
        const key = `${cost.sku}_${cost.offer_id}`;
        costsMap.set(key, {
          id: cost.id,
          cost_price: cost.cost_price,
          updated_at: cost.updated_at,
          created_at: cost.created_at
        });
      });

      // Объединяем данные
      const result: ProductCost[] = [];
      
      latestPrices.forEach((priceData, key) => {
        const costData = costsMap.get(key);
        
        result.push({
          id: costData?.id || 0,
          sku: priceData.sku,
          offer_id: priceData.offer_id,
          product_name: priceData.product_name,
          unit_price: priceData.price,
          cost_price: costData?.cost_price || null,
          updated_at: costData?.updated_at || '',
          created_at: costData?.created_at || ''
        });
      });

      return result.sort((a, b) => b.sku - a.sku);
    },
    enabled: !!filters,
  });
};

// Хук для создания новой себестоимости
export const useCreateProductCost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: ProductCostInput) => {
      const { data, error } = await supabase
        .from('product_costs')
        .insert([{
          sku: input.sku,
          offer_id: input.offer_id,
          product_name: input.product_name,
          cost_price: input.cost_price
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCosts'] });
    },
  });
};

// Хук для обновления себестоимости
export const useUpdateProductCost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: ProductCostUpdate) => {
      const { data, error } = await supabase
        .from('product_costs')
        .update({ cost_price: input.cost_price })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCosts'] });
    },
  });
};

// Хук для создания или обновления себестоимости (upsert)
export const useUpsertProductCost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: ProductCostInput) => {
      const { data, error } = await supabase
        .from('product_costs')
        .upsert([{
          sku: input.sku,
          offer_id: input.offer_id,
          product_name: input.product_name,
          cost_price: input.cost_price
        }], {
          onConflict: 'sku,offer_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCosts'] });
    },
  });
};

// Хук для удаления себестоимости
export const useDeleteProductCost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('product_costs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCosts'] });
    },
  });
};

// Хук для получения статистики по себестоимости
export const useProductCostsStats = () => {
  const { data: productCosts } = useProductCosts();
  
  if (!productCosts) {
    return {
      totalProducts: 0,
      productsWithCosts: 0,
      productsWithoutCosts: 0,
      averageCostPrice: 0,
      totalCostValue: 0
    };
  }

  const productsWithCosts = productCosts.filter(p => p.cost_price !== null);
  const totalCostValue = productsWithCosts.reduce((sum, p) => sum + (p.cost_price || 0), 0);
  const averageCostPrice = productsWithCosts.length > 0 ? totalCostValue / productsWithCosts.length : 0;

  return {
    totalProducts: productCosts.length,
    productsWithCosts: productsWithCosts.length,
    productsWithoutCosts: productCosts.length - productsWithCosts.length,
    averageCostPrice,
    totalCostValue
  };
};