-- Create a proper finance calculation query that uses map_operation_types
-- This will replace the estimates with actual transaction data

-- First, let's see what categories we have in map_operation_types
SELECT operation_type, category, COUNT(*) as usage_count
FROM map_operation_types 
GROUP BY operation_type, category
ORDER BY category, operation_type;

-- Create a view for properly categorized finance transactions
CREATE OR REPLACE VIEW vw_finance_categorized AS
SELECT 
    ft.transaction_id,
    ft.operation_date,
    ft.posting_number,
    ft.operation_type,
    ft.operation_type_name,
    ft.amount,
    ft.accruals_for_sale,
    ft.sale_commission,
    ft.delivery_charge,
    ft.return_delivery_charge,
    COALESCE(mot.category, 'other') as category,
    
    -- Services data
    COALESCE(fts.name, '') as service_name,
    COALESCE(fts.price, 0) as service_price,
    
    -- Items data  
    COALESCE(fti.sku, 0) as item_sku,
    COALESCE(fti.name, '') as item_name
    
FROM finance_transactions ft
LEFT JOIN map_operation_types mot ON ft.operation_type = mot.operation_type
LEFT JOIN finance_transaction_services fts ON ft.transaction_id = fts.transaction_id
LEFT JOIN finance_transaction_items fti ON ft.transaction_id = fti.transaction_id;

-- Test the view
SELECT 
    category,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM vw_finance_categorized 
WHERE operation_date >= '2025-08-01' AND operation_date < '2025-08-02'
GROUP BY category
ORDER BY total_amount DESC;