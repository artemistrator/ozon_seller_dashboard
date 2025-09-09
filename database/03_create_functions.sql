-- =====================================================
-- Создание RPC функций для Ozon Seller Dashboard
-- Версия: 1.0
-- Дата: 2025
-- =====================================================

-- =====================================================
-- Функция для получения метрик продаж
-- =====================================================
CREATE OR REPLACE FUNCTION get_sales_metrics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE,
    date_type TEXT DEFAULT 'delivering_date'
)
RETURNS TABLE(
    total_gmv NUMERIC,
    total_orders BIGINT,
    total_units BIGINT,
    total_revenue NUMERIC,
    avg_order_value NUMERIC,
    avg_unit_price NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(price_total), 0) as total_gmv,
        COUNT(DISTINCT posting_number) as total_orders,
        COALESCE(SUM(quantity), 0) as total_units,
        COALESCE(SUM(payout), 0) as total_revenue,
        CASE 
            WHEN COUNT(DISTINCT posting_number) > 0 
            THEN COALESCE(SUM(price_total), 0) / COUNT(DISTINCT posting_number)
            ELSE 0
        END as avg_order_value,
        CASE 
            WHEN SUM(quantity) > 0 
            THEN COALESCE(SUM(price_total), 0) / SUM(quantity)
            ELSE 0
        END as avg_unit_price
    FROM postings_fbs
    WHERE 
        CASE 
            WHEN date_type = 'delivering_date' THEN delivering_date::DATE
            WHEN date_type = 'shipment_date' THEN shipment_date::DATE 
            WHEN date_type = 'in_process_at' THEN in_process_at::DATE
            ELSE delivering_date::DATE
        END BETWEEN start_date AND end_date;
END;
$$;

-- =====================================================
-- Функция для получения финансовых метрик
-- =====================================================
CREATE OR REPLACE FUNCTION get_finance_metrics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    total_income NUMERIC,
    total_expenses NUMERIC,
    sales NUMERIC,
    commissions NUMERIC,
    delivery NUMERIC,
    advertising NUMERIC,
    acquiring NUMERIC,
    other_expenses NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH finance_data AS (
        SELECT 
            operation_type,
            operation_type_name,
            amount,
            accruals_for_sale,
            sale_commission,
            delivery_charge,
            return_delivery_charge
        FROM finance_transactions 
        WHERE operation_date::DATE BETWEEN start_date AND end_date
    )
    SELECT 
        -- Общий доход (положительные суммы)
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_income,
        
        -- Общие расходы (отрицательные суммы)
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_expenses,
        
        -- Продажи (accruals_for_sale)
        COALESCE(SUM(accruals_for_sale), 0) as sales,
        
        -- Комиссии (sale_commission, всегда отрицательные)
        COALESCE(SUM(ABS(sale_commission)), 0) as commissions,
        
        -- Доставка (delivery_charge + return_delivery_charge)
        COALESCE(SUM(ABS(delivery_charge) + ABS(return_delivery_charge)), 0) as delivery,
        
        -- Реклама (по типу операции)
        COALESCE(SUM(CASE 
            WHEN operation_type_name ILIKE '%реклам%' 
                OR operation_type_name ILIKE '%продвиж%' 
                OR operation_type_name ILIKE '%рекламн%'
            THEN ABS(amount) 
            ELSE 0 
        END), 0) as advertising,
        
        -- Эквайринг (по типу операции)
        COALESCE(SUM(CASE 
            WHEN operation_type_name ILIKE '%эквайр%' 
                OR operation_type_name ILIKE '%acquiring%'
                OR operation_type_name ILIKE '%банк%'
            THEN ABS(amount) 
            ELSE 0 
        END), 0) as acquiring,
        
        -- Прочие расходы
        COALESCE(SUM(CASE 
            WHEN amount < 0 
                AND operation_type_name NOT ILIKE '%реклам%'
                AND operation_type_name NOT ILIKE '%продвиж%'
                AND operation_type_name NOT ILIKE '%рекламн%'
                AND operation_type_name NOT ILIKE '%эквайр%'
                AND operation_type_name NOT ILIKE '%acquiring%'
                AND operation_type_name NOT ILIKE '%банк%'
                AND (sale_commission = 0 OR sale_commission IS NULL)
                AND (delivery_charge = 0 OR delivery_charge IS NULL)
                AND (return_delivery_charge = 0 OR return_delivery_charge IS NULL)
            THEN ABS(amount) 
            ELSE 0 
        END), 0) as other_expenses
        
    FROM finance_data;
