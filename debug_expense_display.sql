-- Debug query to check why expenses are not displaying
-- Run this in Supabase SQL Editor to see what's happening

-- 1. Check if vw_finance_categorized exists and has data
SELECT COUNT(*) as total_records FROM vw_finance_categorized;

-- 2. Check data for specific date range (August 1, 2025)
SELECT 
    category,
    COUNT(*) as record_count,
    SUM(amount) as total_amount,
    MIN(amount) as min_amount,
    MAX(amount) as max_amount,
    operation_type,
    operation_type_name
FROM vw_finance_categorized 
WHERE operation_date >= '2025-08-01' 
    AND operation_date < '2025-08-02'
GROUP BY category, operation_type, operation_type_name
ORDER BY category, total_amount DESC;

-- 3. Check what categories are available in map_operation_types
SELECT 
    operation_type,
    category,
    COUNT(*) as usage_count
FROM map_operation_types 
GROUP BY operation_type, category
ORDER BY category, operation_type;

-- 4. Check if there are any transactions without category mapping
SELECT 
    ft.operation_type,
    ft.operation_type_name,
    COUNT(*) as unmapped_count,
    SUM(ft.amount) as total_unmapped_amount
FROM finance_transactions ft
LEFT JOIN map_operation_types mot ON ft.operation_type = mot.operation_type
WHERE mot.operation_type IS NULL
    AND ft.operation_date >= '2025-08-01' 
    AND ft.operation_date < '2025-08-02'
GROUP BY ft.operation_type, ft.operation_type_name
ORDER BY total_unmapped_amount DESC;

-- 5. Check sample data from vw_finance_categorized for debugging
SELECT 
    transaction_id,
    operation_date,
    operation_type,
    operation_type_name,
    amount,
    category,
    service_name,
    item_name
FROM vw_finance_categorized 
WHERE operation_date >= '2025-08-01' 
    AND operation_date < '2025-08-02'
ORDER BY ABS(amount) DESC
LIMIT 10;

-- 6. Check raw finance_transactions for the same period
SELECT 
    transaction_id,
    operation_date,
    operation_type,
    operation_type_name,
    amount,
    accruals_for_sale,
    sale_commission,
    delivery_charge,
    return_delivery_charge
FROM finance_transactions 
WHERE operation_date >= '2025-08-01' 
    AND operation_date < '2025-08-02'
ORDER BY ABS(amount) DESC
LIMIT 10;