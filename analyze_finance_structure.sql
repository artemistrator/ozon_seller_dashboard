-- Analyze finance_transactions structure and operation_type_name values
-- to understand how to properly categorize transactions

-- 1. Check unique operation_type_name values (Russian names)
SELECT 
    operation_type,
    operation_type_name,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM finance_transactions 
WHERE operation_date >= '2025-08-01' 
    AND operation_date < '2025-08-05'
GROUP BY operation_type, operation_type_name
ORDER BY total_amount DESC;

-- 2. Check services data structure
SELECT 
    fts.name as service_name,
    COUNT(*) as service_count,
    SUM(fts.price) as total_service_amount,
    AVG(fts.price) as avg_service_price
FROM finance_transaction_services fts
JOIN finance_transactions ft ON ft.transaction_id = fts.transaction_id
WHERE ft.operation_date >= '2025-08-01' 
    AND ft.operation_date < '2025-08-05'
GROUP BY fts.name
ORDER BY total_service_amount DESC;

-- 3. Check items data structure  
SELECT 
    fti.name as item_name,
    COUNT(*) as item_count
FROM finance_transaction_items fti
JOIN finance_transactions ft ON ft.transaction_id = fti.transaction_id
WHERE ft.operation_date >= '2025-08-01' 
    AND ft.operation_date < '2025-08-05'
GROUP BY fti.name
ORDER BY item_count DESC;

-- 4. Check relationship between transactions and services/items
SELECT 
    'services' as type,
    COUNT(DISTINCT fts.transaction_id) as transactions_with_data,
    COUNT(*) as total_records
FROM finance_transaction_services fts
JOIN finance_transactions ft ON ft.transaction_id = fts.transaction_id
WHERE ft.operation_date >= '2025-08-01' 
    AND ft.operation_date < '2025-08-05'

UNION ALL

SELECT 
    'items' as type,
    COUNT(DISTINCT fti.transaction_id) as transactions_with_data,
    COUNT(*) as total_records
FROM finance_transaction_items fti
JOIN finance_transactions ft ON ft.transaction_id = fti.transaction_id
WHERE ft.operation_date >= '2025-08-01' 
    AND ft.operation_date < '2025-08-05';