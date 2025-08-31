-- First, check if the function exists and rename it to preserve it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'get_sales_metrics_by_date_type'
    ) THEN
        -- Rename the existing function to preserve it
        ALTER FUNCTION get_sales_metrics_by_date_type(
            start_date DATE,
            end_date DATE,
            date_type TEXT,
            sku_filter INTEGER,
            region_filter TEXT
        ) RENAME TO old_get_sales_metrics_by_date_type;
    END IF;
END
$$;

-- Create the new function with correct revenue calculation
-- This is the function the frontend tries first
CREATE OR REPLACE FUNCTION get_sales_metrics_by_date_type_correct(
    start_date DATE,
    end_date DATE,
    date_type TEXT DEFAULT 'shipment_date',
    sku_filter INTEGER DEFAULT NULL,
    region_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    total_orders BIGINT,
    total_units BIGINT,
    total_gmv NUMERIC,
    total_revenue NUMERIC,
    total_commissions NUMERIC,
    avg_order_value NUMERIC,
    delivered_orders BIGINT,
    delivered_units BIGINT,
    delivered_gmv NUMERIC,
    delivered_revenue NUMERIC,
    delivered_commissions NUMERIC,
    cancelled_gmv NUMERIC,
    in_delivery_gmv NUMERIC,
    net_profit NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT p.posting_number)::BIGINT as total_orders,
        SUM(p.quantity)::BIGINT as total_units,
        SUM(p.price_total)::NUMERIC as total_gmv,
        -- Using payout as revenue (price_total - commission_amount)
        SUM(p.payout)::NUMERIC as total_revenue,
        SUM(p.commission_amount)::NUMERIC as total_commissions,
        CASE 
            WHEN COUNT(DISTINCT p.posting_number) > 0 
            THEN SUM(p.price_total) / COUNT(DISTINCT p.posting_number)
            ELSE 0 
        END::NUMERIC as avg_order_value,
        COUNT(DISTINCT CASE WHEN p.status = 'delivered' THEN p.posting_number END)::BIGINT as delivered_orders,
        SUM(CASE WHEN p.status = 'delivered' THEN p.quantity ELSE 0 END)::BIGINT as delivered_units,
        SUM(CASE WHEN p.status = 'delivered' THEN p.price_total ELSE 0 END)::NUMERIC as delivered_gmv,
        -- Using payout as revenue for delivered orders
        SUM(CASE WHEN p.status = 'delivered' THEN p.payout ELSE 0 END)::NUMERIC as delivered_revenue,
        SUM(CASE WHEN p.status = 'delivered' THEN p.commission_amount ELSE 0 END)::NUMERIC as delivered_commissions,
        SUM(CASE WHEN p.status = 'cancelled' THEN p.price_total ELSE 0 END)::NUMERIC as cancelled_gmv,
        SUM(CASE WHEN p.status = 'in_delivery' THEN p.price_total ELSE 0 END)::NUMERIC as in_delivery_gmv,
        -- Net profit calculation using payout (revenue) - commissions
        (SUM(p.payout) - SUM(p.commission_amount))::NUMERIC as net_profit
    FROM postings_fbs p
    WHERE 
        CASE 
            WHEN date_type = 'posting_date' THEN 
                p.posting_date >= start_date AND p.posting_date <= end_date
            ELSE 
                p.shipment_date >= start_date AND p.shipment_date <= end_date
        END
        AND (sku_filter IS NULL OR p.sku = sku_filter)
        AND (region_filter IS NULL OR p.region = region_filter);
END;
$$;

-- Also create/update the original function name to ensure compatibility
CREATE OR REPLACE FUNCTION get_sales_metrics_by_date_type(
    start_date DATE,
    end_date DATE,
    date_type TEXT DEFAULT 'shipment_date',
    sku_filter INTEGER DEFAULT NULL,
    region_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    total_orders BIGINT,
    total_units BIGINT,
    total_gmv NUMERIC,
    total_revenue NUMERIC,
    total_commissions NUMERIC,
    avg_order_value NUMERIC,
    delivered_orders BIGINT,
    delivered_units BIGINT,
    delivered_gmv NUMERIC,
    delivered_revenue NUMERIC,
    delivered_commissions NUMERIC,
    cancelled_gmv NUMERIC,
    in_delivery_gmv NUMERIC,
    net_profit NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Call the corrected function to ensure consistent behavior
    RETURN QUERY
    SELECT * FROM get_sales_metrics_by_date_type_correct(
        start_date, end_date, date_type, sku_filter, region_filter
    );
END;
$$;