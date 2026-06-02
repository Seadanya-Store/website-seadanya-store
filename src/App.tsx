import { useState, useEffect } from 'react';
import { Storefront } from './pages/Storefront';
import { AdminDashboard } from './pages/AdminDashboard';
import { Auth } from './pages/Auth';
import { mockProducts, mockLedger, mockOrders } from './data/mock';
import { Product, LedgerEntry, Order, Promotion } from './types';

export default function App() {
  const [view, setView] = useState<'storefront' | 'login' | 'admin' | 'seller'>('storefront');
  
  const updateOldProducts = (savedProducts: Product[]) => {
    return savedProducts.map(p => {
      // Fix old MagSafe image URL
      if (p.id === 'p6' && p.title.includes('MagSafe') && p.imageUrl?.includes('1615526671490')) {
        return { ...p, imageUrl: 'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?auto=format&fit=crop&q=80&w=800', category: 'Aksesori' };
      }
      // Fix old Apple Watch image URL
      if (p.id === 'p5' && p.title.includes('Apple Watch') && p.imageUrl?.includes('1434493789847')) {
        return { ...p, imageUrl: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&q=80&w=800', category: 'Watch' };
      }
      return p;
    });
  };

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('seadanyastore_products');
    return saved ? updateOldProducts(JSON.parse(saved)) : mockProducts;
  });
  const [ledger, setLedger] = useState<LedgerEntry[]>(() => {
    const saved = localStorage.getItem('seadanyastore_ledger');
    return saved ? JSON.parse(saved) : mockLedger;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('seadanyastore_orders');
    return saved ? JSON.parse(saved) : mockOrders;
  });
  const [promotions, setPromotions] = useState<Promotion[]>(() => {
    const saved = localStorage.getItem('seadanyastore_promotions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('seadanyastore_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('seadanyastore_ledger', JSON.stringify(ledger));
  }, [ledger]);

  useEffect(() => {
    localStorage.setItem('seadanyastore_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('seadanyastore_promotions', JSON.stringify(promotions));
  }, [promotions]);

  if (view === 'admin') {
    return <AdminDashboard products={products} setProducts={setProducts} ledger={ledger} setLedger={setLedger} orders={orders} setOrders={setOrders} promotions={promotions} setPromotions={setPromotions} onLogout={() => setView('storefront')} />;
  }

  // Reuse Admin dashboard for seller prototype
  if (view === 'seller') {
    return <AdminDashboard products={products} setProducts={setProducts} ledger={ledger} setLedger={setLedger} orders={orders} setOrders={setOrders} promotions={promotions} setPromotions={setPromotions} onLogout={() => setView('storefront')} />;
  }

  if (view === 'login') {
    return (
      <Auth 
        onLogin={(role) => setView(role === 'admin' ? 'admin' : role === 'seller' ? 'seller' : 'storefront')} 
        onBack={() => setView('storefront')} 
      />
    );
  }

  return <Storefront products={products} setProducts={setProducts} orders={orders} setOrders={setOrders} promotions={promotions} onLoginClick={() => setView('login')} />;
}

