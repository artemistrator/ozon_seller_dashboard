# Ozon Dashboard - RPC Function Updates

This document describes the changes made to fix the RPC functions and data fetching logic in the Ozon Dashboard.

## Changes Made

### 1. Sales Metrics RPC Function Update

**File:** `update_sales_metrics_function.sql`

We've updated the `get_sales_metrics_by_date_type` RPC function to correctly calculate revenue using the formula:
```
payout = price_total - commission_amount
```

The function now:
- Uses the `payout` field directly as revenue instead of calculating it
- Ensures net profit is calculated as `payout - commission_amount`
- Preserves the original function as `old_get_sales_metrics_by_date_type`

### 2. Sales Data Hook Improvements

**File:** `src/hooks/useSalesData.ts`

Updated the sales data hook with better fallback logic:
1. Try `get_sales_metrics_by_date_type_correct` first (new function)
2. Fall back to `get_sales_metrics_by_date_type` (original function)
3. Final fallback to direct table query with manual calculation

Added a `calculateSalesMetricsManually` function that correctly applies the revenue formula.

### 3. Finance Data Hook Improvements

**File:** `src/hooks/useFinanceData.ts`

Updated the finance data hook with proper data fetching logic:
1. Try `dashboard_summary` view first
2. Fall back to `get_finance_summary` RPC function
3. Final fallback to `vw_transaction_details` view
4. Last resort: sample data for debugging

## Business Logic Corrections

### Revenue Calculation
The dashboard now correctly calculates revenue using:
```
revenue = payout (which equals price_total - commission_amount)
```

This ensures that:
- Total Revenue = Sum of all `payout` values
- Net Profit = Total Revenue - Total Commissions
- Delivered Revenue = Sum of `payout` for delivered orders only

### Function Naming
- Original function: `get_sales_metrics_by_date_type` 
- Backup function: `old_get_sales_metrics_by_date_type`
- New corrected function: `get_sales_metrics_by_date_type_correct`

## Testing

Use the `test_sales_metrics_function.sql` script to verify the functions work correctly.

## Deployment

1. Execute `update_sales_metrics_function.sql` on your Supabase database
2. Deploy the updated frontend code
3. Verify the calculations match the expected values:
   - Dashboard Sales revenue should now match direct SQL queries
   - Net profit calculations should be accurate

## Verification Queries

To verify the fix worked, you can run these queries:

```sql
-- Check that both functions exist
SELECT proname FROM pg_proc WHERE proname LIKE '%get_sales_metrics%';

-- Test the corrected function
SELECT * FROM get_sales_metrics_by_date_type_correct('2025-08-01', '2025-08-05', 'shipment_date');

-- Compare with direct query
SELECT 
  SUM(payout) as direct_revenue,
  SUM(price_total) as total_gmv,
  SUM(commission_amount) as total_commissions
FROM postings_fbs 
WHERE shipment_date >= '2025-08-01' AND shipment_date < '2025-08-05';
```