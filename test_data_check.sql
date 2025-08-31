-- Test data check for postings_fbs table
-- This will help us understand what data is available

-- 1. Check if table exists and has data
SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_rows,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_rows,
    COUNT(CASE WHEN status = 'in_delivery' THEN 1 END) as in_delivery_rows
FROM postings_fbs;

-- 2. Check sample data structure
SELECT 
    order_id,
    sku,
    quantity,
    price,
    price_total,
    payout,
    commission_amount,
    status,
    shipment_date,
    delivering_date,
    in_process_at,
    warehouse_name
FROM postings_fbs 
LIMIT 10;

-- 3. Check date ranges
SELECT 
    MIN(shipment_date) as min_shipment_date,
    MAX(shipment_date) as max_shipment_date,
    MIN(delivering_date) as min_delivering_date,
    MAX(delivering_date) as max_delivering_date,
    MIN(in_process_at) as min_in_process_at,
    MAX(in_process_at) as max_in_process_at
FROM postings_fbs;

-- 4. Check specific date range (01.08.2025 - 05.08.2025)
SELECT 
    COUNT(*) as total_rows_in_period,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_in_period,
    SUM(price_total) as total_gmv_in_period,
    SUM(payout) as total_payout_in_period,
    SUM(commission_amount) as total_commission_in_period
FROM postings_fbs 
WHERE shipment_date >= '2025-08-01' 
    AND shipment_date <= '2025-08-05';

-- 5. Check if there are any delivered orders in the period
SELECT 
    order_id,
    sku,
    quantity,
    price_total,
    payout,
    commission_amount,
    status,
    shipment_date
FROM postings_fbs 
WHERE shipment_date >= '2025-08-01' 
    AND shipment_date <= '2025-08-05'
    AND status = 'delivered'
LIMIT 20;
