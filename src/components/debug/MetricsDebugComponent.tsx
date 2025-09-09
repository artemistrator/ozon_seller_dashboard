import React from 'react';
import { supabase } from '../../lib/supabase';
import { formatMoscowDate } from '../../lib/date-utils';
import { useFilters } from '../../hooks/useFilters';
import { toNumber } from '../../lib/format';

export const MetricsDebugComponent: React.FC = () => {
  const { filters } = useFilters();
  const [debugData, setDebugData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const runDebugAnalysis = async () => {
    setLoading(true);
    try {
      const isSingleDay = filters.dateFrom.toDateString() === filters.dateTo.toDateString();
      const fromDate = formatMoscowDate(filters.dateFrom);
      const toDate = isSingleDay 
        ? formatMoscowDate(new Date(filters.dateFrom.getTime() + 24 * 60 * 60 * 1000))
        : formatMoscowDate(new Date(filters.dateTo.getTime() + 24 * 60 * 60 * 1000));

      // Get raw postings data
      const { data: rawPostings } = await supabase
        .from('postings_fbs')
        .select('order_id, quantity, price_total, payout, commission_amount, status')
        .gte(filters.dateType, fromDate)
        .lt(filters.dateType, toDate)
        .eq('status', 'delivered');

      // Calculate Sales page logic (unique orders) - CORRECTED
      const orderMap = new Map();
      (rawPostings || []).forEach(item => {
        if (!orderMap.has(item.order_id)) {
          orderMap.set(item.order_id, []);
        }
        orderMap.get(item.order_id).push(item);
      });
      
      const salesPageMetrics = Array.from(orderMap.values()).reduce((acc: any, items: any) => {
        const orderTotal = items.reduce((orderAcc: any, item: any) => ({
          quantity: orderAcc.quantity + toNumber(item.quantity),
          price_total: orderAcc.price_total + toNumber(item.price_total),
          payout: orderAcc.payout + toNumber(item.payout),
          commission_amount: orderAcc.commission_amount + toNumber(item.commission_amount)
        }), { quantity: 0, price_total: 0, payout: 0, commission_amount: 0 });

        return {
          orders: acc.orders + 1,
          units: acc.units + orderTotal.quantity,
          gmv: acc.gmv + orderTotal.price_total,
          revenue: acc.revenue + orderTotal.payout,
          commissions: acc.commissions + orderTotal.commission_amount
        };
      }, { orders: 0, units: 0, gmv: 0, revenue: 0, commissions: 0 });

      // CORRECTED: Net profit = payout (already excludes commission)
      const salesNetProfit = salesPageMetrics.revenue;

      // Calculate Finance page logic - CORRECTED
      // Sales = SUM(payout) - NO quantity multiplication
      const financePageMetrics = (rawPostings || []).reduce((acc, item) => {
        return {
          records: acc.records + 1,
          sales: acc.sales + toNumber(item.payout), // CORRECTED: no quantity multiplication
          commissions: acc.commissions + toNumber(item.commission_amount),
          totalQuantity: acc.totalQuantity + toNumber(item.quantity)
        };
      }, { records: 0, sales: 0, commissions: 0, totalQuantity: 0 });

      // Finance expenses from actual transactions (not estimates)
      const delivery = 0; // Will be calculated from actual transactions
      const returns = 0;  // Will be calculated from actual transactions
      const ads = 0;      // Will be calculated from actual transactions
      const services = 0; // Will be calculated from actual transactions
      const acquiring = 0; // Will be calculated from actual transactions

      const totalExpenses = financePageMetrics.commissions + delivery + returns + ads + services + acquiring;
      const netProfit = null; // Temporarily null as requested

      setDebugData({
        period: { from: fromDate, to: toDate, isSingleDay },
        rawData: {
          totalRecords: rawPostings?.length || 0,
          sampleRecord: rawPostings?.[0] || null
        },
        salesPageMetrics: {
          ...salesPageMetrics,
          netProfitCorrected: salesNetProfit
        },
        financePageMetrics: {
          ...financePageMetrics,
          delivery,
          returns,
          ads,
          services,
          totalExpenses,
          netProfit
        }
      });
    } catch (error) {
      console.error('Debug analysis failed:', error);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    if (filters.dateFrom && filters.dateTo) {
      runDebugAnalysis();
    }
  }, [filters.dateFrom, filters.dateTo, filters.dateType]);

  if (!debugData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          {loading ? 'Анализ данных...' : 'Запуск анализа метрик...'}
        </p>
      </div>
    );
  }

  // Safety check for data integrity
  if (!debugData.salesPageMetrics || !debugData.financePageMetrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">
          Ошибка: Неполные данные для диагностики. Проверьте консоль браузера.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-blue-900">🔍 Диагностика расчетов метрик</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sales Page Metrics */}
        <div className="bg-white rounded p-4">
          <h4 className="font-medium text-green-700 mb-2">📊 Логика вкладки "Продажи"</h4>
          <div className="space-y-1 text-sm">
            <div>Заказы: {debugData.salesPageMetrics?.orders || 0}</div>
            <div>GMV: {(debugData.salesPageMetrics?.gmv || 0).toLocaleString('ru-RU')} ₽</div>
            <div>Выручка: {(debugData.salesPageMetrics?.revenue || 0).toLocaleString('ru-RU')} ₽</div>
            <div>Комиссии: {(debugData.salesPageMetrics?.commissions || 0).toLocaleString('ru-RU')} ₽</div>
            <div className="font-medium text-green-600">
              Чистая прибыль (исправлено): {(debugData.salesPageMetrics?.netProfitCorrected || 0).toLocaleString('ru-RU')} ₽
            </div>
          </div>
        </div>

        {/* Finance Page Metrics */}
        <div className="bg-white rounded p-4">
          <h4 className="font-medium text-blue-700 mb-2">💰 Логика вкладки "Финансы"</h4>
          <div className="space-y-1 text-sm">
            <div>Записей: {debugData.financePageMetrics?.records || 0}</div>
            <div className="font-medium text-blue-600">
              Общий доход: {(debugData.financePageMetrics?.sales || 0).toLocaleString('ru-RU')} ₽
            </div>
            <div>Комиссии: {(debugData.financePageMetrics?.commissions || 0).toLocaleString('ru-RU')} ₽</div>
            <div>Доставка (8%): {(debugData.financePageMetrics?.delivery || 0).toLocaleString('ru-RU')} ₽</div>
            <div>Возвраты (2%): {(debugData.financePageMetrics?.returns || 0).toLocaleString('ru-RU')} ₽</div>
            <div>Реклама (3%): {(debugData.financePageMetrics?.ads || 0).toLocaleString('ru-RU')} ₽</div>
            <div>Услуги: {(debugData.financePageMetrics?.services || 0).toLocaleString('ru-RU')} ₽</div>
            <div>Эквайринг: {(debugData.financePageMetrics?.acquiring || 0).toLocaleString('ru-RU')} ₽</div>
            <div>Общие расходы: {(debugData.financePageMetrics?.totalExpenses || 0).toLocaleString('ru-RU')} ₽</div>
            <div className="font-medium text-blue-600">
              Чистая прибыль: {debugData.financePageMetrics?.netProfit === null ? 'Временно отключено' : (debugData.financePageMetrics?.netProfit || 0).toLocaleString('ru-RU') + ' ₽'}
            </div>
          </div>
        </div>
      </div>

      {/* Raw Data Sample */}
      <div className="bg-gray-50 rounded p-4">
        <h4 className="font-medium text-gray-700 mb-2">📋 Сырые данные</h4>
        <div className="text-sm space-y-1">
          <div>Период: {debugData.period?.from || 'N/A'} - {debugData.period?.to || 'N/A'} ({debugData.period?.isSingleDay ? 'один день' : 'несколько дней'})</div>
          <div>Всего записей: {debugData.rawData?.totalRecords || 0}</div>
          {debugData.rawData?.sampleRecord && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
              <div>Пример записи:</div>
              <div>Order ID: {debugData.rawData.sampleRecord.order_id}</div>
              <div>Quantity: {debugData.rawData.sampleRecord.quantity}</div>
              <div>Price Total: {debugData.rawData.sampleRecord.price_total}</div>
              <div>Payout: {debugData.rawData.sampleRecord.payout}</div>
              <div>Commission: {debugData.rawData.sampleRecord.commission_amount}</div>
            </div>
          )}
        </div>
      </div>

      {/* Key Differences */}
      <div className="bg-red-50 rounded p-4">
        <h4 className="font-medium text-red-700 mb-2">⚠️ Обнаруженные различия</h4>
        <div className="text-sm space-y-1">
          <div>
            Выручка Продажи vs Доход Финансы: 
            {(debugData.salesPageMetrics?.revenue || 0).toLocaleString('ru-RU')} ₽ vs {(debugData.financePageMetrics?.sales || 0).toLocaleString('ru-RU')} ₽
            {Math.abs((debugData.salesPageMetrics?.revenue || 0) - (debugData.financePageMetrics?.sales || 0)) < 1 ? (
              <span className="text-green-600 ml-2">✅ СОВПАДАЮТ</span>
            ) : (
              <span className="text-red-600 ml-2">❌ НЕ СОВПАДАЮТ</span>
            )}
          </div>
          <div>
            Чистая прибыль: Продажи {(debugData.salesPageMetrics?.netProfitCorrected || 0).toLocaleString('ru-RU')} ₽ vs 
            Финансы {debugData.financePageMetrics?.netProfit === null ? 'отключено' : (debugData.financePageMetrics?.netProfit || 0).toLocaleString('ru-RU') + ' ₽'}
          </div>
          <div className="text-green-600 font-medium">✅ ИСПРАВЛЕНО: Убран двойной вычет комиссий</div>
          <div className="text-green-600 font-medium">✅ ИСПРАВЛЕНО: Sales = SUM(payout) без умножения на quantity</div>
        </div>
      </div>
    </div>
  );
};