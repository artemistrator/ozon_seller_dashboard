-- Create Finance RPC function for Ozon Dashboard
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
        
        -- Delivery: estimated as 8% of sales
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.payout * 0.08 ELSE 0 END), 0)::NUMERIC as delivery,
        
        -- Returns: estimated as 2% of sales
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.payout * 0.02 ELSE 0 END), 0)::NUMERIC as returns,
        
        -- Ads: estimated as 3% of sales
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.payout * 0.03 ELSE 0 END), 0)::NUMERIC as ads,
        
        -- Services: estimated as 5% of sales
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.payout * 0.05 ELSE 0 END), 0)::NUMERIC as services,
        
        -- Total income: sum of all payouts
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.payout ELSE 0 END), 0)::NUMERIC as total_income,
        
        -- Total expenses: sum of all costs
        COALESCE(
            SUM(CASE WHEN p.status = 'delivered' THEN 
                p.commission_amount + (p.payout * 0.18) -- commission + delivery + returns + ads + services
            ELSE 0 END), 0
        )::NUMERIC as total_expenses,
        
        -- Net profit: total income - total expenses
        COALESCE(
            SUM(CASE WHEN p.status = 'delivered' THEN 
                p.payout - p.commission_amount - (p.payout * 0.18)
            ELSE 0 END), 0
        )::NUMERIC as net_profit,
        
        -- Orders count
        COUNT(DISTINCT CASE WHEN p.status = 'delivered' THEN p.posting_number END)::BIGINT as orders_count,
        
        -- Units count
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.quantity ELSE 0 END), 0)::BIGINT as units_count
        
    FROM postings_fbs p
    WHERE 
        CASE 
            WHEN date_type = 'posting_date' THEN 
                p.posting_date >= start_date::DATE AND p.posting_date <= end_date::DATE
            WHEN date_type = 'shipment_date' THEN 
                p.shipment_date >= start_date::DATE AND p.shipment_date <= end_date::DATE
            WHEN date_type = 'delivering_date' THEN 
                p.delivering_date >= start_date::DATE AND p.delivering_date <= end_date::DATE
            ELSE 
                p.shipment_date >= start_date::DATE AND p.shipment_date <= end_date::DATE
        END
        AND (sku_filter IS NULL OR p.sku = sku_filter)
        AND (region_filter IS NULL OR p.warehouse_name ILIKE '%' || region_filter || '%');
END;
$$;
