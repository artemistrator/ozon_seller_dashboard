import React, { useState } from 'react';
import { Package, Calculator, Edit, Check, X, TrendingUp } from 'lucide-react';
import { useProductCosts, useUpsertProductCost, useProductCostsStats, ProductCost } from '../hooks/useProductCosts';
import { formatCurrency, formatNumber } from '../lib/format';

interface EditingState {
  id: number;
  cost_price: string;
}

export const ProductCostsPage: React.FC = () => {
  const { data: productCosts, isLoading, error } = useProductCosts();
  const stats = useProductCostsStats();
  const upsertMutation = useUpsertProductCost();
  
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Фильтрация товаров по поисковому запросу
  const filteredProducts = productCosts?.filter(product => 
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toString().includes(searchTerm) ||
    product.offer_id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEditStart = (product: ProductCost) => {
    setEditingState({
      id: product.id || product.sku, // используем sku как fallback для новых записей
      cost_price: product.cost_price?.toString() || ''
    });
  };

  const handleEditCancel = () => {
    setEditingState(null);
  };

  const handleEditSave = async (product: ProductCost) => {
    if (!editingState) return;

    const costPrice = parseFloat(editingState.cost_price);
    if (isNaN(costPrice) || costPrice < 0) {
      alert('Введите корректную себестоимость (число больше или равно 0)');
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        sku: product.sku,
        offer_id: product.offer_id,
        product_name: product.product_name,
        cost_price: costPrice
      });
      setEditingState(null);
    } catch (error) {
      console.error('Ошибка при сохранении себестоимости:', error);
      alert('Ошибка при сохранении данных');
    }
  };

  const handleCostPriceChange = (value: string) => {
    if (!editingState) return;
    setEditingState({
      ...editingState,
      cost_price: value
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Загрузка данных о товарах...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="text-red-600 dark:text-red-400">
          Ошибка загрузки данных: {error instanceof Error ? error.message : 'Неизвестная ошибка'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Себестоимость</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Управление себестоимостью товаров: SKU, offer_id, название, цена за единицу и редактируемая себестоимость
        </p>
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatNumber(stats.totalProducts)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Всего товаров</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Calculator className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatNumber(stats.productsWithCosts)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">С себестоимостью</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Edit className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatNumber(stats.productsWithoutCosts)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Без себестоимости</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(stats.averageCostPrice)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Средняя себестоимость</div>
            </div>
          </div>
        </div>
      </div>

      {/* Поиск */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Поиск по названию, SKU или offer_id..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            Найдено: {formatNumber(filteredProducts.length)} из {formatNumber(productCosts?.length || 0)}
          </div>
        </div>
      </div>

      {/* Таблица товаров */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Offer ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Название товара
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Цена за единицу
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Себестоимость
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.map((product) => {
                const isEditing = editingState?.id === (product.id || product.sku);
                
                return (
                  <tr key={`${product.sku}_${product.offer_id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-blue-600 dark:text-blue-400">
                      {product.offer_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate" title={product.product_name}>
                      {product.product_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-100">
                      {formatCurrency(product.unit_price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingState.cost_price}
                          onChange={(e) => handleCostPriceChange(e.target.value)}
                          className="w-24 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          autoFocus
                        />
                      ) : (
                        <span className={`font-medium ${
                          product.cost_price !== null 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {product.cost_price !== null ? formatCurrency(product.cost_price) : '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditSave(product)}
                            disabled={upsertMutation.isPending}
                            className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                            title="Сохранить"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            disabled={upsertMutation.isPending}
                            className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                            title="Отменить"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditStart(product)}
                          className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Редактировать себестоимость"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Товары не найдены по вашему запросу' : 'Нет данных о товарах'}
          </div>
        )}
      </div>

      {/* Информация о обновлениях */}
      {upsertMutation.isPending && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-blue-600 dark:text-blue-400">
            Сохранение данных в Supabase...
          </div>
        </div>
      )}
    </div>
  );
};