END;
$$;

-- =====================================================
-- Функция для получения данных по товарам
-- =====================================================
CREATE OR REPLACE FUNCTION get_product_analytics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE,
    date_type TEXT DEFAULT 'delivering_date',
    limit_count INTEGER DEFAULT 100
)
RETURNS TABLE(
    sku BIGINT,
    offer_id TEXT,
    product_name TEXT,
    total_quantity BIGINT,
    total_gmv NUMERIC,
    total_revenue NUMERIC,
    avg_price NUMERIC,
    orders_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.sku,
        p.offer_id,
        p.product_name,
        SUM(p.quantity) as total_quantity,
        SUM(p.price_total) as total_gmv,
        SUM(p.payout) as total_revenue,
        AVG(p.price) as avg_price,
        COUNT(DISTINCT p.posting_number) as orders_count
    FROM postings_fbs p
    WHERE 
        CASE 
            WHEN date_type = 'delivering_date' THEN p.delivering_date::DATE
            WHEN date_type = 'shipment_date' THEN p.shipment_date::DATE 
            WHEN date_type = 'in_process_at' THEN p.in_process_at::DATE
            ELSE p.delivering_date::DATE
        END BETWEEN start_date AND end_date
    GROUP BY p.sku, p.offer_id, p.product_name
    ORDER BY total_gmv DESC
    LIMIT limit_count;
END;
$$;

-- =====================================================
-- Функция для получения данных по регионам
-- =====================================================
CREATE OR REPLACE FUNCTION get_region_analytics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE,
    date_type TEXT DEFAULT 'delivering_date'
)
RETURNS TABLE(
    cluster_to TEXT,
    total_quantity BIGINT,
    total_gmv NUMERIC,
    total_revenue NUMERIC,
    orders_count BIGINT,
    avg_order_value NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.cluster_to,
        SUM(p.quantity) as total_quantity,
        SUM(p.price_total) as total_gmv,
        SUM(p.payout) as total_revenue,
        COUNT(DISTINCT p.posting_number) as orders_count,
        CASE 
            WHEN COUNT(DISTINCT p.posting_number) > 0 
            THEN SUM(p.price_total) / COUNT(DISTINCT p.posting_number)
            ELSE 0
        END as avg_order_value
    FROM postings_fbs p
    WHERE 
        p.cluster_to IS NOT NULL
        AND CASE 
            WHEN date_type = 'delivering_date' THEN p.delivering_date::DATE
            WHEN date_type = 'shipment_date' THEN p.shipment_date::DATE 
            WHEN date_type = 'in_process_at' THEN p.in_process_at::DATE
            ELSE p.delivering_date::DATE
        END BETWEEN start_date AND end_date
    GROUP BY p.cluster_to
    ORDER BY total_gmv DESC;
END;
$$;

-- =====================================================
-- Функция для обновления себестоимости товара
-- =====================================================
CREATE OR REPLACE FUNCTION upsert_product_cost(
    p_sku BIGINT,
    p_offer_id TEXT,
    p_product_name TEXT,
    p_cost_price NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO product_costs (sku, offer_id, product_name, cost_price, created_at, updated_at)
    VALUES (p_sku, p_offer_id, p_product_name, p_cost_price, NOW(), NOW())
    ON CONFLICT (sku, offer_id) 
    DO UPDATE SET
        product_name = EXCLUDED.product_name,
        cost_price = EXCLUDED.cost_price,
        updated_at = NOW();
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- =====================================================
-- Функция для получения статистики себестоимости
-- =====================================================
CREATE OR REPLACE FUNCTION get_product_costs_stats()
RETURNS TABLE(
    total_products BIGINT,
    products_with_cost BIGINT,
    coverage_percentage NUMERIC,
    avg_cost_price NUMERIC,
    total_cost_value NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total_count,
            COUNT(cost_price) as with_cost_count,
            AVG(cost_price) as avg_cost,
            SUM(cost_price) as total_cost
        FROM product_costs
    )
    SELECT 
        total_count as total_products,
        with_cost_count as products_with_cost,
        CASE 
            WHEN total_count > 0 
            THEN (with_cost_count::NUMERIC / total_count::NUMERIC) * 100
            ELSE 0
        END as coverage_percentage,
        COALESCE(avg_cost, 0) as avg_cost_price,
        COALESCE(total_cost, 0) as total_cost_value
    FROM stats;
END;
$$;

-- =====================================================
-- Функция для получения временных рядов продаж
-- =====================================================
CREATE OR REPLACE FUNCTION get_sales_time_series(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE,
    date_type TEXT DEFAULT 'delivering_date',
    interval_type TEXT DEFAULT 'day'
)
RETURNS TABLE(
    period_date DATE,
    gmv NUMERIC,
    orders BIGINT,
    units BIGINT,
    revenue NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN date_type = 'delivering_date' THEN p.delivering_date::DATE
            WHEN date_type = 'shipment_date' THEN p.shipment_date::DATE 
            WHEN date_type = 'in_process_at' THEN p.in_process_at::DATE
            ELSE p.delivering_date::DATE
        END as period_date,
        SUM(p.price_total) as gmv,
        COUNT(DISTINCT p.posting_number) as orders,
        SUM(p.quantity) as units,
        SUM(p.payout) as revenue
    FROM postings_fbs p
    WHERE 
        CASE 
            WHEN date_type = 'delivering_date' THEN p.delivering_date::DATE
            WHEN date_type = 'shipment_date' THEN p.shipment_date::DATE 
            WHEN date_type = 'in_process_at' THEN p.in_process_at::DATE
            ELSE p.delivering_date::DATE
        END BETWEEN start_date AND end_date
    GROUP BY period_date
    ORDER BY period_date;
END;
$$;

-- =====================================================
-- Создание индексов для оптимизации RPC функций
-- =====================================================

-- Индексы для быстрого поиска по датам
CREATE INDEX IF NOT EXISTS idx_postings_fbs_date_combination 
ON postings_fbs(delivering_date, shipment_date, in_process_at);

-- Индексы для группировки по товарам
CREATE INDEX IF NOT EXISTS idx_postings_fbs_product_combination 
ON postings_fbs(sku, offer_id, product_name);

-- Индексы для группировки по регионам
CREATE INDEX IF NOT EXISTS idx_postings_fbs_cluster_combination 
ON postings_fbs(cluster_to, delivering_date);

-- Индексы для финансовых операций
CREATE INDEX IF NOT EXISTS idx_finance_transactions_type_date 
ON finance_transactions(operation_type, operation_date);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_type_name 
ON finance_transactions(operation_type_name);

-- =====================================================
-- Права доступа для анонимных пользователей
-- =====================================================

-- Разрешаем выполнение RPC функций для анонимных пользователей
GRANT EXECUTE ON FUNCTION get_sales_metrics TO anon;
GRANT EXECUTE ON FUNCTION get_finance_metrics TO anon;
GRANT EXECUTE ON FUNCTION get_product_analytics TO anon;
GRANT EXECUTE ON FUNCTION get_region_analytics TO anon;
GRANT EXECUTE ON FUNCTION upsert_product_cost TO anon;
GRANT EXECUTE ON FUNCTION get_product_costs_stats TO anon;
GRANT EXECUTE ON FUNCTION get_sales_time_series TO anon;

-- =====================================================
-- Проверка созданных функций
-- =====================================================

-- Список всех созданных RPC функций
SELECT 
    routine_name as function_name,
    routine_type as type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_sales_metrics',
    'get_finance_metrics', 
    'get_product_analytics',
    'get_region_analytics',
    'upsert_product_cost',
    'get_product_costs_stats',
    'get_sales_time_series'
)
ORDER BY routine_name;

-- =====================================================
-- Завершение создания функций
-- =====================================================

-- Уведомление о успешном создании
DO $$
BEGIN
    RAISE NOTICE 'RPC функции для Ozon Seller Dashboard успешно созданы!';
    RAISE NOTICE 'Доступные функции:';
    RAISE NOTICE '- get_sales_metrics() - метрики продаж';
    RAISE NOTICE '- get_finance_metrics() - финансовые метрики';  
    RAISE NOTICE '- get_product_analytics() - аналитика по товарам';
    RAISE NOTICE '- get_region_analytics() - аналитика по регионам';
    RAISE NOTICE '- upsert_product_cost() - обновление себестоимости';
    RAISE NOTICE '- get_product_costs_stats() - статистика себестоимости';
    RAISE NOTICE '- get_sales_time_series() - временные ряды продаж';
END $$;