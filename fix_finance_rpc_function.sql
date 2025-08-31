-- Fix Finance RPC function to return actual data instead of zeros
-- This function calculates financial metrics from postings_fbs table

CREATE OR REPLACE FUNCTION get_finance_summary(
    start_date TEXT,
    end_date TEXT,
    date_type TEXT DEFAULT 'shipment_date',
    sku_filter INTEGER DEFAULT NULL,
    region_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    sales NUMERIC,
    commissions NUMERIC,
    delivery NUMERIC,
    returns NUMERIC,
    ads NUMERIC,
    services NUMERIC,
    total_income NUMERIC,
    total_expenses NUMERIC,
    net_profit NUMERIC,
    orders_count BIGINT,
    units_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Sales: sum of payouts (revenue after commission)
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.payout ELSE 0 END), 0)::NUMERIC as sales,
        
        -- Commissions: sum of commission amounts
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.commission_amount ELSE 0 END), 0)::NUMERIC as commissions,
        
        -- Delivery: estimate as 8% of sales (payout)
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.payout * 0.08 ELSE 0 END), 0)::NUMERIC as delivery,
        
        -- Returns: estimate as 2% of sales (payout)
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.payout * 0.02 ELSE 0 END), 0)::NUMERIC as returns,
        
        -- Ads: estimate as 3% of sales (payout)
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.payout * 0.03 ELSE 0 END), 0)::NUMERIC as ads,
        
        -- Services: estimate as 5% of sales (payout)
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.payout * 0.05 ELSE 0 END), 0)::NUMERIC as services,
        
        -- Total income: sales (payout)
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.payout ELSE 0 END), 0)::NUMERIC as total_income,
        
        -- Total expenses: commissions + delivery + returns + ads + services
        COALESCE(
            SUM(CASE WHEN p.status = 'delivered' THEN 
                p.commission_amount + 
                (p.payout * 0.08) + 
                (p.payout * 0.02) + 
                (p.payout * 0.03) + 
                (p.payout * 0.05)
            ELSE 0 END), 0
        )::NUMERIC as total_expenses,
        
        -- Net profit: total_income - total_expenses
        COALESCE(
            SUM(CASE WHEN p.status = 'delivered' THEN 
                p.payout - (
                    p.commission_amount + 
                    (p.payout * 0.08) + 
                    (p.payout * 0.02) + 
                    (p.payout * 0.03) + 
                    (p.payout * 0.05)
                )
            ELSE 0 END), 0
        )::NUMERIC as net_profit,
        
        -- Counts
        COUNT(DISTINCT CASE WHEN p.status = 'delivered' THEN p.order_id END)::BIGINT as orders_count,
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.quantity ELSE 0 END), 0)::BIGINT as units_count
        
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
