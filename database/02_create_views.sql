-- =====================================================
-- Создание представлений для Ozon Seller Dashboard
-- Версия: 1.0
-- Дата: 2025
-- =====================================================

-- Представление для ежедневных продаж
CREATE OR REPLACE VIEW vw_daily_sales AS
SELECT 
    DATE(shipment_date) as sale_date,
    COUNT(DISTINCT posting_number) as orders_count,
    SUM(quantity) as units_sold,
    SUM(price_total) as gmv,
    SUM(payout) as revenue,
    SUM(commission_amount) as commission,
    AVG(payout) as avg_order_value
FROM postings_fbs
WHERE shipment_date IS NOT NULL
GROUP BY DATE(shipment_date)
ORDER BY sale_date;

-- Представление для аналитики товаров
CREATE OR REPLACE VIEW vw_products_performance AS
SELECT 
    p.sku,
    p.offer_id,
    p.product_name,
    COUNT(DISTINCT p.posting_number) as orders_count,
    SUM(p.quantity) as units_sold,
    SUM(p.price_total) as gmv,
    SUM(p.payout) as revenue,
    SUM(p.commission_amount) as commission,
    AVG(p.price) as avg_price,
    COALESCE(pc.cost_price, 0) as cost_price,
    CASE 
        WHEN pc.cost_price IS NOT NULL THEN 
            SUM(p.payout) - (pc.cost_price * SUM(p.quantity))
        ELSE NULL 
    END as profit
FROM postings_fbs p
LEFT JOIN product_costs pc ON p.sku = pc.sku AND p.offer_id = pc.offer_id
WHERE p.shipment_date IS NOT NULL
GROUP BY p.sku, p.offer_id, p.product_name, pc.cost_price
ORDER BY revenue DESC;

-- Представление для региональной аналитики
CREATE OR REPLACE VIEW vw_regions_performance AS
SELECT 
    cluster_to as region,
    COUNT(DISTINCT posting_number) as orders_count,
    SUM(quantity) as units_sold,
    SUM(price_total) as gmv,
    SUM(payout) as revenue,
    SUM(commission_amount) as commission,
    AVG(payout) as avg_order_value
FROM postings_fbs
WHERE shipment_date IS NOT NULL 
    AND cluster_to IS NOT NULL
GROUP BY cluster_to
ORDER BY revenue DESC;

-- Представление для финансовых категорий
CREATE OR REPLACE VIEW vw_finance_breakdown AS
SELECT 
    ft.operation_date,
    ft.posting_number,
    ft.operation_type,
    ft.operation_type_name,
    ft.amount,
    ft.accruals_for_sale,
    ft.sale_commission,
    CASE 
        WHEN ft.operation_type = 'OperationAgentDeliveredToCustomer' THEN 'sales'
        WHEN ft.operation_type = 'MarketplaceRedistributionOfAcquiringOperation' THEN 'acquiring'
        WHEN ft.operation_type IN ('OperationMarketplaceMarketingActionCost', 'OperationPromotionWithCostPerOrder', 'OperationElectronicServiceStencil', 'OperationGettingToTheTop') THEN 'advertising'
        WHEN ft.operation_type LIKE 'OperationAgent%' THEN 'services'
        WHEN ft.operation_type IN ('OperationMarketplaceServiceItemFBSDelivery') THEN 'delivery'
        ELSE 'other'
    END as category
FROM finance_transactions ft
ORDER BY ft.operation_date DESC;

-- Представление для детализации транзакций
CREATE OR REPLACE VIEW vw_transaction_details AS
SELECT 
    ft.transaction_id,
    ft.operation_date,
    ft.posting_number,
    ft.operation_type,
    ft.operation_type_name,
    ft.amount,
    ft.accruals_for_sale,
    ft.sale_commission,
    fti.sku,
    fti.name as item_name,
    fts.name as service_name,
    fts.price as service_price,
    CASE 
        WHEN ft.operation_type = 'OperationAgentDeliveredToCustomer' THEN 'продажи/доставка/комиссия'
        WHEN ft.operation_type = 'MarketplaceRedistributionOfAcquiringOperation' THEN 'эквайринг'
        WHEN ft.operation_type IN ('OperationMarketplaceMarketingActionCost', 'OperationPromotionWithCostPerOrder', 'OperationElectronicServiceStencil', 'OperationGettingToTheTop') THEN 'реклама'
        WHEN ft.operation_type LIKE 'OperationAgent%' THEN 'агентские'
        WHEN ft.operation_type IN ('OperationMarketplaceServiceItemFBSDelivery') THEN 'доставка'
        ELSE 'прочее'
    END as category
FROM finance_transactions ft
LEFT JOIN finance_transaction_items fti ON ft.transaction_id = fti.transaction_id
LEFT JOIN finance_transaction_services fts ON ft.transaction_id = fts.transaction_id
ORDER BY ft.operation_date DESC;

-- Представление для анализа себестоимости
CREATE OR REPLACE VIEW vw_cost_analysis AS
SELECT 
    p.sku,
    p.offer_id,
    p.product_name,
    p.price as selling_price,
    pc.cost_price,
    pc.updated_at as cost_updated_at,
    CASE 
        WHEN pc.cost_price IS NOT NULL THEN 
            ((p.price - pc.cost_price) / p.price * 100)
        ELSE NULL 
    END as margin_percent,
    CASE 
        WHEN pc.cost_price IS NOT NULL THEN (p.price - pc.cost_price)
        ELSE NULL 
    END as margin_amount
FROM (
    SELECT DISTINCT sku, offer_id, product_name, 
           FIRST_VALUE(price) OVER (PARTITION BY sku, offer_id ORDER BY shipment_date DESC) as price
    FROM postings_fbs 
    WHERE price IS NOT NULL
) p
LEFT JOIN product_costs pc ON p.sku = pc.sku AND p.offer_id = pc.offer_id
ORDER BY p.sku;

-- =====================================================
-- Проверка созданных представлений
-- =====================================================

-- Список всех созданных представлений
SELECT table_name as view_name
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'vw_%'
ORDER BY table_name;

-- Комментарии к представлениям
COMMENT ON VIEW vw_daily_sales IS 'Ежедневная аналитика продаж';
COMMENT ON VIEW vw_products_performance IS 'Производительность товаров с себестоимостью';
COMMENT ON VIEW vw_regions_performance IS 'Региональная аналитика продаж';
COMMENT ON VIEW vw_finance_breakdown IS 'Категоризация финансовых операций';
COMMENT ON VIEW vw_transaction_details IS 'Детализация всех транзакций';
COMMENT ON VIEW vw_cost_analysis IS 'Анализ себестоимости и маржинальности';