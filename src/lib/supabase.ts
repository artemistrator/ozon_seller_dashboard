import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

// Database types based on our schema
export interface PostingFBS {
  id: number;
  posting_number: string;
  order_id: number;
  status: string | null;
  in_process_at: string | null;
  shipment_date: string | null;
  delivering_date: string | null;
  warehouse_id: number | null;
  warehouse_name: string | null;
  sku: number | null;
  offer_id: string | null;
  product_name: string | null;
  quantity: number | null;
  price: number | null;
  price_total: number | null;
  payout: number | null;
  commission_amount: number | null;
  commission_percent: number | null;
  cluster_from: string | null;
  cluster_to: string | null;
}

export interface FinanceTransaction {
  id: number;
  transaction_id: number;
  operation_type: string | null;
  operation_type_name: string | null;
  operation_date: string | null;
  posting_number: string | null;
  order_date: string | null;
  warehouse_id: number | null;
  type: string | null;
  amount: number | null;
  accruals_for_sale: number | null;
  sale_commission: number | null;
  delivery_charge: number | null;
  return_delivery_charge: number | null;
}

export interface FinanceTransactionService {
  id: number;
  transaction_id: number;
  name: string | null;
  price: number | null;
}

export interface FinanceTransactionItem {
  id: number;
  transaction_id: number;
  sku: number | null;
  name: string | null;
}