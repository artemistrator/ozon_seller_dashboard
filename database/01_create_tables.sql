-- =====================================================
-- Создание основных таблиц для Ozon Seller Dashboard
-- Версия: 1.0
-- Дата: 2025
-- =====================================================

-- Таблица отгрузок FBS (манagerial учет)
CREATE TABLE IF NOT EXISTS postings_fbs (
    id BIGSERIAL PRIMARY KEY,
    posting_number TEXT,
    order_id BIGINT,
    status TEXT,
    in_process_at TIMESTAMPTZ,
    shipment_date TIMESTAMPTZ,
    delivering_date TIMESTAMPTZ,
    warehouse_id BIGINT,
    warehouse_name TEXT,
    sku BIGINT,
    offer_id TEXT,
    product_name TEXT,
    quantity INTEGER,
    price NUMERIC(10,2),
    price_total NUMERIC(10,2),
    payout NUMERIC(10,2),
    commission_amount NUMERIC(10,2),
    commission_percent NUMERIC(5,2),
    cluster_from TEXT,
    cluster_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица финансовых транзакций (financial учет)
CREATE TABLE IF NOT EXISTS finance_transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT UNIQUE NOT NULL,
    operation_type TEXT,
    operation_type_name TEXT,
    operation_date TIMESTAMPTZ,
    posting_number TEXT,
    order_date TIMESTAMPTZ,
    warehouse_id BIGINT,
    type TEXT,
    amount NUMERIC(10,2),
    accruals_for_sale NUMERIC(10,2),
    sale_commission NUMERIC(10,2),
    delivery_charge NUMERIC(10,2),
    return_delivery_charge NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица товаров в финансовых операциях
CREATE TABLE IF NOT EXISTS finance_transaction_items (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT REFERENCES finance_transactions(transaction_id),
    sku BIGINT,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица услуг в финансовых операциях
CREATE TABLE IF NOT EXISTS finance_transaction_services (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT REFERENCES finance_transactions(transaction_id),
    name TEXT,
    price NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица себестоимости товаров (пользовательские данные)
CREATE TABLE IF NOT EXISTS product_costs (
    id BIGSERIAL PRIMARY KEY,
    sku BIGINT NOT NULL,
    offer_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    cost_price NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sku, offer_id)
);

-- Таблица маппинга типов операций (опционально)
CREATE TABLE IF NOT EXISTS map_operation_types (
    id BIGSERIAL PRIMARY KEY,
    operation_type TEXT UNIQUE,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Создание индексов для оптимизации запросов
-- =====================================================

-- Индексы для postings_fbs
CREATE INDEX IF NOT EXISTS idx_postings_fbs_sku ON postings_fbs(sku);
CREATE INDEX IF NOT EXISTS idx_postings_fbs_offer_id ON postings_fbs(offer_id);
CREATE INDEX IF NOT EXISTS idx_postings_fbs_shipment_date ON postings_fbs(shipment_date);
CREATE INDEX IF NOT EXISTS idx_postings_fbs_delivering_date ON postings_fbs(delivering_date);
CREATE INDEX IF NOT EXISTS idx_postings_fbs_in_process_at ON postings_fbs(in_process_at);
CREATE INDEX IF NOT EXISTS idx_postings_fbs_posting_number ON postings_fbs(posting_number);

-- Индексы для finance_transactions
CREATE INDEX IF NOT EXISTS idx_finance_transactions_operation_date ON finance_transactions(operation_date);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_operation_type ON finance_transactions(operation_type);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_posting_number ON finance_transactions(posting_number);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_transaction_id ON finance_transactions(transaction_id);

-- Индексы для finance_transaction_items
CREATE INDEX IF NOT EXISTS idx_finance_transaction_items_transaction_id ON finance_transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_finance_transaction_items_sku ON finance_transaction_items(sku);

-- Индексы для finance_transaction_services
CREATE INDEX IF NOT EXISTS idx_finance_transaction_services_transaction_id ON finance_transaction_services(transaction_id);

-- Индексы для product_costs
CREATE INDEX IF NOT EXISTS idx_product_costs_sku ON product_costs(sku);
CREATE INDEX IF NOT EXISTS idx_product_costs_offer_id ON product_costs(offer_id);
CREATE INDEX IF NOT EXISTS idx_product_costs_sku_offer_id ON product_costs(sku, offer_id);
CREATE INDEX IF NOT EXISTS idx_product_costs_updated_at ON product_costs(updated_at);

-- =====================================================
-- Создание триггеров
-- =====================================================

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для product_costs
CREATE TRIGGER update_product_costs_updated_at 
    BEFORE UPDATE ON product_costs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Комментарии к таблицам
-- =====================================================

COMMENT ON TABLE postings_fbs IS 'Отгрузки FBS для манagerial учета (по датам заказов/отгрузок)';
COMMENT ON TABLE finance_transactions IS 'Финансовые операции для financial учета (по датам операций)';
COMMENT ON TABLE finance_transaction_items IS 'Товары в финансовых операциях';
COMMENT ON TABLE finance_transaction_services IS 'Услуги в финансовых операциях';
COMMENT ON TABLE product_costs IS 'Себестоимость товаров (редактируется пользователем)';
COMMENT ON TABLE map_operation_types IS 'Маппинг типов операций на категории';

-- Комментарии к ключевым полям
COMMENT ON COLUMN product_costs.sku IS 'SKU товара (связь с postings_fbs)';
COMMENT ON COLUMN product_costs.offer_id IS 'ID предложения товара';
COMMENT ON COLUMN product_costs.product_name IS 'Название товара для удобства';
COMMENT ON COLUMN product_costs.cost_price IS 'Себестоимость товара в рублях (вводится пользователем)';

COMMENT ON COLUMN finance_transactions.accruals_for_sale IS 'Выручка от продажи (price × quantity)';
COMMENT ON COLUMN finance_transactions.sale_commission IS 'Комиссия Ozon (всегда отрицательная)';
COMMENT ON COLUMN finance_transactions.amount IS 'Финальный результат операции';

-- =====================================================
-- Завершение создания таблиц
-- =====================================================

-- Проверка созданных таблиц
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('postings_fbs', 'finance_transactions', 'finance_transaction_items', 'finance_transaction_services', 'product_costs', 'map_operation_types')
ORDER BY table_name;