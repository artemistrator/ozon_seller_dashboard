# 📋 Исправления финансов согласно чёткому ТЗ

## ✅ Выполненные изменения

### 1. **useFinanceData.ts** - Финансовые расчёты по ТЗ

**Выручка** = `Σ accruals_for_sale` (только по операциям `OperationAgentDeliveredToCustomer`)
- Берём поле `accruals_for_sale` из таблицы `finance_transactions`
- Только для операций доставки покупателю

**Комиссия** = `Σ sale_commission` (отрицательная)
- Берём поле `sale_commission` из таблицы `finance_transactions`  
- Показываем как положительную сумму расхода

**Доставка** = `Σ amount` по операциям:
- `OperationAgentDeliveredToCustomer`
- `OperationMarketplaceServiceItemFBSDelivery`
- `OperationAgentPerformedService`
- `OperationAgent*`

**Эквайринг** = `Σ amount` по `MarketplaceRedistributionOfAcquiringOperation`

**Реклама** = `Σ amount` по `OperationMarketplaceMarketingActionCost`

**Агентские услуги** = `Σ amount` по `OperationAgent*` (исключая уже учтённые в доставке)

**Чистая прибыль** = `Σ amount` по всем операциям за период

### 2. **useFinanceBreakdown.ts** - Детализация по ТЗ

Обновлён интерфейс `FinanceBreakdownItem`:
```typescript
{
  date: string;
  posting: string;
  operation_type: string;
  operation_type_name: string;
  accruals_for_sale: number;
  sale_commission: number;
  amount: number;
}
```

Показывает поля согласно ТЗ: `operation_date`, `operation_type_name`, `posting_number`, `accruals_for_sale`, `sale_commission`, `amount`

### 3. **useTransactionsData.ts** - Таблица транзакций

Обновлён интерфейс `TransactionDetail`:
```typescript
{
  transaction_id: number;
  operation_date: string;
  posting_number: string;
  operation_type: string;
  operation_type_name: string;
  accruals_for_sale: number;
  sale_commission: number;
  amount: number;
  category: string;
}
```

Категоризация по `operation_type`:
- `OperationAgentDeliveredToCustomer` → продажи/доставка/комиссия
- `MarketplaceRedistributionOfAcquiringOperation` → эквайринг
- `OperationMarketplaceMarketingActionCost` → реклама
- `OperationAgent*` → агентские
- `OperationMarketplaceServiceItemFBSDelivery` → доставка
- Остальное → прочее

### 4. **TransactionsPage.tsx** - Отображение детализации

Обновлённые колонки таблицы:
1. **Дата операции** (operation_date)
2. **Номер отправления** (posting_number)
3. **Тип операции** (operation_type)
4. **Название операции** (operation_type_name)
5. **Выручка** (accruals_for_sale) - только если > 0
6. **Комиссия** (sale_commission) - только если ≠ 0
7. **Сумма операции** (amount)
8. **Категория** (по ТЗ)

## 🎯 Результат

### Вкладка «Финансы» (карточки):
- ✅ **Выручка** = Σ accruals_for_sale по доставке покупателю
- ✅ **Комиссия** = Σ sale_commission
- ✅ **Доставка** = Σ amount по доставочным операциям
- ✅ **Эквайринг** = Σ amount по MarketplaceRedistributionOfAcquiringOperation
- ✅ **Реклама** = Σ amount по OperationMarketplaceMarketingActionCost
- ✅ **Агентские** = Σ amount по OperationAgent*
- ✅ **Чистая прибыль** = Σ amount по всем операциям

### Вкладка «Детализация» (таблица):
- ✅ Показывает operation_date, operation_type_name, posting_number, accruals_for_sale, sale_commission, amount
- ✅ Фактически «выписка» Ozon как требовалось в ТЗ

## 🔧 Технические детали

- **Источник данных**: `finance_transactions` (дата учёта: operation_date)
- **Расчёт выручки**: через поле `accruals_for_sale`
- **Расчёт комиссии**: через поле `sale_commission`
- **Расчёт расходов**: через поле `amount` с фильтрацией по `operation_type`
- **Чистая прибыль**: простая сумма всех `amount`

Все изменения соответствуют предоставленному ТЗ и используют правильные поля из таблицы `finance_transactions`.