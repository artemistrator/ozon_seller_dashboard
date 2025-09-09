-- Debug script to compare Sales vs Finance metrics for 2025-08-01
-- This will help identify why the values differ

-- 1. Raw data from postings_fbs for 2025-08-01
SELECT 
    'Raw postings_fbs data for 2025-08-01' as description,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_records,
    SUM(CASE WHEN status = 'delivered' THEN price_total ELSE 0 END) as total_gmv,
    SUM(CASE WHEN status = 'delivered' THEN payout ELSE 0 END) as total_payout,
    SUM(CASE WHEN status = 'delivered' THEN commission_amount ELSE 0 END) as total_commissions,
    SUM(CASE WHEN status = 'delivered' THEN quantity ELSE 0 END) as total_quantity
FROM postings_fbs 
WHERE shipment_date >= '2025-08-01' 
    AND shipment_date < '2025-08-02'
    
UNION ALL

-- 2. Sales page calculation (by order_id groups)
SELECT 
    'Sales page logic (grouped by order_id)' as description,
    COUNT(DISTINCT order_id) as unique_orders,
    COUNT(*) as total_items,
    SUM(price_total) as gmv_sales_page,
    SUM(payout) as revenue_sales_page,
    SUM(commission_amount) as commissions_sales_page,
    SUM(quantity) as units_sales_page
FROM postings_fbs 
WHERE shipment_date >= '2025-08-01' 
    AND shipment_date < '2025-08-02'
    AND status = 'delivered'
    
UNION ALL

-- 3. Finance page calculation (with quantity multiplier)
SELECT 
    'Finance page logic (payout * quantity)' as description,
    COUNT(*) as records_count,
    0 as placeholder1,
    SUM(price_total * quantity) as gmv_with_qty,
    SUM(payout * quantity) as sales_finance_page,
    SUM(commission_amount * quantity) as commissions_with_qty,
    SUM(quantity) as total_quantity
FROM postings_fbs 
WHERE shipment_date >= '2025-08-01' 
    AND shipment_date < '2025-08-02'
    AND status = 'delivered';

-- 4. Check for any negative values or unusual data
SELECT 
    order_id,
    sku,
    quantity,
    price_total,
    payout,
    commission_amount,
    status,
    shipment_date,
    (payout * quantity) as finance_sales_contribution,
    (commission_amount * quantity) as finance_commission_contribution
FROM postings_fbs 
WHERE shipment_date >= '2025-08-01' 
    AND shipment_date < '2025-08-02'
    AND status = 'delivered'
ORDER BY order_id;

-- 5. Check transaction details for services
SELECT 
    'Services from vw_transaction_details' as description,
    COUNT(*) as service_records,
    SUM(amount) as total_service_amount
FROM vw_transaction_details 
WHERE operation_date_msk >= '2025-08-01' 
    AND operation_date_msk < '2025-08-02'
    AND (category = 'services' OR operation_type_name ILIKE '%service%');