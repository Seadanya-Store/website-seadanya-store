import React, { useState, useEffect } from 'react';
import { Package, Users, ShoppingCart, DollarSign, LogOut, Wallet, TrendingUp, TrendingDown, Edit2, Plus, Trash2, X } from 'lucide-react';
import heic2any from 'heic2any';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { salesData } from '../data/mock';
import { APP_CATEGORIES } from '../data/categories';
import { Product, LedgerEntry, Order, Promotion } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Tag } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';


// ─── Types ────────────────────────────────────────────────────────────────────

type ModalMode = 'add' | 'edit' | 'stock';
type FilterMode = 'all' | 'date' | 'month';
type OrderStatus = 'Menunggu Pembayaran' | 'Selesai';
type LedgerType = 'income' | 'expense';

interface ProductFormData {
  title: string;
  category: string;
  price: string;
  costPrice: string;
  stock: string;
  discount: string;
  imageUrl: string;
  description: string;
}

interface Testimonial {
  id: string;
  imageUrl: string;
  date: string;
}

interface LedgerFormData {
  type: LedgerType;
  desc: string;
  amount: string;
  date: string;
}

interface PromoFormData {
  code: string;
  discountPercentage: string;
  validUntil: string;
  isActive: boolean;
  applicableProductIds: string[];
}

