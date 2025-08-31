-- Fix Sales RPC function to return correct revenue (payout)
-- This function should return payout as total_revenue

CREATE OR REPLACE FUNCTION get_sales_metrics_by_date_type_correct(
    start_date TEXT,
    end_date TEXT,
    date_type TEXT DEFAULT 'shipment_date',
    sku_filter INTEGER DEFAULT NULL,
    region_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    total_orders BIGINT,
    total_units BIGINT,
    total_gmv NUMERIC,
    total_revenue NUMERIC,  -- This should be payout
    total_commissions NUMERIC,
    avg_order_value NUMERIC,
    delivered_orders BIGINT,
    delivered_units BIGINT,
    delivered_gmv NUMERIC,
    delivered_revenue NUMERIC,  -- This should be delivered payout
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
        COUNT(DISTINCT p.order_id)::BIGINT as total_orders,
        COALESCE(SUM(p.quantity), 0)::BIGINT as total_units,
        COALESCE(SUM(p.price_total), 0)::NUMERIC as total_gmv,
        -- Revenue is payout (price_total - commission_amount)
        COALESCE(SUM(p.payout), 0)::NUMERIC as total_revenue,
        COALESCE(SUM(p.commission_amount), 0)::NUMERIC as total_commissions,
        CASE 
            WHEN COUNT(DISTINCT p.order_id) > 0 
            THEN COALESCE(SUM(p.price_total), 0) / COUNT(DISTINCT p.order_id)
            ELSE 0 
        END::NUMERIC as avg_order_value,
        
        -- Delivered metrics
        COUNT(DISTINCT CASE WHEN p.status = 'delivered' THEN p.order_id END)::BIGINT as delivered_orders,
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.quantity ELSE 0 END), 0)::BIGINT as delivered_units,
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.price_total ELSE 0 END), 0)::NUMERIC as delivered_gmv,
        -- Delivered revenue is delivered payout
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.payout ELSE 0 END), 0)::NUMERIC as delivered_revenue,
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.commission_amount ELSE 0 END), 0)::NUMERIC as delivered_commissions,
        
        -- Other status metrics
        COALESCE(SUM(CASE WHEN p.status = 'cancelled' THEN p.price_total ELSE 0 END), 0)::NUMERIC as cancelled_gmv,
        COALESCE(SUM(CASE WHEN p.status = 'in_delivery' THEN p.price_total ELSE 0 END), 0)::NUMERIC as in_delivery_gmv,
        
        -- Net profit: payout - commission_amount
        COALESCE(SUM(p.payout - p.commission_amount), 0)::NUMERIC as net_profit
        
    FROM postings_fbs p
    WHERE 
        CASE 
            WHEN date_type = 'shipment_date' THEN p.shipment_date
            WHEN date_type = 'delivering_date' THEN p.delivering_date
            WHEN date_type = 'in_process_at' THEN p.in_process_at
            ELSE p.shipment_date
        END >= start_date::DATE
        AND 
        CASE 
            WHEN date_type = 'shipment_date' THEN p.shipment_date
            WHEN date_type = 'delivering_date' THEN p.delivering_date
            WHEN date_type = 'in_process_at' THEN p.in_process_at
            ELSE p.shipment_date
        END <= end_date::DATE
        AND (sku_filter IS NULL OR p.sku = sku_filter)
        AND (region_filter IS NULL OR p.warehouse_name = region_filter);
END;
$$;
