# 🔄 **Исправление логики себестоимости: разделение источников данных**

## 🐛 **Выявленная проблема**

### **Логическая несогласованность:**
- **Вкладка "Финансы"**: доходы из `finance_transactions`, себестоимость из `postings_fbs`
- **Результат**: разные наборы товаров и периоды в расчетах

### **Корневая причина:**
Общий хук [`useCostAnalysis`](file://x:\dashboard%20ozon\src\hooks\useCostAnalysis.ts) использовал [`postings_fbs`](file://x:\dashboard%20ozon\src\hooks\useCostAnalysis.ts#L19-L25) для всех вкладок, но:
- **Вкладка "Продажи"** = манagerial accounting (`postings_fbs` по дате заказа)
- **Вкладка "Финансы"** = financial accounting (`finance_transactions` по дате операции)

## ✅ **Реализованное решение**

### **1. Создан специализированный хук [`useFinanceCostAnalysis.ts`](file://x:\dashboard%20ozon\src\hooks\useFinanceCostAnalysis.ts)**

#### **Источники данных:**
```typescript
// Товары из finance_transaction_items + связанные finance_transactions
const { data: financeItems } = await supabase
  .from('finance_transaction_items')
  .select(`
    sku,
    name,
    finance_transactions!inner(
      operation_date,
      operation_type,
      accruals_for_sale,
      posting_number
    )
  `);
```

#### **Логика расчета:**
1. **Источник товаров**: [`finance_transaction_items`](file://x:\dashboard%20ozon\src\hooks\useFinanceCostAnalysis.ts#L24-L35) (те же товары, что формируют доходы)
2. **Период фильтрации**: по [`operation_date`](file://x:\dashboard%20ozon\src\hooks\useFinanceCostAnalysis.ts#L38-L49) из `finance_transactions`
3. **Выручка**: только операции [`OperationAgentDeliveredToCustomer`](file://x:\dashboard%20ozon\src\hooks\useFinanceCostAnalysis.ts#L83-L85) с `accruals_for_sale > 0`
4. **Себестоимость**: из [`product_costs`](file://x:\dashboard%20ozon\src\hooks\useFinanceCostAnalysis.ts#L58-L60) по SKU товаров

### **2. Разделение по вкладкам:**

#### **📊 Вкладка "Продажи"** → [`useCostAnalysis`](file://x:\dashboard%20ozon\src\hooks\useCostAnalysis.ts):
- **Источник**: [`postings_fbs`](file://x:\dashboard%20ozon\src\hooks\useCostAnalysis.ts#L19-L25) (манagerial accounting)
- **Фильтрация**: по [`dateType`](file://x:\dashboard%20ozon\src\hooks\useCostAnalysis.ts#L23-L24) (shipment_date, delivering_date, in_process_at)
- **Выручка**: [`payout`](file://x:\dashboard%20ozon\src\hooks\useCostAnalysis.ts#L49-L52) из отгрузок
- **Количество**: [`quantity`](file://x:\dashboard%20ozon\src\hooks\useCostAnalysis.ts#L47-L48) из отгрузок

#### **💰 Вкладка "Финансы"** → [`useFinanceCostAnalysis`](file://x:\dashboard%20ozon\src\hooks\useFinanceCostAnalysis.ts):
- **Источник**: [`finance_transaction_items`](file://x:\dashboard%20ozon\src\hooks\useFinanceCostAnalysis.ts#L24-L35) (financial accounting)
- **Фильтрация**: по [`operation_date`](file://x:\dashboard%20ozon\src\hooks\useFinanceCostAnalysis.ts#L38-L49) из финансовых операций
- **Выручка**: [`accruals_for_sale`](file://x:\dashboard%20ozon\src\hooks\useFinanceCostAnalysis.ts#L83-L94) из доставок покупателю
- **Количество**: количество операций (приблизительно)

## 🔧 **Техническая реализация**

### **Обновленные импорты:**

#### **FinancePage.tsx:**
```typescript
// Было
import { useCostAnalysis } from '../hooks/useCostAnalysis';

// Стало  
import { useFinanceCostAnalysis } from '../hooks/useFinanceCostAnalysis';
```

#### **SalesPage.tsx:**
```typescript
// Остается без изменений
import { useCostAnalysis } from '../hooks/useCostAnalysis';
```

### **Связь данных в finance_transaction_items:**

```sql
-- Структура связи для финансовой себестоимости
finance_transactions (operation_date, operation_type, accruals_for_sale)
    ↓ transaction_id
finance_transaction_items (sku, name)
    ↓ sku  
product_costs (sku, cost_price)
```

### **Группировка товаров:**
```typescript
// Группируем по SKU + posting_number для избежания дублей
const key = `${item.sku}_${transaction.posting_number}`;
```

## 📊 **Сравнение источников данных**

| Аспект | Вкладка "Продажи" | Вкладка "Финансы" |
|--------|------------------|------------------|
| **Источник товаров** | `postings_fbs` | `finance_transaction_items` |
| **Дата фильтрации** | `shipment_date/delivering_date` | `operation_date` |
| **Логика учета** | Managerial accounting | Financial accounting |
| **Выручка из** | `payout` (отгрузки) | `accruals_for_sale` (операции) |
| **Количество** | `quantity` (точное) | Количество операций (приблизительное) |
| **Себестоимость** | `product_costs` (по SKU + offer_id) | `product_costs` (по SKU) |

## 🎯 **Результаты исправления**

### **✅ Консистентность данных:**
- Финансы: и доходы, и себестоимость из одного источника (`finance_transactions`)
- Продажи: и доходы, и себестоимость из одного источника (`postings_fbs`) 

### **✅ Корректные расчеты:**
- **Вкладка "Финансы"** показывает себестоимость товаров, которые **реально формируют финансовые доходы**
- **Вкладка "Продажи"** показывает себестоимость товаров из **фактических отгрузок**

### **✅ Логическая связность:**
- Каждая вкладка использует **единый источник истины** для своих расчетов
- Устранено расхождение между наборами товаров в доходах и себестоимости

## 🔍 **Потенциальные ограничения**

### **1. Количество в finance_transaction_items:**
- Таблица [`finance_transaction_items`](file://x:\dashboard%20ozon\src\hooks\useFinanceCostAnalysis.ts#L24-L35) **не содержит quantity**
- Используется **количество операций** как приблизительная метрика
- Может потребоваться дополнение схемы данных

### **2. Связь SKU в product_costs:**
- Для финансов используется только **SKU** (без offer_id)
- Может быть менее точным для товаров с несколькими предложениями

## 🚀 **Проверка исправлений**

1. **Перейдите на вкладку "Финансы"** → себестоимость должна соответствовать товарам из финансовых операций
2. **Перейдите на вкладку "Продажи"** → себестоимость должна соответствовать товарам из отгрузок  
3. **Сравните наборы товаров** в разных периодах → должны отличаться логично
4. **Проверьте консоль браузера** → логи покажут количество найденных товаров по каждому источнику

---

**Статус**: ✅ Логическая согласованность источников данных восстановлена!