interface AdminDashboardProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  ledger: LedgerEntry[];
  setLedger: React.Dispatch<React.SetStateAction<LedgerEntry[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  promotions: Promotion[];
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  onLogout: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ORDER_STATUSES: OrderStatus[] = [
  'Menunggu Pembayaran',
  'Selesai',
];

function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

const EMPTY_PRODUCT_FORM: ProductFormData = {
  title: '',
  category: '',
  price: '',
  costPrice: '',
  stock: '',
  discount: '',
  imageUrl: '',
  description: '',
};

const EMPTY_PROMO_FORM: PromoFormData = {
  code: '',
  discountPercentage: '',
  validUntil: '',
  isActive: true,
  applicableProductIds: [],
};

function makeLedgerForm(entry?: LedgerEntry): LedgerFormData {
  if (entry) {
    return {
      type: entry.type,
      desc: entry.description,
      amount: entry.amount.toString(),
      date: entry.date,
    };
  }
  return {
    type: 'expense',
    desc: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminDashboard({
  products,
  setProducts,
  ledger,
  setLedger,
  orders,
  setOrders,
  promotions,
  setPromotions,
  onLogout,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'bookkeeping' | 'promotions' | 'testimonials'>('overview');

  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // ── Product Modal ──────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(EMPTY_PRODUCT_FORM);

  // ── Ledger Modal ───────────────────────────────────────────────────────────
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [ledgerEditingId, setLedgerEditingId] = useState<string | null>(null);
  const [ledgerFormData, setLedgerFormData] = useState<LedgerFormData>(makeLedgerForm());

  const openLedgerModal = (entry?: LedgerEntry): void => {
    setLedgerEditingId(entry?.id ?? null);
    setLedgerFormData(makeLedgerForm(entry));
    setIsLedgerModalOpen(true);
  };

  const handleLedgerSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (ledgerEditingId) {
      setLedger(prev =>
        prev.map(l =>
          l.id === ledgerEditingId
            ? {
                ...l,
                type: ledgerFormData.type,
                description: ledgerFormData.desc,
                amount: Number(ledgerFormData.amount),
                date: ledgerFormData.date,
              }
            : l
        )
      );
    } else {
      const newEntry: LedgerEntry = {
        id: `LEDG-${Date.now()}`,
        type: ledgerFormData.type,
        description: ledgerFormData.desc,
        amount: Number(ledgerFormData.amount),
        date: ledgerFormData.date,
      };
      setLedger(prev => [...prev, newEntry]);
    }
    setIsLedgerModalOpen(false);
  };

  const handleDeleteLedger = (id: string): void => {
    setLedger(prev => prev.filter(l => l.id !== id));
  };

  // ── Order Modal ────────────────────────────────────────────────────────────
    const handleToggleOrderStatus = (orderId: string): void => {
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? { ...o, status: o.status === 'Selesai' ? 'Menunggu Pembayaran' : 'Selesai' }
          : o
      )
    );
  };

  const handleDeleteOrder = (id: string): void => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  // ── Product Form ───────────────────────────────────────────────────────────
  const openFormModal = (mode: ModalMode, product?: Product): void => {
    setModalMode(mode);
    if (product) {
      setEditingId(product.id);
      setFormData({
        title: product.title,
        category: product.category,
        price: product.price.toString(),
        costPrice: product.costPrice?.toString() ?? '',
        stock: mode === 'stock' ? '' : product.stock.toString(),
        discount: product.discount?.toString() ?? '',
        imageUrl: product.imageUrl ?? '',
        description: product.description,
      });
    } else {
      setEditingId(null);
      setFormData(EMPTY_PRODUCT_FORM);
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (modalMode === 'add') {
      const newProduct: Product = {
        id: `PROD-${Date.now()}`,
        title: formData.title,
        category: formData.category,
        price: Number(formData.price),
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        stock: Number(formData.stock),
        imageUrl: formData.imageUrl,
        description: formData.description,
        discount: formData.discount ? Number(formData.discount) : undefined,
      };
      setProducts(prev => [...prev, newProduct]);
    } else if (modalMode === 'edit') {
      setProducts(prev =>
        prev.map(p =>
          p.id === editingId
            ? {
                ...p,
                title: formData.title,
                category: formData.category,
                price: Number(formData.price),
                costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
                stock: Number(formData.stock),
                imageUrl: formData.imageUrl,
                description: formData.description,
                discount: formData.discount ? Number(formData.discount) : undefined,
              }
            : p
        )
      );
    } else if (modalMode === 'stock') {
      setProducts(prev =>
        prev.map(p =>
          p.id === editingId
            ? { ...p, stock: p.stock + Number(formData.stock) }
            : p
        )
      );
    }
    setIsModalOpen(false);
  };

  const handleDeleteProduct = (id: string): void => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // ── Image Upload ───────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    let file = e.target.files?.[0];
    if (!file) return;

    try {
      const isHeic =
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif');

      if (isHeic) {
        // heic2any can return Blob or Blob[] depending on the source
        const converted = await heic2any({ blob: file, toType: 'image/jpeg' });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        file = new File([blob], file.name.replace(/\.heic$/i, '.jpeg'), {
          type: 'image/jpeg',
        });
      }

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = (): void => {
        const MAX_SIZE = 800;
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round(height * (MAX_SIZE / width));
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round(width * (MAX_SIZE / height));
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Could not get 2D canvas context');
          URL.revokeObjectURL(objectUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const resizedBase64 = canvas.toDataURL('image/webp', 0.8);
        setFormData(prev => ({ ...prev, imageUrl: resizedBase64 }));
        URL.revokeObjectURL(objectUrl);
      };

      img.onerror = (): void => {
        console.error('Failed to load image for resizing');
        URL.revokeObjectURL(objectUrl);
      };

      img.src = objectUrl;
    } catch (err) {
      console.error('Error processing image:', err);
      alert('Gagal memproses gambar. Pastikan format didukung.');
    }
  };

  // ── Promo Modal ────────────────────────────────────────────────────────────
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoEditingId, setPromoEditingId] = useState<string | null>(null);
  const [promoFormData, setPromoFormData] = useState<PromoFormData>(EMPTY_PROMO_FORM);

  const openPromoModal = (promo?: Promotion): void => {
    if (promo) {
      setPromoEditingId(promo.id);
      setPromoFormData({
        code: promo.code,
        discountPercentage: promo.discountPercentage.toString(),
        validUntil: promo.validUntil ?? '',
        isActive: promo.isActive,
        applicableProductIds: promo.applicableProductIds ?? [],
      });
    } else {
      setPromoEditingId(null);
      setPromoFormData(EMPTY_PROMO_FORM);
    }
    setIsPromoModalOpen(true);
  };

  const handlePromoSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const upperCode = promoFormData.code.toUpperCase();
    if (promoEditingId) {
      setPromotions(prev =>
        prev.map(p =>
          p.id === promoEditingId
            ? {
                ...p,
                code: upperCode,
                discountPercentage: Number(promoFormData.discountPercentage),
                validUntil: promoFormData.validUntil || undefined,
                isActive: promoFormData.isActive,
                applicableProductIds: promoFormData.applicableProductIds,
              }
            : p
        )
      );
    } else {
      const newPromo: Promotion = {
        id: `PROMO-${Date.now()}`,
        code: upperCode,
        discountPercentage: Number(promoFormData.discountPercentage),
        validUntil: promoFormData.validUntil || undefined,
        isActive: promoFormData.isActive,
        applicableProductIds: promoFormData.applicableProductIds,
      };
      setPromotions(prev => [...prev, newPromo]);
    }
    setIsPromoModalOpen(false);
  };

  const handleDeletePromo = (id: string): void => {
    setPromotions(prev => prev.filter(p => p.id !== id));
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredOrders = orders.filter(order => {
    if (filterMode === 'all') return true;
    if (filterMode === 'date') return order.date.startsWith(filterDate);
    if (filterMode === 'month') return order.date.startsWith(filterMonth);
    return true;
  });

  const filteredLedger = ledger.filter(l => {
    if (filterMode === 'all') return true;
    if (filterMode === 'date') return l.date.startsWith(filterDate);
    if (filterMode === 'month') return l.date.startsWith(filterMonth);
    return true;
  });

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExportLedger = (): void => {
  const wb = XLSX.utils.book_new();

  // ── Warna & Style Helper ───────────────────────────────────────────────────
  // (SheetJS Community Edition tidak support rich styling — untuk style penuh
  //  gunakan SheetJS Pro. Di bawah ini pakai struktur data yang rapi saja.)

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 1: RINGKASAN EKSEKUTIF
  // ══════════════════════════════════════════════════════════════════════════
  const totalOrderRev = filteredOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalLedgerInc = filteredLedger
    .filter(l => l.type === 'income')
    .reduce((s, l) => s + l.amount, 0);
  const totalRev = totalOrderRev + totalLedgerInc;

  const totalModalCalc = filteredOrders.reduce((sum, order) =>
    sum + order.items.reduce((itemSum, item) => {
      const cost = item.product.costPrice ?? item.product.price * 0.65;
      return itemSum + cost * item.quantity;
    }, 0), 0);

  const totalOpex = filteredLedger
    .filter(l => l.type === 'expense')
    .reduce((s, l) => s + l.amount, 0);
  const netProfitCalc = totalRev - totalModalCalc - totalOpex;
  const marginPct = totalRev > 0 ? ((netProfitCalc / totalRev) * 100).toFixed(1) : '0.0';

  const periodLabel =
    filterMode === 'date' ? filterDate :
    filterMode === 'month' ? filterMonth : 'Semua Waktu';

  const summaryData = [
    ['LAPORAN KEUANGAN — SEADANYA STORE'],
    [`Periode: ${periodLabel}`],
    [`Diekspor: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`],
    [],
    ['RINGKASAN EKSEKUTIF'],
    ['Keterangan', 'Jumlah (Rp)'],
    ['Total Pendapatan (Omzet)', totalRev],
    ['  ↳ Dari Pesanan', totalOrderRev],
    ['  ↳ Dari Kas Manual', totalLedgerInc],
    ['Total Modal / HPP', totalModalCalc],
    ['Total Pengeluaran Operasional', totalOpex],
    ['─────────────────────────', '─────────────'],
    ['LABA BERSIH', netProfitCalc],
    ['Margin Keuntungan (%)', `${marginPct}%`],
    [],
    ['Total Transaksi Pesanan', filteredOrders.length],
    ['Total Entri Kas Manual', filteredLedger.length],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 38 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, '📊 Ringkasan');

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 2: DATA PESANAN
  // ══════════════════════════════════════════════════════════════════════════
  const orderRows: (string | number)[][] = [
    ['DATA PESANAN'],
    [`Periode: ${periodLabel}`],
    [],
    [
      'ID Pesanan', 'Tanggal', 'Pelanggan', 'Status',
      'Item', 'Modal (Rp)', 'Harga Jual (Rp)', 'Laba Kotor (Rp)',
    ],
  ];

  // Subtotal per bulan
  const ordersByMonth: Record<string, typeof filteredOrders> = {};
  filteredOrders.forEach(order => {
    const month = order.date.slice(0, 7); // "YYYY-MM"
    if (!ordersByMonth[month]) ordersByMonth[month] = [];
    ordersByMonth[month].push(order);
  });

  Object.entries(ordersByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([month, monthOrders]) => {
      // Header bulan
      const [y, m] = month.split('-');
      const monthLabel = new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      orderRows.push([`── ${monthLabel} ──`, '', '', '', '', '', '', '']);

      let monthRev = 0, monthModal = 0;

      monthOrders.forEach(order => {
        const modal = order.items.reduce((s, item) => {
          const cost = item.product.costPrice ?? item.product.price * 0.65;
          return s + cost * item.quantity;
        }, 0);
        const itemNames = order.items.map(i => `${i.product.title} x${i.quantity}`).join(', ');
        const labaKotor = order.totalAmount - modal;
        monthRev += order.totalAmount;
        monthModal += modal;

        orderRows.push([
          order.id,
          new Date(order.date).toLocaleDateString('id-ID'),
          order.customerName,
          order.status,
          itemNames,
          modal,
          order.totalAmount,
          labaKotor,
        ]);
      });

      // Subtotal baris
      orderRows.push([
        `SUBTOTAL ${monthLabel}`, '', '', '', '',
        monthModal, monthRev, monthRev - monthModal,
      ]);
      orderRows.push([]);
    });

  const wsOrders = XLSX.utils.aoa_to_sheet(orderRows);
  wsOrders['!cols'] = [
    { wch: 20 }, { wch: 14 }, { wch: 20 }, { wch: 24 },
    { wch: 40 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsOrders, '🛒 Pesanan');

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 3: KAS MANUAL (LEDGER)
  // ══════════════════════════════════════════════════════════════════════════
  const ledgerRows: (string | number)[][] = [
    ['KAS MANUAL — ARUS KAS'],
    [`Periode: ${periodLabel}`],
    [],
    ['ID Transaksi', 'Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Jumlah (Rp)', 'Laba Bersih Kumulatif (Rp)'],
  ];

  // Kelompok per bulan + deteksi kategori otomatis dari kata kunci
  const detectCategory = (desc: string): string => {
    const d = desc.toLowerCase();
    if (d.includes('listrik') || d.includes('air') || d.includes('internet')) return 'Utilitas';
    if (d.includes('gaji') || d.includes('pegawai') || d.includes('karyawan')) return 'SDM';
    if (d.includes('iklan') || d.includes('promosi') || d.includes('marketing')) return 'Marketing';
    if (d.includes('sewa') || d.includes('rental')) return 'Sewa';
    if (d.includes('beli') || d.includes('stok') || d.includes('produk')) return 'Pembelian Stok';
    if (d.includes('pajak') || d.includes('tax')) return 'Pajak';
    if (d.includes('penjualan') || d.includes('jual') || d.includes('bayar')) return 'Penjualan';
    return 'Lain-lain';
  };

  const ledgerByMonth: Record<string, typeof filteredLedger> = {};
  filteredLedger.forEach(l => {
    const month = l.date.slice(0, 7);
    if (!ledgerByMonth[month]) ledgerByMonth[month] = [];
    ledgerByMonth[month].push(l);
  });

  let cumulativeNet = 0;

  Object.entries(ledgerByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([month, entries]) => {
      const [y, m] = month.split('-');
      const monthLabel = new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      ledgerRows.push([`── ${monthLabel} ──`, '', '', '', '', '', '']);

      let monthIncome = 0, monthExpense = 0;

      entries.forEach(trx => {
        const isIncome = trx.type === 'income';
        const signed = isIncome ? trx.amount : -trx.amount;
        cumulativeNet += signed;
        monthIncome += isIncome ? trx.amount : 0;
        monthExpense += !isIncome ? trx.amount : 0;

        ledgerRows.push([
          trx.id,
          new Date(trx.date).toLocaleDateString('id-ID'),
          isIncome ? 'Pemasukan' : 'Pengeluaran',
          detectCategory(trx.description),
          trx.description,
          isIncome ? trx.amount : -trx.amount,
          cumulativeNet,
        ]);
      });

      ledgerRows.push([
        `SUBTOTAL ${monthLabel}`, '', '', '', '',
        monthIncome - monthExpense, '',
      ]);
      ledgerRows.push([]);
    });

  const wsLedger = XLSX.utils.aoa_to_sheet(ledgerRows);
  wsLedger['!cols'] = [
    { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 18 },
    { wch: 36 }, { wch: 22 }, { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, wsLedger, '📒 Kas Manual');

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 4: REKAP LABA RUGI PER BULAN
  // ══════════════════════════════════════════════════════════════════════════
  const allMonths = Array.from(new Set([
    ...filteredOrders.map(o => o.date.slice(0, 7)),
    ...filteredLedger.map(l => l.date.slice(0, 7)),
  ])).sort();

  const plRows: (string | number)[][] = [
    ['REKAP LABA RUGI PER BULAN'],
    [`Periode: ${periodLabel}`],
    [],
    ['Bulan', 'Pendapatan Pesanan (Rp)', 'Pendapatan Kas (Rp)', 'Total Pendapatan (Rp)',
     'Modal HPP (Rp)', 'Biaya Operasional (Rp)', 'Laba Bersih (Rp)', 'Margin (%)'],
  ];

  let grandRev = 0, grandModal = 0, grandOpex = 0, grandProfit = 0;

  allMonths.forEach(month => {
    const [y, m] = month.split('-');
    const monthLabel = new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const monthOrders = filteredOrders.filter(o => o.date.startsWith(month));
    const monthLedger = filteredLedger.filter(l => l.date.startsWith(month));

    const revOrders = monthOrders.reduce((s, o) => s + o.totalAmount, 0);
    const revLedger = monthLedger.filter(l => l.type === 'income').reduce((s, l) => s + l.amount, 0);
    const totalRevMonth = revOrders + revLedger;
    const modalMonth = monthOrders.reduce((sum, order) =>
      sum + order.items.reduce((s, item) => {
        const cost = item.product.costPrice ?? item.product.price * 0.65;
        return s + cost * item.quantity;
      }, 0), 0);
    const opexMonth = monthLedger.filter(l => l.type === 'expense').reduce((s, l) => s + l.amount, 0);
    const profitMonth = totalRevMonth - modalMonth - opexMonth;
    const marginMonth = totalRevMonth > 0 ? ((profitMonth / totalRevMonth) * 100).toFixed(1) : '0.0';

    grandRev += totalRevMonth;
    grandModal += modalMonth;
    grandOpex += opexMonth;
    grandProfit += profitMonth;

    plRows.push([
      monthLabel, revOrders, revLedger, totalRevMonth,
      modalMonth, opexMonth, profitMonth, `${marginMonth}%`,
    ]);
  });

  // Grand Total
  const grandMargin = grandRev > 0 ? ((grandProfit / grandRev) * 100).toFixed(1) : '0.0';
  plRows.push([]);
  plRows.push([
    'GRAND TOTAL', '', '', grandRev,
    grandModal, grandOpex, grandProfit, `${grandMargin}%`,
  ]);

  const wsPL = XLSX.utils.aoa_to_sheet(plRows);
  wsPL['!cols'] = [
    { wch: 20 }, { wch: 24 }, { wch: 22 }, { wch: 24 },
    { wch: 20 }, { wch: 24 }, { wch: 20 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPL, '📈 Laba Rugi Bulanan');

  // ── Simpan file ────────────────────────────────────────────────────────────
  const fileName = `Laporan_Keuangan_SeadanyaStore_${periodLabel.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

  // ── Derived Financials ─────────────────────────────────────────────────────
  const totalOrderRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalLedgerIncome = filteredLedger
    .filter(l => l.type === 'income')
    .reduce((sum, l) => sum + l.amount, 0);
  const totalRevenue = totalOrderRevenue + totalLedgerIncome;

  const totalOrderModal = filteredOrders.reduce((sum, order) => {
    return (
      sum +
      order.items.reduce((itemSum, item) => {
        const itemCost = item.product.costPrice ?? item.product.price * 0.65;
        return itemSum + itemCost * item.quantity;
      }, 0)
    );
  }, 0);

  const totalModal = totalOrderModal;
  const operationalExpenses = filteredLedger
    .filter(l => l.type === 'expense')
    .reduce((sum, l) => sum + l.amount, 0);
  const netProfit = totalRevenue - totalModal - operationalExpenses;

  const activeCustomers = new Set(
  filteredOrders.map(o =>
    (o.customerEmail && o.customerEmail.trim() !== '')
      ? o.customerEmail.toLowerCase()
      : o.customerName.toLowerCase()
  )
).size;

  // ── Tooltip Formatter ──────────────────────────────────────────────────────
  const tooltipFormatter = (value: number | string | undefined): [string, string] => {
  const num = typeof value === 'number' ? value : Number(value ?? 0) || 0;
  return [`Rp ${num.toLocaleString('id-ID')}`, 'Pendapatan'];
};

  // ── Testimonial State ──────────────────────────────────────────────────────
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isTestimonialsLoading, setIsTestimonialsLoading] = useState(false);
  const [isDeletingTestimonial, setIsDeletingTestimonial] = useState<string | null>(null);
  const [isEditingTestimonial, setIsEditingTestimonial] = useState<string | null>(null);

  // ── Fetch Testimonials ─────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'testimonials') return;
    const fetchTestimonials = async () => {
      setIsTestimonialsLoading(true);
      const { data, error } = await supabase
        .from('testimonials')
        .select('id, image_url, created_at')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setTestimonials(data.map((row: any) => ({
          id: row.id,
          imageUrl: row.image_url || '',
          date: row.created_at,
        })));
      }
      setIsTestimonialsLoading(false);
    };
    fetchTestimonials();
  }, [activeTab]);

  // ── Delete Testimonial ─────────────────────────────────────────────────────
  const handleAdminDeleteTestimonial = async (id: string, imageUrl: string) => {
    if (!window.confirm('Hapus testimoni ini secara permanen?')) return;
    setIsDeletingTestimonial(id);
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)
        .select(); // <- penting: agar tahu berapa baris yang benar2 terhapus

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Tidak ada baris yang terhapus (kemungkinan diblokir RLS).');
      }

      // Hapus file storage SETELAH row DB berhasil dihapus
      if (imageUrl) {
        const filePath = imageUrl.split('/testimonial-images/')[1]?.split('?')[0];
        if (filePath) {
          await supabase.storage.from('testimonial-images').remove([filePath]);
        }
      }

      setTestimonials(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Gagal menghapus:', err);
      alert('Gagal menghapus testimoni. ' + (err instanceof Error ? err.message : ''));
    } finally {
      setIsDeletingTestimonial(null);
    }
  };

  // ── Edit/Replace Testimonial Image ─────────────────────────────────────────
  const handleAdminEditTestimonial = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;
    setIsEditingTestimonial(id);
    try {
      const isHeic =
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif');

      if (isHeic) {
        const converted = await heic2any({ blob: file, toType: 'image/jpeg' });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        file = new File([blob], file.name.replace(/\.heic$/i, '.jpeg'), { type: 'image/jpeg' });
      }

      const resizedFile = await new Promise<File>((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file!);
        const img = new Image();
        img.onload = () => {
          const MAX_SIZE = 600;
          let { width, height } = img;
          if (width > height) {
            if (width > MAX_SIZE) { height = Math.round(height * MAX_SIZE / width); width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width = Math.round(width * MAX_SIZE / height); height = MAX_SIZE; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          canvas.toBlob(blob => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) return reject(new Error('Blob null'));
            resolve(new File([blob], `testimonial-${Date.now()}.webp`, { type: 'image/webp' }));
          }, 'image/webp', 0.8);
        };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Load error')); };
        img.src = objectUrl;
      });

      const { error: uploadError } = await supabase.storage
        .from('testimonial-images')
        .upload(resizedFile.name, resizedFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('testimonial-images')
        .getPublicUrl(resizedFile.name);

      const { data: updateData, error: updateError } = await supabase
        .from('testimonials')
        .update({ image_url: urlData.publicUrl })
        .eq('id', id)
        .select();

      if (updateError) throw updateError;
      if (!updateData || updateData.length === 0) {
        throw new Error('Update gagal — kemungkinan diblokir RLS.');
      }

      setTestimonials(prev =>
        prev.map(t => t.id === id
          ? { ...t, imageUrl: `${urlData.publicUrl}?t=${Date.now()}` }
          : t
        )
      );
    } catch (err) {
      console.error('Gagal mengganti foto:', err);
      alert('Gagal mengganti foto testimoni.');
    } finally {
      setIsEditingTestimonial(null);
      e.target.value = '';
    }
  };

  return (
    <div className="flex h-screen bg-[#fbfbfd] text-gray-800 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col hide-scrollbar">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-black flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold text-lg">
              S
            </div>
            SEADANYA STORE
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {(
            [
              { tab: 'overview', icon: <DollarSign className="w-5 h-5" />, label: 'Rekapitulasi' },
              { tab: 'bookkeeping', icon: <Wallet className="w-5 h-5" />, label: 'Pembukuan' },
              { tab: 'products', icon: <Package className="w-5 h-5" />, label: 'Produk' },
              { tab: 'orders', icon: <ShoppingCart className="w-5 h-5" />, label: 'Pesanan' },
              { tab: 'promotions', icon: <Tag className="w-5 h-5" />, label: 'Promosi' },
              { tab: 'testimonials', icon: <Users className="w-5 h-5" />, label: 'Testimoni' },
            ] as const
          ).map(({ tab, icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-colors ${
                activeTab === tab
                  ? 'bg-[#0066cc]/10 text-[#0066cc] font-semibold'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 rounded-2xl hover:bg-red-50 transition-colors font-medium cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8 relative">
        {/* Filter Bar */}
        <div className="absolute top-8 right-8 z-10 flex gap-2">
          {(['overview', 'orders', 'bookkeeping'] as const).includes(activeTab as 'overview' | 'orders' | 'bookkeeping') && (
            <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-sm">
              <select
                value={filterMode}
                onChange={e => setFilterMode(e.target.value as FilterMode)}
                className="px-3 py-2 bg-transparent border-r border-gray-200 outline-none text-gray-700"
              >
                <option value="all">Semua Waktu</option>
                <option value="month">Per Bulan</option>
                <option value="date">Per Tanggal</option>
              </select>
              {filterMode === 'month' && (
                <input
                  type="month"
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  className="px-3 py-2 bg-transparent outline-none text-gray-700"
                />
              )}
              {filterMode === 'date' && (
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="px-3 py-2 bg-transparent outline-none text-gray-700"
                />
              )}
            </div>
          )}
        </div>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-3xl font-semibold tracking-tight text-black">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                    Total Pendapatan <DollarSign className="w-4 h-4 text-[#0066cc]" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-black">
                    Rp {totalRevenue.toLocaleString('id-ID')}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                    Total Pesanan <ShoppingCart className="w-4 h-4 text-[#0066cc]" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-black">{filteredOrders.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                    Pelanggan Aktif <Users className="w-4 h-4 text-[#0066cc]" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-black">{activeCustomers}</div>
                  <p className="text-xs text-gray-400 mt-1">
                    {filterMode === 'all'
                      ? 'Semua waktu'
                      : filterMode === 'month'
                      ? `Bulan ${filterMonth}`
                      : `Tanggal ${filterDate}`}
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Grafik Penjualan Bulanan</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      tickFormatter={(value: number) => `Rp ${value / 1_000_000}M`}
                      dx={-10}
                    />
                    <Tooltip
                      formatter={(value) => {
                        const num = typeof value === 'number' ? value : Number(value ?? 0) || 0;
                        return [`Rp ${num.toLocaleString('id-ID')}`, 'Pendapatan'] as [string, string];
                      }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#0066cc"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                      activeDot={{ r: 6, fill: '#0066cc', stroke: 'white', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Bookkeeping ───────────────────────────────────────────────────── */}
        {activeTab === 'bookkeeping' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-3xl font-semibold tracking-tight text-black">Buku Laporan Keuangan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                    Harga Terjual (Omzet) <TrendingUp className="w-4 h-4 text-green-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">
                    Rp {totalRevenue.toLocaleString('id-ID')}
                  </div>
                  <p className="text-xs text-green-500 mt-1 font-medium">+15.3% dari bulan lalu</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                    Total Modal (HPP) <Package className="w-4 h-4 text-orange-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">
                    Rp {totalModal.toLocaleString('id-ID')}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Sesuai nilai HPP produk terjual</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                    Pengeluaran Operasional <TrendingDown className="w-4 h-4 text-red-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">
                    Rp {operationalExpenses.toLocaleString('id-ID')}
                  </div>
                  <p className="text-xs text-red-500 mt-1 font-medium">+2.1% dari bulan lalu</p>
                </CardContent>
              </Card>
              <Card className="bg-[#0066cc] text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-100 flex items-center justify-between">
                    Keuntungan Bersih <DollarSign className="w-4 h-4 text-white" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    Rp {netProfit.toLocaleString('id-ID')}
                  </div>
                  <p className="text-xs text-blue-100 mt-1">Setelah dipotong modal &amp; biaya</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Arus Kas (Kas Manual)</CardTitle>
                <div className="space-x-3">
                  <Button variant="outline" size="sm" onClick={handleExportLedger}>
                    Export Laporan
                  </Button>
                  <Button size="sm" onClick={() => openLedgerModal()}>
                    <Plus className="w-4 h-4 mr-2" /> Tambah Transaksi
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredLedger.length === 0 && (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      Belum ada transaksi manual.
                    </div>
                  )}
                  {filteredLedger.map(trx => (
                    <div
                      key={trx.id}
                      className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            trx.type === 'income'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {trx.type === 'income' ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-black">{trx.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(trx.date).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div
                          className={`font-semibold ${
                            trx.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {trx.type === 'income' ? '+' : '-'} Rp{' '}
                          {trx.amount.toLocaleString('id-ID')}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openLedgerModal(trx)}
                            className="p-1.5 text-gray-400 hover:text-[#0066cc] hover:bg-blue-50 rounded-md transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLedger(trx.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Products ──────────────────────────────────────────────────────── */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-semibold tracking-tight text-black">Manajemen Produk</h2>
              <Button onClick={() => openFormModal('add')}>
                <Plus className="w-4 h-4 mr-2" /> Tambah Produk
              </Button>
            </div>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-medium">Produk</th>
                      <th className="px-6 py-4 font-medium">Kategori</th>
                      <th className="px-6 py-4 font-medium">Stok</th>
                      <th className="px-6 py-4 font-medium">Harga Modal</th>
                      <th className="px-6 py-4 font-medium">Harga Jual</th>
                      <th className="px-6 py-4 font-medium">Diskon</th>
                      <th className="px-6 py-4 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr
                        key={product.id}
                        className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium flex items-center space-x-4">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              className="w-12 h-12 rounded-lg object-contain bg-gray-50 p-1 border border-gray-100"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs border border-gray-200 p-1">
                              No Img
                            </div>
                          )}
                          <span className="text-black">{product.title}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{product.category}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                product.stock > 10
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {product.stock} unit
                            </span>
                            <button
                              onClick={() => openFormModal('stock', product)}
                              className="p-1 text-blue-500 hover:bg-blue-50 rounded-full transition cursor-pointer"
                              title="Tambah Stok"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-medium">
                          {product.costPrice != null
                            ? `Rp ${product.costPrice.toLocaleString('id-ID')}`
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-black font-medium">
                          Rp {product.price.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4">
                          {product.discount != null ? (
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                              {product.discount}% OFF
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openFormModal('edit', product)}
                            className="p-2 text-gray-400 hover:text-[#0066cc] hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── Orders ────────────────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-3xl font-semibold tracking-tight text-black">Riwayat Pesanan</h2>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-medium">ID Pesanan</th>
                      <th className="px-6 py-4 font-medium">Tanggal</th>
                      <th className="px-6 py-4 font-medium">Pelanggan</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Total</th>
                      <th className="px-6 py-4 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr
                        key={order.id}
                        className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-black">{order.id}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(order.date).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-black">{order.customerName}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                order.status === 'Selesai'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {order.status === 'Selesai' ? '✅ Selesai' : '⏳ Menunggu Pembayaran'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-black">
                            Rp {order.totalAmount.toLocaleString('id-ID')}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => handleToggleOrderStatus(order.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                order.status === 'Selesai'
                                  ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                  : 'bg-green-50 text-green-700 hover:bg-green-100'
                              }`}
                            >
                              {order.status === 'Selesai' ? 'Batalkan' : 'Tandai Selesai'}
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── Promotions ────────────────────────────────────────────────────── */}
        {activeTab === 'promotions' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-semibold tracking-tight text-black">
                Manajemen Promosi &amp; Diskon
              </h2>
              <Button onClick={() => openPromoModal()}>
                <Plus className="w-4 h-4 mr-2" /> Buat Kode Promo
              </Button>
            </div>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-medium">Kode Promo</th>
                      <th className="px-6 py-4 font-medium">Diskon (%)</th>
                      <th className="px-6 py-4 font-medium">Berlaku Sampai</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promotions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          Belum ada kode promo yang dibuat.
                        </td>
                      </tr>
                    )}
                    {promotions.map(promo => (
                      <tr
                        key={promo.id}
                        className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-black uppercase">{promo.code}</td>
                        <td className="px-6 py-4 font-medium text-red-600">
                          {promo.discountPercentage}%
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {promo.validUntil ?? 'Tanpa Batas'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              promo.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {promo.isActive ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openPromoModal(promo)}
                            className="p-2 text-gray-400 hover:text-[#0066cc] hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePromo(promo.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── Testimonials ──────────────────────────────────────────────────────── */}
        {activeTab === 'testimonials' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-semibold tracking-tight text-black">
                Manajemen Testimoni
              </h2>
              <span className="text-sm text-gray-500 bg-white border border-gray-200 px-4 py-2 rounded-xl">
                {testimonials.length} foto testimoni
              </span>
            </div>

            {isTestimonialsLoading ? (
              <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
                Memuat testimoni...
              </div>
            ) : testimonials.length === 0 ? (
              <Card>
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                  <Users className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-sm">Belum ada testimoni pelanggan.</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {testimonials.map(t => (
                  <div key={t.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group relative">

                    {/* Loading overlay saat sedang proses */}
                    {(isDeletingTestimonial === t.id || isEditingTestimonial === t.id) && (
                      <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-gray-500">
                            {isDeletingTestimonial === t.id ? 'Menghapus...' : 'Mengganti...'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action buttons overlay */}
                    <div className="absolute top-2 right-2 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {/* Tombol Ganti Foto */}
                      <label
                        className={`w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-[#0066cc] hover:text-white transition-colors group/btn ${isEditingTestimonial === t.id ? 'opacity-50 pointer-events-none' : ''}`}
                        title="Ganti foto"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-700 group-hover/btn:text-white transition-colors" />
                        <input
                          type="file"
                          accept="image/*, .heic, .heif"
                          className="hidden"
                          disabled={isEditingTestimonial === t.id}
                          onChange={(e) => handleAdminEditTestimonial(t.id, e)}
                        />
                      </label>

                      {/* Tombol Hapus */}
                      <button
                        className={`w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-red-500 transition-colors group/btn ${isDeletingTestimonial === t.id ? 'opacity-50 pointer-events-none' : ''}`}
                        title="Hapus testimoni"
                        disabled={isDeletingTestimonial === t.id}
                        onClick={() => handleAdminDeleteTestimonial(t.id, t.imageUrl)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-700 group-hover/btn:text-white transition-colors" />
                      </button>
                    </div>

                    {/* Foto */}
                    <div className="aspect-[3/4] overflow-hidden bg-gray-50">
                      {t.imageUrl ? (
                        <img
                          src={t.imageUrl}
                          alt="Testimoni pelanggan"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                          Tidak ada foto
                        </div>
                      )}
                    </div>

                    {/* Footer card */}
                    <div className="px-3 py-2.5 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">
                        {new Date(t.date).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                      <span className="text-[10px] font-mono text-gray-300 truncate max-w-[80px]">
                        {t.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Modal: Product ────────────────────────────────────────────────── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-lg bg-white shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-black">
                  {modalMode === 'add' && 'Tambah Produk Baru'}
                  {modalMode === 'edit' && 'Edit Data Produk'}
                  {modalMode === 'stock' && 'Tambah Stok Produk'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-black transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                {modalMode !== 'stock' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Nama Produk</label>
                        <input
                          required
                          value={formData.title}
                          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0066cc] outline-none text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Kategori</label>
                        <select
                          required
                          value={formData.category}
                          onChange={e =>
                            setFormData(prev => ({ ...prev, category: e.target.value }))
                          }
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0066cc] outline-none text-sm"
                        >
                          <option value="">Pilih...</option>
                          {APP_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Upload Foto Produk</label>
                      <div className="flex items-center gap-4">
                        {formData.imageUrl && (
                          <img
                            src={formData.imageUrl}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*, .heic, .heif"
                          onChange={handleImageUpload}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0066cc]/10 file:text-[#0066cc] hover:file:bg-[#0066cc]/20 transition-colors cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Deskripsi</label>
                      <textarea
                        required
                        value={formData.description}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, description: e.target.value }))
                        }
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0066cc] outline-none text-sm min-h-[80px]"
                      />
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {modalMode !== 'stock' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Harga Jual (Rp)</label>
                        <input
                          type="number"
                          required
                          value={formData.price}
                          onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0066cc] outline-none text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Modal / HPP (Rp)</label>
                        <input
                          type="number"
                          required
                          value={formData.costPrice}
                          onChange={e =>
                            setFormData(prev => ({ ...prev, costPrice: e.target.value }))
                          }
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0066cc] outline-none text-sm"
                        />
                      </div>
                    </>
                  )}
                  {modalMode !== 'stock' && (
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-sm font-medium text-gray-700">Diskon (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discount}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, discount: e.target.value }))
                        }
                        placeholder="Biarkan kosong jika tidak ada"
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0066cc] outline-none text-sm"
                      />
                    </div>
                  )}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      {modalMode === 'stock' ? 'Jumlah Tambahan Stok' : 'Stok Awal'}
                    </label>
                    <input
                      type="number"
                      required
                      min={modalMode === 'stock' ? '1' : '0'}
                      value={formData.stock}
                      onChange={e => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0066cc] outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-[#0066cc] text-white">
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* ── Modal: Ledger ─────────────────────────────────────────────────── */}
        {isLedgerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-lg bg-white shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-black">
                  {ledgerEditingId ? 'Edit Transaksi' : 'Catat Transaksi Manual'}
                </h3>
                <button
                  onClick={() => setIsLedgerModalOpen(false)}
                  className="text-gray-400 hover:text-black transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleLedgerSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Tipe Transaksi</label>
                    <div className="flex gap-2">
                      {(['income', 'expense'] as LedgerType[]).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setLedgerFormData(prev => ({ ...prev, type }))}
                          className={`flex-1 py-2 text-sm font-medium rounded-lg border transition cursor-pointer ${
                            ledgerFormData.type === type
                              ? type === 'income'
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={ledgerFormData.date}
                      onChange={e =>
                        setLedgerFormData(prev => ({ ...prev, date: e.target.value }))
                      }
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0066cc] outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Jumlah (Rp)</label>
                  <input
                    type="number"
                    required
                    value={ledgerFormData.amount}
                    onChange={e =>
                      setLedgerFormData(prev => ({ ...prev, amount: e.target.value }))
                    }
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0066cc] outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Keterangan</label>
                  <input
                    required
                    value={ledgerFormData.desc}
                    onChange={e => setLedgerFormData(prev => ({ ...prev, desc: e.target.value }))}
                    placeholder="Cth: Bayar Listrik Bulan Ini"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0066cc] outline-none text-sm"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsLedgerModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-[#0066cc] text-white">
                    Simpan Transaksi
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* ── Modal: Promo ──────────────────────────────────────────────────── */}
        {isPromoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-lg bg-white shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-black">
                  {promoEditingId ? 'Edit Kode Promo' : 'Buat Kode Promo Baru'}
                </h3>
                <button
                  onClick={() => setIsPromoModalOpen(false)}
                  className="text-gray-400 hover:text-black transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handlePromoSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Kode Promo</label>
                  <input
                    required
                    value={promoFormData.code}
                    onChange={e =>
                      setPromoFormData(prev => ({
                        ...prev,
                        code: e.target.value.replace(/\s+/g, ''),
                      }))
                    }
                    placeholder="Cth: MERDEKA20"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0066cc] outline-none text-sm uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Persentase Diskon (%)
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="100"
                    value={promoFormData.discountPercentage}
                    onChange={e =>
                      setPromoFormData(prev => ({
                        ...prev,
                        discountPercentage: e.target.value,
                      }))
                    }
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0066cc] outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Berlaku Sampai (Opsional)
                  </label>
                  <input
                    type="date"
                    value={promoFormData.validUntil}
                    onChange={e =>
                      setPromoFormData(prev => ({ ...prev, validUntil: e.target.value }))
                    }
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0066cc] outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5 border-t border-gray-100 pt-3">
                  <label className="text-sm font-medium text-gray-700">
                    Produk yang Dipromokan
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Pilih produk yang berlaku untuk promo ini. Kosongkan jika berlaku untuk semua
                    produk.
                  </p>
                  <div className="max-h-[150px] overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50 hide-scrollbar">
                    {products.map(product => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 bg-white p-2 border border-gray-100 rounded-md"
                      >
                        <input
                          type="checkbox"
                          id={`promo-prod-${product.id}`}
                          checked={promoFormData.applicableProductIds.includes(product.id)}
                          onChange={e => {
                            setPromoFormData(prev => ({
                              ...prev,
                              applicableProductIds: e.target.checked
                                ? [...prev.applicableProductIds, product.id]
                                : prev.applicableProductIds.filter(id => id !== product.id),
                            }));
                          }}
                          className="w-4 h-4 text-[#0066cc]"
                        />
                        <label
                          htmlFor={`promo-prod-${product.id}`}
                          className="text-sm text-gray-700 cursor-pointer flex-1 line-clamp-1"
                        >
                          {product.title}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <input
                    type="checkbox"
                    id="isActivePromo"
                    checked={promoFormData.isActive}
                    onChange={e =>
                      setPromoFormData(prev => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="w-4 h-4 text-[#0066cc]"
                  />
                  <label
                    htmlFor="isActivePromo"
                    className="text-sm text-gray-700 cursor-pointer font-medium"
                  >
                    Promo Aktif
                  </label>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsPromoModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-[#0066cc] text-white">
                    Simpan Promo
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}