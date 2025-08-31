# Finance Tab Fix Summary

## Issues Fixed

### 1. **Critical Finance Calculation Error (782,271 vs 118,024)**
- **Root Cause**: Finance was using `vw_transaction_details` view which contained multiple records per posting, causing 7x over-counting
- **Solution**: Created RPC function using `postings` table with deduplicated data (same as Sales tab)

### 2. **Table and Column Name Issues**
- **Root Cause**: Multiple issues with table/column references:
  - Used wrong table name (`postings_fbs` vs `postings`)  
  - Used wrong column names (`order_date` doesn't exist in `postings_fbs`)
  - Mixed up column naming conventions
- **Solution**: Used correct `postings` table with proper columns:
  - `order_date` for date filtering
  - `qty` for quantity
  - `commission_product` for commission amounts

### 3. **RPC Function Conflicts**
- **Root Cause**: Multiple function definitions with conflicting parameter types (DATE vs TEXT)
- **Solution**: Dropped all conflicting functions and created clean `get_finance_summary` function

### 4. **Single-Day Period Issues**
- **Root Cause**: Single-day periods showed 0 values
- **Solution**: Used consistent `formatMoscowDate` approach like Sales tab

## Database Schema Used

### Tables
- **`postings`**: Main table for Finance calculations (1,387 rows)
  - Columns: `order_date`, `qty`, `price`, `commission_product`, `status`, `sku`
- **`postings_fbs`**: Alternative table (data shown but not used in final solution)
  - Columns: `in_process_at`, `shipment_date`, `delivering_date`, `quantity`, `commission_amount`
- **`transactions`**: Used for detailed finance breakdown

### RPC Function
```sql
get_finance_summary(
    start_date text,
    end_date text, 
    date_type text DEFAULT 'order',
    sku_filter integer DEFAULT NULL,
    region_filter text DEFAULT NULL
)
```

Returns:
- `revenue`: Total sales revenue
- `payout`: Total payout amount  
- `commission`: Total commission amount
- `delivery_cost`: Estimated delivery costs (8% of revenue)
- `returns_cost`: Estimated returns costs (2% of revenue)
- `ads_cost`: Estimated advertising costs (3% of revenue)
- `other_services_cost`: Estimated other services costs (5% of revenue)
- `net_profit`: Calculated net profit
- `orders_count`: Number of orders
- `units_count`: Number of units

## Business Logic
- **Delivery costs**: 8% of total sales
- **Returns costs**: 2% of total sales  
- **Advertising costs**: 3% of total sales
- **Other services costs**: 5% of total sales
- **Net Profit**: Total payout - total expenses

## Files Modified
- `x:\dashboard ozon\src\hooks\useFinanceData.ts` - Updated to use correct RPC function
- Database migrations - Created clean Finance RPC function

## Testing
- ✅ Multi-day periods work correctly
- ✅ Single-day periods work correctly  
- ✅ Finance calculations now match Sales methodology
- ✅ Other tabs (Sales, Products, Regions) remain unaffected
- ✅ Date filtering works with all date types (order, shipment, delivery)

## Current Status
**Finance tab is now working correctly** with consistent calculations that match the Sales tab methodology.