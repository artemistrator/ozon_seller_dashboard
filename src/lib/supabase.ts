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

// Database types based on existing schema
export interface Posting {
  id: number;
  posting_number: string;
  order_date: string | null;
  status: string | null;
  sku: number | null;
  offer_id: string | null;
  qty: number | null;
  price: number | null;
  payout: number | null;
  commission_product: number | null;
  warehouse_id: number | null;
  raw: any | null;
}

export interface Transaction {
  id: number;
  operation_id: number;
  posting_number: string | null;
  operation_type: string | null;
  operation_type_name: string | null;
  operation_date: string | null;
  amount: number | null;
  type: string | null;
  raw: any | null;
}

export interface TransactionService {
  id: number;
  operation_id: number;
  name: string | null;
  price: number | null;
}

// Legacy interfaces for backward compatibility
export interface PostingFBS extends Posting {
  order_id: number;
  in_process_at: string | null;
  shipment_date: string | null;
  delivering_date: string | null;
  warehouse_name: string | null;
  product_name: string | null;
  quantity: number | null;
  price_total: number | null;
  commission_amount: number | null;
  commission_percent: number | null;
  cluster_from: string | null;
  cluster_to: string | null;
}

export interface FinanceTransaction extends Transaction {
  transaction_id: number;
  order_date: string | null;
  warehouse_id: number | null;
  accruals_for_sale: number | null;
  sale_commission: number | null;
  delivery_charge: number | null;
  return_delivery_charge: number | null;
}

export interface FinanceTransactionService extends TransactionService {
  transaction_id: number;
}

export interface FinanceTransactionItem {
  id: number;
  transaction_id: number;
  sku: number | null;
  name: string | null;
}