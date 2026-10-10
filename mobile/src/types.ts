export interface Product {
  id: number;
  name: string;
  barcode: string;
  category: string;
  cost_price: number;
  selling_price: number;
  stock: number;
  sold_last_7_days?: number;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: number;
  payment_method: string;
  total_amount: number;
  created_at: string;
  profit?: number;
}

export interface TransactionItem {
  quantity: number;
  price: number;
  name: string;
}

export interface PurchaseItem {
  productId: number;
  name: string;
  barcode: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  oldStock: number;
}

export interface PurchaseRecord {
  id: number;
  product_name: string;
  quantity: number;
  cost_price: number;
  total_cost: number;
  created_at: string;
  invoice_title?: string;
  supplier?: string;
}

export interface ShoppingItem {
  id: number;
  product_id: number;
  quantity: number;
  is_checked: number;
  name: string;
  barcode: string;
  stock: number;
  cost_price: number;
  selling_price: number;
  sold_last_7_days?: number;
  category?: string;
}

export interface StockHistoryItem {
  id: number;
  product_id: number;
  change_amount: number;
  reason: string;
  reference_id?: number | null;
  created_at: string;
}

export interface DashboardStats {
  revenue: number;
  tunai: number;
  qris: number;
  totalTrx: number;
  expense: number;
  cogs: number;
  purchases: number;
  bestSellers: { name: string; total_sold: number }[];
  lowStock: { name: string; stock: number; barcode: string }[];
  purchaseInvoices?: { invoice_title: string; supplier: string; date: string; total: number }[];
}
