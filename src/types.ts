export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  costPrice?: number;
  category: string;
  imageUrl: string;
  stock: number;
  discount?: number;
}

export interface LedgerEntry {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Menunggu Pembayaran' | 'Diproses' | 'Dikirim' | 'Selesai';
  date: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  points: number;
}

export interface Promotion {
  id: string;
  code: string;
  discountPercentage: number;
  isActive: boolean;
  validUntil: string;
  applicableProductIds: string[];
}
