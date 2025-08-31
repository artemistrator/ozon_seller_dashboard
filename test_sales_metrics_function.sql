-- Test script to verify the new RPC function works correctly
-- This script will test the function with sample data

-- Test 1: Basic function call
SELECT * FROM get_sales_metrics_by_date_type_correct(
    '2025-08-01',  -- start_date
    '2025-08-05',  -- end_date
    'shipment_date',  -- date_type
    NULL,  -- sku_filter
    NULL   -- region_filter
);

-- Test 2: Function call with SKU filter
SELECT * FROM get_sales_metrics_by_date_type_correct(
    '2025-08-01',  -- start_date
    '2025-08-05',  -- end_date
    'shipment_date',  -- date_type
    12345,  -- sku_filter (replace with actual SKU from your data)
    NULL   -- region_filter
);

-- Test 3: Function call with region filter
SELECT * FROM get_sales_metrics_by_date_type_correct(
    '2025-08-01',  -- start_date
    '2025-08-05',  -- end_date
    'posting_date',  -- date_type
    NULL,  -- sku_filter
    'MOSCOW'   -- region_filter (replace with actual region from your data)
);

-- Test 4: Verify the original function still works
SELECT * FROM get_sales_metrics_by_date_type(
    '2025-08-01',  -- start_date
    '2025-08-05',  -- end_date
    'shipment_date',  -- date_type
    NULL,  -- sku_filter
    NULL   -- region_filter
);

-- Compare results from both functions to ensure they match