-- Debug Finance Page Issue
-- This will help us understand why Finance shows zeros

-- 1. Check if table exists and has data
SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_rows,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_rows,
    COUNT(CASE WHEN status = 'in_delivery' THEN 1 END) as in_delivery_rows
FROM postings_fbs;

-- 2. Check if there are any delivered orders at all
SELECT 
    COUNT(*) as delivered_count,
    SUM(price_total) as total_gmv,
    SUM(payout) as total_payout,
    SUM(commission_amount) as total_commission
FROM postings_fbs 
WHERE status = 'delivered';

-- 3. Check date ranges in the table
SELECT 
    MIN(shipment_date) as min_shipment_date,
    MAX(shipment_date) as max_shipment_date,
    MIN(delivering_date) as min_delivering_date,
    MAX(delivering_date) as max_delivering_date
FROM postings_fbs;

-- 4. Check if there are any orders in the specific period (01.08.2025 - 05.08.2025)
SELECT 
    COUNT(*) as total_in_period,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_in_period,
    SUM(CASE WHEN status = 'delivered' THEN price_total ELSE 0 END) as gmv_delivered,
    SUM(CASE WHEN status = 'delivered' THEN payout ELSE 0 END) as payout_delivered,
    SUM(CASE WHEN status = 'delivered' THEN commission_amount ELSE 0 END) as commission_delivered
FROM postings_fbs 
WHERE shipment_date >= '2025-08-01' 
    AND shipment_date <= '2025-08-05';

-- 5. Check if RPC functions exist
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN ('get_finance_summary', 'get_sales_metrics_by_date_type_correct');

-- 6. Test the finance RPC function directly
SELECT * FROM get_finance_summary('2025-08-01', '2025-08-05', 'shipment_date');

-- 7. Check if there are any orders with different date formats
SELECT DISTINCT 
    shipment_date,
    COUNT(*) as count
FROM postings_fbs 
GROUP BY shipment_date 
ORDER BY shipment_date 
LIMIT 20;
