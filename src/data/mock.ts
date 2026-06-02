import { Product, Order, Customer, LedgerEntry } from '../types';

export const mockLedger: LedgerEntry[] = [
  { id: 'l1', type: 'expense', description: 'Biaya Iklan Facebook Ads', amount: 500000, date: '2023-10-13' },
  { id: 'l2', type: 'expense', description: 'Pembayaran Listrik & Internet', amount: 1000000, date: '2023-10-16' },
];

export const mockProducts: Product[] = [
  {
    id: "p1",
    title: "iPhone 15 Pro",
    description: "Titanium. So strong. So light. So Pro. The ultimate iPhone experience.",
    price: 15000000,
    costPrice: 13000000,
    category: "Smartphone",
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800",
    stock: 45
  },
  {
    id: "p2",
    title: "MacBook Air M2",
    description: "Don't take it lightly. Supercharged by M2. Up to 18 hours of battery life.",
    price: 18500000,
    costPrice: 15500000,
    category: "Laptop",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800",
    stock: 20
  },
  {
    id: "p3",
    title: "AirPods Pro",
    description: "Remastered from every note. Richer audio quality. Active Noise Cancellation.",
    price: 3500000,
    costPrice: 28000000,
    category: "Audio",
    imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=800",
    stock: 120,
    discount: 10
  },
  {
    id: "p4",
    title: "iPad Pro",
    description: "The ultimate iPad experience. Now with breakthrough M4 performance.",
    price: 13000000,
    costPrice: 11000000,
    category: "Tablet",
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=800",
    stock: 30
  },
  {
    id: "p5",
    title: "Apple Watch Series 9",
    description: "Smarter. Brighter. Mightier. With the most advanced health features.",
    price: 6500000,
    costPrice: 5000000,
    category: "Watch",
    imageUrl: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&q=80&w=800",
    stock: 55
  },
  {
    id: "p6",
    title: "MagSafe Charger",
    description: "Makes wireless charging a snap. Perfectly aligned magnets.",
    price: 650000,
    costPrice: 400000,
    category: "Aksesori",
    imageUrl: "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?auto=format&fit=crop&q=80&w=800",
    stock: 200
  }
];

export const mockOrders: Order[] = [
  {
    id: "ORD-001",
    items: [{ product: mockProducts[0], quantity: 1 }],
    totalAmount: 15000000,
    status: 'Selesai',
    date: '2023-10-12',
    customerName: 'Budi Santoso',
    paymentMethod: 'BCA'
  },
  {
    id: "ORD-002",
    items: [{ product: mockProducts[2], quantity: 2 }],
    totalAmount: 7000000,
    status: 'Dikirim',
    date: '2023-10-15',
    customerName: 'Siti Rahma',
    paymentMethod: 'GoPay'
  },
  {
    id: "ORD-003",
    items: [{ product: mockProducts[1], quantity: 1 }],
    totalAmount: 18500000,
    status: 'Diproses',
    date: '2023-10-16',
    customerName: 'Andi Wijaya',
    paymentMethod: 'Mandiri'
  },
  {
    id: "ORD-004",
    items: [{ product: mockProducts[3], quantity: 1 }, { product: mockProducts[5], quantity: 1 }],
    totalAmount: 13650000,
    status: 'Menunggu Pembayaran',
    date: '2023-10-16',
    customerName: 'Ayu Lestari',
    paymentMethod: 'DANA'
  }
];

export const mockCustomers: Customer[] = [
  { id: "c1", name: 'Budi Santoso', email: 'budi@example.com', points: 1500 },
  { id: "c2", name: 'Siti Rahma', email: 'siti@example.com', points: 300 },
  { id: "c3", name: 'Andi Wijaya', email: 'andi@example.com', points: 50 },
  { id: "c4", name: 'Ayu Lestari', email: 'ayu@example.com', points: 0 },
];

export const salesData = [
  { name: 'Jan', total: 15000000 },
  { name: 'Feb', total: 20000000 },
  { name: 'Mar', total: 18000000 },
  { name: 'Apr', total: 30000000 },
  { name: 'May', total: 25000000 },
  { name: 'Jun', total: 45000000 },
  { name: 'Jul', total: 35000000 },
];
