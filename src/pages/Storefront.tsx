import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Search, Menu, X, ArrowRight, ShieldCheck, Truck, Clock, Heart, MessageCircle, Send, Laptop, Smartphone, Headphones, MoreVertical } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Product, Promotion } from '../types';
import heic2any from 'heic2any';
import { GoogleGenAI } from '@google/genai';

interface BuktiPembayaranFormData {
  imageUrl: string;
}

const EMPTY_EVIDENCE_FORM: BuktiPembayaranFormData = {
  imageUrl: '',
};

const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });

export function Storefront({
  products,
  setProducts,
  orders = [],
  setOrders,
  promotions = [],
  onLoginClick
}: {
  products: Product[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  orders?: any[];
  setOrders?: React.Dispatch<React.SetStateAction<any[]>>;
  promotions?: Promotion[];
  onLoginClick: () => void;
}) {
  const [heroIndex, setHeroIndex] = useState(0);
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCheckout, setIsCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [chatMessages, setChatMessages] = useState<{sender: 'user' | 'seller', text: string}[]>([
    { sender: 'seller', text: 'Halo! Ada yang bisa kami bantu hari ini? 😊' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const heroProducts = products.slice(0, 5);
  const [formData, setFormData] = useState<BuktiPembayaranFormData>(EMPTY_EVIDENCE_FORM);

  const goToNext = useCallback(() => {
    setHeroIndex(prev => (prev + 1) % Math.max(heroProducts.length, 1));
  }, [heroProducts.length]);

  useEffect(() => {
    if (heroProducts.length <= 1) return;
    const timer = setInterval(goToNext, 4000);
    return () => clearInterval(timer);
  }, [goToNext, heroProducts.length]);

  const currentHero = heroProducts[heroIndex];``
  
  const IPHONE_CATEGORIES = [
    'iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 17',
    'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16',
    'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15',
    'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14',
    'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13',
    'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12',
    'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
    'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
    'iPhone 8 Plus', 'iPhone 8'
  ];

  const DRAWER_CATEGORIES = [
    { name: 'Mac', value: 'Mac' },
    { name: 'iPad', value: 'iPad' },
    { name: 'iPhone', isSubmenu: true, subcategories: IPHONE_CATEGORIES },
    { name: 'Watch', value: 'Watch' },
    { name: 'Music', value: 'Music' },
    { name: 'Aksesori', value: 'Aksesori' },
    { name: 'Laptop', value: 'Laptop' },
    { name: 'Android', value: 'Android' }
  ];

  const [expandedNav, setExpandedNav] = useState<string | null>(null);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesCategory = true;
    if (selectedCategory) {
      if (selectedCategory === 'Produk Apple') {
        matchesCategory = ['iPhone', 'MacBook', 'AirPods', 'iPad', 'Apple Watch'].some(k => p.title.includes(k) || p.category.includes(k));
      } else if (selectedCategory === 'Laptop' || selectedCategory === 'Mac') {
        matchesCategory = p.category === 'Laptop' || p.category === 'Mac' || p.title.toLowerCase().includes('macbook') || p.title.toLowerCase().includes('laptop');
      } else if (selectedCategory === 'HP' || selectedCategory === 'iPhone' || selectedCategory === 'Android' || selectedCategory === 'Smartphone') {
        matchesCategory = p.category === 'Smartphone' || p.category.includes('iPhone') || p.category === 'Android' || p.category === 'HP' || p.title.toLowerCase().includes('iphone') || p.title.toLowerCase().includes('android');
        if (selectedCategory === 'iPhone') matchesCategory = p.category.includes('iPhone') || p.title.toLowerCase().includes('iphone');
        if (selectedCategory === 'Android') matchesCategory = p.category.includes('Android') || p.title.toLowerCase().includes('android');
      } else if (selectedCategory === 'Produk Digital' || selectedCategory === 'Audio') {
        matchesCategory = p.category === 'Audio' || p.category === 'Accessories' || p.category === 'Aksesori' || p.category === 'Music';
      } else {
        matchesCategory = p.category === selectedCategory;
      }
    }
    return matchesSearch && matchesCategory;
  });

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(prev => prev === category ? null : category);
    document.getElementById('products')?.scrollIntoView({behavior: 'smooth'});
    setIsMobileMenuOpen(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { sender: 'user', text: chatInput }]);
    setChatInput('');
    // Simulate seller response
    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'seller', text: 'Baik kak, pesan sudah kami terima. Akan segera kami proses pertanyaannya.' }]);
    }, 1000);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => prev.filter(p => p.id !== productId));
  };

  const moveWishlistToCart = (product: Product) => {
    addToCart(product);
    removeFromWishlist(product.id);
  };

  const getFinalPrice = (product: Product) => {
    if (!product.discount) return product.price;
    return product.price - (product.price * (product.discount / 100));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (getFinalPrice(item.product) * item.quantity), 0);

  const [selectedPayment, setSelectedPayment] = useState<string>('bca');

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    address: '',
    shipping: '0',
  });

  const handleCustomerInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
    if (name === 'shipping') setShippingCost(Number(value));
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileToGenerativePart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Ambil data base64 murninya saja
        const base64Data = base64String.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          },
        });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // ── Image Upload ───────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setErrorMessage('');

    try {
      // 1. Konversi file gambar ke format Gemini
      const imagePart = await fileToGenerativePart(file);

      // 2. Panggil Gemini 2.5 Flash (Model tercepat dan gratis)
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          'Analisis gambar ini. Apakah ini merupakan bukti transfer, resi, atau nota pembayaran bank resmi (baik digital m-banking maupun cetak struk ATM)? Jawab HANYA dengan satu kata: "YA" jika benar nota bank, atau "TIDAK" jika itu gambar lain yang tidak relevan.',
          imagePart,
        ],
      });

      const hasilAnalisis = response.text?.trim().toUpperCase();

      // 3. Logika Validasi Hasil
      if (hasilAnalisis?.includes('TIDAK')) {
        setErrorMessage('Gambar ditolak! Foto yang diunggah bukan nota atau bukti pembayaran bank yang valid.');
        e.target.value = ''; // Reset input file HTML
        setFormData({ ...formData, imageUrl: '' });
      } else {
        // Jika lolos (Aki/AI mendeteksi "YA"), simpan gambar ke state Anda
        setFormData({ ...formData, imageUrl: URL.createObjectURL(file) });
      }

    } catch (error) {
      console.error("Gagal memverifikasi gambar dengan Gemini:", error);
      setErrorMessage('Gagal memverifikasi gambar. Silakan coba unggah kembali.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutStep === 1) setCheckoutStep(2);
    else if (checkoutStep === 2) setCheckoutStep(3);
    else if (checkoutStep === 3) {
      // Simulate finish
      const newOrder = {
        id: `INV-${Math.floor(Math.random() * 1000000)}`,
        date: new Date().toISOString().split('T')[0],
        items: [...cart],
        totalAmount: cartTotal + shippingCost,
        status: 'Menunggu Pembayaran' as const,
        customerName: customerInfo.name || 'Guest',
        customerEmail: customerInfo.email,
        customerAddress: customerInfo.address,
        shippingMethod: customerInfo.shipping === '0' ? 'Transaksi Langsung' : 'Ekspedisi',
        paymentMethod: selectedPayment === 'cod' ? 'COD' : selectedPayment.toUpperCase(),
      };

      if (setOrders) {
        setOrders(prev => [newOrder, ...prev]);
      }

      if (setProducts) {
        setProducts(prev => {
          const updated = [...prev];
          for (const item of cart) {
            const idx = updated.findIndex(p => p.id === item.product.id);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], stock: Math.max(0, updated[idx].stock - item.quantity) };
            }
          }
          return updated;
        });
      }

      setCompletedOrder({
        ...newOrder,
        total: cartTotal,
        loyaltyPoints: Math.floor(cartTotal / 10000)
      });
      setCart([]);
      setCustomerInfo({ name: '', email: '', address: '', shipping: '0' });
      setCheckoutStep(4);
    } else if (checkoutStep === 4) {
       setIsCheckout(false);
       setCheckoutStep(1);
       setCompletedOrder(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100">

      {/* Navigation */}
      <nav className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center">
              <button 
                className="p-2 mr-3 text-black hover:bg-gray-100 rounded-full transition"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-2 md:gap-3">
                {/* Logo & nama toko — pakai div + onClick, bukan button */}
                <div
                  onClick={() => { document.getElementById('products')?.scrollIntoView({behavior: 'smooth'}) }}
                  className="flex items-center gap-2 md:gap-3 cursor-pointer"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-black text-white flex items-center justify-center font-bold text-lg md:text-xl">
                    S
                  </div>
                  <span className="text-2xl md:text-3xl font-bold tracking-tighter text-black uppercase">SEADANYA STORE</span>
                </div>

                {/* Badge Premium Partner — sekarang sibling, bukan child dari button */}
                <div
                  onClick={() => { setIsServicesModalOpen(true); setIsMobileMenuOpen(false); }}
                  className="hidden md:flex border border-gray-300 rounded-md px-2 py-1 text-[10px] font-semibold items-center gap-1.5 shadow-sm cursor-pointer hover:bg-gray-50 transition"
                >
                  🍎 Premium Partner
                </div>
              </div>

              <div className="hidden md:flex items-center ml-10 space-x-6">
                <button onClick={() => { document.getElementById('products')?.scrollIntoView({behavior: 'smooth'}) }} className="text-sm font-medium text-gray-600 hover:text-black transition">Semua Produk</button>
                <button onClick={() => { document.getElementById('promotions')?.scrollIntoView({behavior: 'smooth'}) }} className="text-sm font-medium text-[#0066cc] hover:text-blue-800 transition">Promo Spesial</button>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 md:space-x-3">
              <button 
                onClick={onLoginClick}
                className="hidden md:flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Portal
              </button>
              
              <div className="flex items-center space-x-1 ml-1 md:pl-4 md:border-l md:border-gray-200">
                <button 
                  className="relative p-2.5 text-black hover:bg-gray-100 transition rounded-full md:hidden"
                  onClick={onLoginClick}
                >
                  <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button 
                  className="relative p-2.5 text-black hover:bg-gray-100 transition rounded-full"
                  onClick={() => setIsWishlistOpen(true)}
                >
                  <Heart className="w-5 h-5 md:w-6 md:h-6" />
                  {wishlist.length > 0 && (
                     <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform bg-red-500 rounded-full border-2 border-white">
                      {wishlist.length}
                    </span>
                  )}
                </button>
                <button 
                  className="relative p-2.5 text-black hover:bg-gray-100 transition rounded-full"
                  onClick={() => setIsCartOpen(true)}
                >
                  <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                  {cart.length > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform bg-blue-600 rounded-full border-2 border-white">
                      {cart.reduce((a,b)=>a+b.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-[85%] max-w-sm h-full bg-white relative flex flex-col shadow-2xl animate-in slide-in-from-left" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold text-lg">S</div>
                 <span className="text-xl font-bold tracking-tighter text-black uppercase">SEADANYA STORE</span>
               </div>
               <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-gray-500 hover:text-black">
                 <X className="w-6 h-6" />
               </button>
            </div>
            <div className="p-4 border-b border-gray-100">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <input 
                   type="text" 
                   placeholder="Cari produk..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-transparent rounded-lg text-sm text-black focus:bg-white focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 outline-none transition-all"
                 />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col py-2">
                <div className="border-b border-gray-50">
                  <button 
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                    onClick={() => { setIsServicesModalOpen(true); setIsMobileMenuOpen(false); }}
                  >
                    <span className="text-sm font-medium text-[#0066cc]">Layanan Kami</span>
                  </button>
                </div>
                {DRAWER_CATEGORIES.map(category => (
                  <div key={category.name} className="border-b border-gray-50 last:border-0">
                    <button 
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                      onClick={() => {
                        if (category.isSubmenu) {
                          setExpandedNav(expandedNav === category.name ? null : category.name);
                        } else {
                          handleCategoryClick(category.value!);
                        }
                      }}
                    >
                      <span className="text-sm font-medium text-gray-800">{category.name}</span>
                      {category.isSubmenu && (
                         <ArrowRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedNav === category.name ? 'rotate-90' : ''}`}/>
                      )}
                    </button>
                    {category.isSubmenu && expandedNav === category.name && (
                      <div className="bg-gray-50/50 px-5 py-2 flex flex-col items-start gap-1">
                        <button className="w-full py-2 text-left text-sm text-gray-600 hover:text-black" onClick={() => handleCategoryClick(category.name)}>
                          Semua {category.name}
                        </button>
                        {category.subcategories?.map(sub => (
                          <button key={sub} className="w-full py-2 text-left text-sm text-gray-600 hover:text-black" onClick={() => handleCategoryClick(sub)}>
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pb-24">
        {/* Auto-Sliding Hero Banner */}
        <div className="bg-[#0a0a0a] text-white relative overflow-hidden" style={{ minHeight: '420px' }}>
          {/* Slide Track */}
          <div
            className="flex transition-transform duration-700 ease-in-out h-full"
            style={{ transform: `translateX(-${heroIndex * 100}%)` }}
          >
            {heroProducts.map((product) => (
              <div
                key={product.id}
                className="min-w-full flex flex-col md:flex-row items-center justify-between px-6 py-12 md:py-24 relative"
                style={{ minHeight: '420px' }}
              >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/10 to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                  <div className="flex-1 text-center md:text-left">
                    <div className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">
                      {product.category}
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tighter">
                      {product.title}
                    </h2>
                    <p className="text-xl md:text-2xl font-medium text-gray-300 mb-6 tracking-tight line-clamp-2">
                      {product.description || 'Performa terdepan. Teknologi terkini.'}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                      <button
                        onClick={() => addToCart(product)}
                        className="bg-white text-black px-8 py-3 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors"
                      >
                        Beli sekarang
                      </button>
                      <div className="text-sm font-medium text-gray-400">
                        Mulai dari Rp {getFinalPrice(product).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 flex justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-[100px]" />
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-[250px] md:w-[400px] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-[250px] md:w-[400px] h-[300px] flex items-center justify-center text-gray-600 text-sm">
                        No Image
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dot Indicators */}
          {heroProducts.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {heroProducts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroIndex(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    idx === heroIndex
                      ? 'w-6 h-2 bg-white'
                      : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Prev / Next Arrows */}
          {heroProducts.length > 1 && (
            <>
              <button
                onClick={() => setHeroIndex(prev => (prev - 1 + heroProducts.length) % heroProducts.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition text-white"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition text-white"
                aria-label="Next"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Feature Section */}
        <div className="py-20 md:py-32 px-4 text-center bg-white border-b border-gray-100">
          <h2 className="text-3xl md:text-5xl font-extrabold text-black mb-8 tracking-tight">Temukan Gadget Terbaik Untukmu</h2>
          <button 
            onClick={() => { document.getElementById('products')?.scrollIntoView({behavior: 'smooth'}) }} 
            className="text-[#0066cc] border-2 border-[#0066cc] rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-[#0066cc] hover:text-white transition-colors duration-300 mb-16 inline-flex items-center"
          >
            Bandingkan semua model
          </button>
          
          {/* Scrollable Products Slider */}
          <div className="max-w-7xl mx-auto overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar">
            <div className="flex gap-6 w-max px-4">
              {products.slice(0, 6).map(product => (
                <div key={product.id} className="snap-center shrink-0 w-[240px] md:w-[300px] flex flex-col items-center group cursor-pointer" onClick={() => { document.getElementById('products')?.scrollIntoView({behavior: 'smooth'}); }}>
                    <div className="bg-[#fbfbfd] rounded-2xl w-full aspect-[4/5] p-6 flex items-center justify-center mb-6 group-hover:bg-gray-100 transition duration-500">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out drop-shadow-xl" />
                        ) : (
                          <div className="text-gray-400">No Image</div>
                        )}
                    </div>
                    <h4 className="text-lg font-bold text-black mb-1 line-clamp-1">{product.title}</h4>
                    <p className="text-sm text-gray-500">Mulai Rp {product.price.toLocaleString('id-ID')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categories (Premium Dark Mode) */}
        <div className="bg-white py-12 md:py-20 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-xl md:text-2xl font-bold text-black mb-8 text-center tracking-tight">Eksplorasi Kategori</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div 
                onClick={() => handleCategoryClick('Produk Apple')}
                className={`relative overflow-hidden bg-[#0a0a0a] rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center gap-4 border transition-all duration-300 cursor-pointer group ${selectedCategory === 'Produk Apple' ? 'border-gray-500 shadow-2xl scale-[1.02]' : 'border-[#222] hover:border-gray-600 hover:shadow-xl'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-500 to-gray-800 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
                <svg viewBox="0 0 384 512" className="w-10 h-10 md:w-12 md:h-12 z-10 transform group-hover:-translate-y-1 transition duration-300 fill-white"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                <span className="font-bold text-white text-sm md:text-base tracking-widest uppercase z-10">Apple Store</span>
              </div>
              <div 
                onClick={() => handleCategoryClick('Laptop')}
                className={`relative overflow-hidden bg-[#0a0a0a] rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center gap-4 border transition-all duration-300 cursor-pointer group ${selectedCategory === 'Laptop' ? 'border-gray-500 shadow-2xl scale-[1.02]' : 'border-[#222] hover:border-gray-600 hover:shadow-xl'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-500 to-gray-800 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
                <Laptop className="w-10 h-10 md:w-12 md:h-12 text-white z-10 transform group-hover:-translate-y-1 transition duration-300 stroke-[1.5]" />
                <span className="font-bold text-white text-sm md:text-base tracking-widest uppercase z-10">Mac & PC</span>
              </div>
              <div 
                onClick={() => handleCategoryClick('HP')}
                className={`relative overflow-hidden bg-[#0a0a0a] rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center gap-4 border transition-all duration-300 cursor-pointer group ${selectedCategory === 'HP' ? 'border-gray-500 shadow-2xl scale-[1.02]' : 'border-[#222] hover:border-gray-600 hover:shadow-xl'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-500 to-gray-800 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
                <Smartphone className="w-10 h-10 md:w-12 md:h-12 text-white z-10 transform group-hover:-translate-y-1 transition duration-300 stroke-[1.5]" />
                <span className="font-bold text-white text-sm md:text-base tracking-widest uppercase z-10">Smartphone</span>
              </div>
              <div 
                onClick={() => handleCategoryClick('Produk Digital')}
                className={`relative overflow-hidden bg-[#0a0a0a] rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center gap-4 border transition-all duration-300 cursor-pointer group ${selectedCategory === 'Produk Digital' ? 'border-gray-500 shadow-2xl scale-[1.02]' : 'border-[#222] hover:border-gray-600 hover:shadow-xl'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-500 to-gray-800 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
                <Headphones className="w-10 h-10 md:w-12 md:h-12 text-white z-10 transform group-hover:-translate-y-1 transition duration-300 stroke-[1.5]" />
                <span className="font-bold text-white text-sm md:text-base tracking-widest uppercase z-10">Accessories</span>
              </div>
            </div>
          </div>
        </div>

        {/* Servis Gadget Banner */}
        <div className="max-w-7xl mx-auto px-4 mb-24 mt-12">
          <div className="bg-black rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between overflow-hidden relative shadow-2xl">
            <div className="flex items-start gap-6 relative z-10 w-full md:w-auto">
              <div className="text-5xl md:text-6xl grayscale opacity-80" role="img" aria-label="Wrench">🔧</div>
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">Servis Ahli. Kapan Saja.</h2>
                <p className="text-gray-400 max-w-md text-sm md:text-base leading-relaxed">Layanan perbaikan profesional untuk semua perangkat Apple and Android Anda. Ganti LCD, baterai, software, cepat dan bergaransi.</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-8 md:mt-0 relative z-10 w-full md:w-auto md:justify-end shrink-0">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 text-white px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 whitespace-nowrap hover:bg-white/20 transition cursor-pointer">
                <span className="text-blue-400">📱</span> Ganti Layar
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 text-white px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 whitespace-nowrap hover:bg-white/20 transition cursor-pointer">
                <span className="text-green-400">🔋</span> Ganti Baterai
              </div>
            </div>
          </div>
        </div>

        {/* Promotions Section */}
        {promotions.filter(p => p.isActive).length > 0 && (
          <div id="promotions" className="bg-[#fbfbfd] py-16 md:py-24 border-b border-gray-100 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl md:text-5xl font-extrabold text-black mb-12 tracking-tight text-center">Promo Spesial</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {promotions.filter(p => p.isActive).map(promo => (
                  <div key={promo.id} className="group bg-white rounded-3xl p-8 flex flex-col justify-between border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => { document.getElementById('products')?.scrollIntoView({behavior: 'smooth'}) }}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 font-bold text-6xl transform group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                      %
                    </div>
                    <div>
                      <div className="bg-[#0066cc]/10 text-[#0066cc] w-fit px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-[#0066cc]/20">
                        {promo.discountPercentage}% OFF
                      </div>
                      <h4 className="text-2xl font-extrabold text-black mb-3 uppercase tracking-tight">{promo.code}</h4>
                      {promo.validUntil && <p className="text-sm text-gray-500 mb-4 font-medium flex items-center gap-1.5"><Clock className="w-4 h-4"/> Berlaku sampai {promo.validUntil}</p>}
                      
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-600 font-medium">Bisa digunakan untuk <span className="text-black font-bold">{(promo.applicableProductIds?.length ?? 0) > 0 ? `${promo.applicableProductIds!.length} produk pilihan` : 'semua produk'}</span>!</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 py-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-6 border-b border-gray-100 pb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-black tracking-tight">Katalog Produk</h2>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari iPhone, MacBook, aksesoris..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-full focus:ring-2 focus:ring-[#0066cc] focus:bg-white transition-all outline-none text-sm"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex overflow-x-auto gap-2 pb-6 mb-6 hide-scrollbar snap-x">
             <button 
                onClick={() => setSelectedCategory(null)}
                className={`shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-colors snap-start ${
                  selectedCategory === null ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
             >
               Semua
             </button>
             {['iPhone', 'Mac', 'iPad', 'Watch', 'Audio', 'Accessories', 'Laptop', 'Android'].map(cat => (
               <button 
                 key={cat}
                 onClick={() => setSelectedCategory(cat)}
                 className={`shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-colors snap-start ${
                    selectedCategory === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                 }`}
               >
                 {cat}
               </button>
             ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {filteredProducts.map(product => {
              const isWishlisted = wishlist.some(p => p.id === product.id);
              return (
                <div key={product.id} onClick={() => setSelectedProduct(product)} className="group flex flex-col cursor-pointer transition-all duration-300">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#fbfbfd] rounded-2xl flex items-center justify-center p-8 mb-4 hover:bg-gray-100 transition">
                    {product.discount ? (
                      <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm tracking-wide">
                        {product.discount}% OFF
                      </div>
                    ) : null}
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                      className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-white/60 text-gray-400 hover:text-red-500 transition-colors shadow-sm"
                    >
                      <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.title} 
                        className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col px-1">
                    <div className="text-[10px] font-bold tracking-wider text-[#bf4800] uppercase mb-1.5">
                      {product.category}
                    </div>
                    <h3 className="text-base font-semibold mb-1 text-black line-clamp-1">{product.title}</h3>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div>
                        {product.discount ? (
                          <div className="text-[11px] text-gray-400 line-through mb-0.5">
                            Rp {product.price.toLocaleString('id-ID')}
                          </div>
                        ) : null}
                        <div className="text-sm font-semibold text-black">
                          Rp {getFinalPrice(product).toLocaleString('id-ID')}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        className="bg-[#0066cc]/10 text-[#0066cc] hover:bg-[#0066cc] hover:text-white px-4 py-2 rounded-full text-sm font-semibold transition"
                      >
                        Beli
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white w-full max-w-5xl rounded-3xl md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row relative animate-in slide-in-from-bottom-5 md:zoom-in-95" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 md:top-8 md:right-8 z-10 p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
            
            <div className="w-full md:w-1/2 p-10 md:p-16 flex items-center justify-center bg-[#fbfbfd]">
              {selectedProduct.imageUrl ? (
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.title} 
                  className="w-full h-[300px] md:h-[500px] object-contain scale-100 hover:scale-110 transition-transform duration-700 cursor-zoom-in" 
                />
              ) : (
                <div className="w-full h-[300px] md:h-[500px] flex items-center justify-center text-gray-400">No Image</div>
              )}
            </div>
            
            <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
              <div className="text-xs font-bold tracking-widest text-[#bf4800] uppercase mb-4">
                {selectedProduct.category}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-black mb-4 tracking-tight">
                {selectedProduct.title}
              </h2>
              <p className="text-gray-500 mb-8 text-base md:text-lg leading-relaxed">
                {selectedProduct.description || "Rasakan pengalaman menggunakan teknologi terdepan dengan fitur inovatif dan performa yang luar biasa dari perangkat ini."}
              </p>
              
              <div className="mb-8">
                {selectedProduct.discount ? (
                  <div className="flex items-end gap-3 mb-1">
                    <span className="text-lg text-gray-400 line-through">Rp {selectedProduct.price.toLocaleString('id-ID')}</span>
                    <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">{selectedProduct.discount}% OFF</span>
                  </div>
                ) : null}
                <div className="text-4xl md:text-5xl font-semibold text-black tracking-tighter">
                  Rp {getFinalPrice(selectedProduct).toLocaleString('id-ID')}
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-gray-100">
                <button 
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full bg-[#0066cc] text-white py-4 rounded-full font-semibold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
                >
                  Tambahkan ke Keranjang
                </button>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Garansi Resmi • 
                  <Truck className="w-4 h-4 text-blue-500 ml-2" />
                  Gratis Ongkir
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Services Modal */}
      {isServicesModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-white flex flex-col animate-in slide-in-from-bottom">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-black">Layanan Seadanya Store</h2>
            <button onClick={() => setIsServicesModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-900" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto w-full pb-24">
            <div className="max-w-4xl mx-auto px-6 pt-12 pb-20">
              <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-black mb-6">
                  Selamat Datang di Seadanya Store
                </h1>
                <p className="text-xl font-medium text-gray-500 mb-6">
                  Solusi Pintar untuk Siklus Hidup Gadget Anda.
                </p>
                <p className="text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Di Seadanya Store, kami believe bahwa teknologi hebat tidak harus selalu mahal atau merusak lingkungan. 
                  Kami hadir sebagai mitra terpercaya yang siap melayani segala kebutuhan gadget Anda—mulai dari tukar tambah, 
                  penjualan unit bekas berkualitas, hingga servis profesional. Kami berkomitmen menciptakan ekosistem gadget yang 
                  berkelanjutan agar teknologi tetap dapat dinikmati secara maksimal oleh siapa saja.
                </p>
              </div>

              <div className="space-y-24">
                {/* 1 */}
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-full md:w-1/2 rounded-3xl overflow-hidden shadow-2xl">
                    <img src="https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&q=80&w=800" alt="Trade-In" className="w-full h-[300px] object-cover hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="w-full md:w-1/2 space-y-4">
                    <div className="text-sm font-bold tracking-widest text-[#0066cc] uppercase">1. Trade-In Center (Tukar Tambah)</div>
                    <h3 className="text-2xl md:text-3xl font-bold text-black tracking-tight">Upgrade Gadget Lama Jadi Baru, Lebih Hemat!</h3>
                    <p className="text-gray-600 leading-relaxed text-base">
                      Berikan napas baru bagi teknologi Anda. Di Seadanya Store, gadget lama Anda (iPhone, Android, MacBook, atau Laptop) memiliki nilai tinggi. Gunakan sebagai potongan harga instan untuk membawa pulang perangkat impian terbaru. Proses cepat, penilaian transparan, dan data Anda dijamin aman.
                    </p>
                  </div>
                </div>

                {/* 2 */}
                <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                  <div className="w-full md:w-1/2 rounded-3xl overflow-hidden shadow-2xl">
                    <img src="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&q=80&w=800" alt="Buy-Back" className="w-full h-[300px] object-cover hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="w-full md:w-1/2 space-y-4">
                    <div className="text-sm font-bold tracking-widest text-[#0066cc] uppercase">2. Buy-Back Program (Jual Gadget Anda)</div>
                    <h3 className="text-2xl md:text-3xl font-bold text-black tracking-tight">Ubah Gadget Tak Terpakai Menjadi Dana Tunai.</h3>
                    <p className="text-gray-600 leading-relaxed text-base">
                      Punya perangkat yang sudah tidak digunakan? Jangan biarkan tersimpan di laci. Seadanya Store siap membeli unit Anda dengan harga yang kompetitif. Kami memberikan penilaian instan dan pembayaran langsung tanpa ribet.
                    </p>
                  </div>
                </div>

                {/* 3 */}
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-full md:w-1/2 rounded-3xl overflow-hidden shadow-2xl">
                    <img src="https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&q=80&w=800" alt="Pre-Owned" className="w-full h-[300px] object-cover hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="w-full md:w-1/2 space-y-4">
                    <div className="text-sm font-bold tracking-widest text-[#0066cc] uppercase">3. Seadanya Pre-Owned (Unit Second Berkualitas)</div>
                    <h3 className="text-2xl md:text-3xl font-bold text-black tracking-tight">Kualitas Flagship, Harga Bersahabat.</h3>
                    <p className="text-gray-600 leading-relaxed text-base">
                      Ingin performa tinggi tapi anggaran terbatas? Koleksi second-hand di Seadanya Store adalah pilihannya. Setiap unit telah melewati 50+ tahap inspeksi ketat oleh tim ahli kami dan dilengkapi dengan garansi toko untuk kenyamanan Anda.
                    </p>
                  </div>
                </div>

                {/* 4 */}
                <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                  <div className="w-full md:w-1/2 rounded-3xl overflow-hidden shadow-2xl">
                    <img src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800" alt="Care & Repair" className="w-full h-[300px] object-cover hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="w-full md:w-1/2 space-y-4">
                    <div className="text-sm font-bold tracking-widest text-[#0066cc] uppercase">4. Care & Repair (Servis & Upgrade)</div>
                    <h3 className="text-2xl md:text-3xl font-bold text-black tracking-tight">Perpanjang Usia Gadget dengan Suku Cadang Orisinal.</h3>
                    <p className="text-gray-600 leading-relaxed text-base">
                      Kami tidak hanya menjual, kami juga merawat. Dari penggantian baterai hingga perbaikan mesin yang rumit, teknisi Seadanya Store siap mengembalikan performa terbaik gadget Anda menggunakan suku cadang berkualitas dan layanan yang jujur.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-24 p-10 bg-gray-50 rounded-[2rem] border border-gray-100 text-center">
                <h3 className="text-2xl font-bold text-black mb-8">Mengapa Memilih Seadanya Store?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <ShieldCheck className="w-6 h-6 text-black" />
                    </div>
                    <h4 className="font-bold text-gray-900">Terpercaya</h4>
                    <p className="text-sm text-gray-500">Transparansi penilaian harga tanpa ada yang disembunyikan.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Heart className="w-6 h-6 text-black" />
                    </div>
                    <h4 className="font-bold text-gray-900">Bertanggung Jawab</h4>
                    <p className="text-sm text-gray-500">Setiap langkah kita berkontribusi pada pengurangan limbah elektronik.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Clock className="w-6 h-6 text-black" />
                    </div>
                    <h4 className="font-bold text-gray-900">Layanan Cepat</h4>
                    <p className="text-sm text-gray-500">Kami menghargai waktu Anda sebagaimana kami menghargai teknologi Anda.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wishlist Drawer Overlay */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/20 backdrop-blur-sm transition-opacity">
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-6 border-b border-apple-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <h2 className="text-2xl font-bold text-black">Wishlist</h2>
              </div>
              <button onClick={() => setIsWishlistOpen(false)} className="p-2 hover:bg-apple-100 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {wishlist.length === 0 ? (
                <div className="text-center text-apple-400 mt-20">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Wishlist Anda masih kosong.</p>
                  <button 
                    className="mt-4 text-apple-blue text-sm hover:underline"
                    onClick={() => setIsWishlistOpen(false)}
                  >
                    Simpan produk favorit Anda di sini
                  </button>
                </div>
              ) : (
                wishlist.map(product => (
                  <div key={product.id} className="flex gap-4 p-4 rounded-2xl border border-apple-100 bg-white">
                    <div className="w-20 h-20 bg-apple-100 rounded-xl flex-shrink-0 p-2">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h4 className="font-medium text-black line-clamp-1">{product.title}</h4>
                      <p className="text-sm text-apple-400 mb-2">Rp {product.price.toLocaleString('id-ID')}</p>
                      <div className="flex items-center gap-2 mt-auto">
                        <button 
                          className="flex-1 h-8 text-xs font-medium bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition"
                          onClick={() => moveWishlistToCart(product)}
                        >
                          Pindahkan ke Keranjang
                        </button>
                        <button 
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition" 
                          onClick={() => removeFromWishlist(product.id)}
                          title="Hapus dari wishlist"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/20 backdrop-blur-sm transition-opacity">
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-6 border-b border-apple-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-black" />
                <h2 className="text-2xl font-bold text-black">Keranjang</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-apple-100 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-apple-50/50">
              {cart.length === 0 ? (
                <div className="text-center text-apple-400 mt-20">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Keranjang belanja masih kosong.</p>
                  <button 
                    className="mt-4 text-apple-blue text-sm hover:underline"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Mulai Belanja
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex gap-4 p-4 rounded-2xl border border-apple-100 bg-white">
                    <div className="w-20 h-20 bg-apple-50 rounded-xl flex-shrink-0 p-2">
                      {item.product.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.title} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h4 className="font-medium text-black line-clamp-1">{item.product.title}</h4>
                      <p className="text-sm font-medium text-black mb-3">
                        {item.product.discount ? (
                          <span className="text-xs text-gray-500 line-through mr-2">Rp {item.product.price.toLocaleString('id-ID')}</span>
                        ) : null}
                        Rp {getFinalPrice(item.product).toLocaleString('id-ID')}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center bg-apple-50 rounded-full p-0.5 border border-apple-100 shadow-sm">
                          <button 
                            className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-full transition text-apple-500 shadow-sm" 
                            onClick={() => updateQuantity(item.product.id, -1)}
                          >
                            -
                          </button>
                          <span className="text-sm w-6 text-center font-medium text-black">{item.quantity}</span>
                          <button 
                            className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-full transition text-apple-500 shadow-sm" 
                            onClick={() => updateQuantity(item.product.id, 1)}
                          >
                            +
                          </button>
                        </div>
                        <button 
                          className="text-xs font-medium text-red-500 hover:text-red-600 transition" 
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-apple-100 bg-white shadow-[0_-4px_10px_rgb(0,0,0,0.02)] z-10">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-apple-400">
                    <span>Subtotal</span>
                    <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm text-apple-400">
                    <span>Pengiriman</span>
                    <span>Dihitung saat checkout</span>
                  </div>
                  <div className="pt-3 border-t border-apple-100 flex justify-between font-semibold text-lg text-black">
                    <span>Total Keseluruhan</span>
                    <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <button 
                  className="w-full py-4 text-white bg-black hover:bg-gray-800 font-semibold text-lg rounded-2xl shadow-md flex items-center justify-center gap-2 transition" 
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckout(true);
                  }}
                >
                  Checkout Sekarang <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-black">Checkout</h2>
                <button onClick={() => setIsCheckout(false)} className="p-2 hover:bg-apple-100 rounded-full transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-2 mb-8">
                <div className={`h-1 flex-1 rounded-full ${checkoutStep >= 1 ? 'bg-apple-blue' : 'bg-apple-200'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${checkoutStep >= 2 ? 'bg-apple-blue' : 'bg-apple-200'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${checkoutStep >= 3 ? 'bg-apple-blue' : 'bg-apple-200'}`}></div>
              </div>

              <form onSubmit={handleCheckoutSubmit}>
                {checkoutStep === 1 && (
                  <div className="space-y-4 animate-in slide-in-from-right-4">
                    <h3 className="font-semibold text-lg text-black mb-4">Informasi Pengiriman</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-apple-500">Nama Lengkap</label>
                        <input
                          required
                          type="text"
                          name="name"
                          value={customerInfo.name}
                          onChange={handleCustomerInfoChange}
                          className="w-full p-3 bg-white border border-apple-200 rounded-xl focus:ring-2 focus:ring-apple-blue focus:border-transparent outline-none transition shadow-sm"
                          placeholder="Contoh: Budi Santoso"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-apple-500">Email</label>
                        <input
                          required
                          type="email"
                          name="email"
                          value={customerInfo.email}
                          onChange={handleCustomerInfoChange}
                          className="w-full p-3 bg-white border border-apple-200 rounded-xl focus:ring-2 focus:ring-apple-blue focus:border-transparent outline-none transition shadow-sm"
                          placeholder="budi@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-apple-500">Alamat Lengkap</label>
                      <textarea
                        required
                        rows={3}
                        name="address"
                        value={customerInfo.address}
                        onChange={handleCustomerInfoChange}
                        className="w-full p-3 bg-white border border-apple-200 rounded-xl focus:ring-2 focus:ring-apple-blue focus:border-transparent outline-none transition shadow-sm"
                        placeholder="Nama Jalan, Gedung, No. Rumah..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-apple-500">Opsi Pengiriman</label>
                      <select
                        name="shipping"
                        value={customerInfo.shipping}
                        onChange={handleCustomerInfoChange}
                        className="w-full p-3 bg-white border border-apple-200 rounded-xl focus:ring-2 focus:ring-apple-blue focus:border-transparent outline-none transition shadow-sm"
                      >
                        <option value="0">Lainnya (Transaksi Langsung Tanpa Ekspedisi)</option>
                        <option value="125000">JNE Reguler, Packing Kayu & Asuransi (Estimasi Rp 125.000)</option>
                        <option value="125000">J&T Express, Packing Kayu & Asuransi (Estimasi Rp 125.000)</option>
                        <option value="125000">SiCepat HALU, Packing Kayu & Asuransi (Estimasi Rp 125.000)</option>
                      </select>
                    </div>
                  </div>
                )}

                {checkoutStep === 2 && (
                  <div className="space-y-4 animate-in slide-in-from-right-4">
                    <h3 className="font-semibold text-lg text-black mb-4">Metode Pembayaran</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { value: 'bca', label: 'BCA Virtual Account', desc: 'Verifikasi otomatis, sisa waktu 24 jam' },
                        { value: 'mandiri', label: 'Mandiri Virtual Account', desc: 'Verifikasi otomatis' },
                        { value: 'cod', label: 'Bayar di Tempat (COD)', desc: 'Bayar tunai kepada kurir saat pesanan tiba' },
                      ].map((method) => (
                        <label
                          key={method.value}
                          className={`flex items-start p-4 border rounded-xl cursor-pointer hover:bg-apple-50 transition group ${
                            selectedPayment === method.value ? 'border-apple-blue bg-apple-50' : 'border-apple-200'
                          }`}
                        >
                          <div className="pt-0.5">
                            <input
                              type="radio"
                              name="payment"
                              value={method.value}
                              checked={selectedPayment === method.value}
                              onChange={(e) => setSelectedPayment(e.target.value)}
                              className="w-4 h-4 text-apple-blue"
                            />
                          </div>
                          <div className="ml-3">
                            <span className="font-medium text-black block mb-1">{method.label}</span>
                            <span className="text-xs text-apple-400">{method.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {checkoutStep === 3 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 text-center py-8">
                    <div className="w-20 h-20 bg-blue-50 text-apple-blue rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100">
                      <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h3 className="font-bold text-3xl text-black">Konfirmasi Pembayaran</h3>
                    <div className="max-w-xs mx-auto">
                      <div className="flex justify-between items-center py-3 border-b border-apple-100">
                        <span className="text-apple-400">Total Belanja</span>
                        <span className="font-medium text-black">Rp {cartTotal.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-apple-100">
                        <span className="text-apple-400">Ongkos Kirim</span>
                        <span className="font-medium text-black">Rp {shippingCost === 0 ? '0' : shippingCost.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="font-semibold text-black">Total Tagihan</span>
                        <span className="font-bold text-xl text-black">Rp {(cartTotal + shippingCost).toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Info pembayaran dinamis berdasarkan metode */}
                    <div className="bg-apple-50 p-6 rounded-2xl text-sm text-left mt-4 border border-apple-100 space-y-2">
                      {selectedPayment === 'bca' && (
                        <>
                          <p className="flex items-start gap-2 text-apple-500">
                            <span className="text-apple-blue flex-shrink-0 mt-0.5">ℹ</span>
                            Transfer ke <strong className="text-black">BCA Virtual Account</strong>
                          </p>
                          <p className="flex items-start gap-2 text-apple-500">
                            <span className="text-apple-blue flex-shrink-0 mt-0.5">🏦</span>
                            No. Rekening: <strong className="text-black ml-1">7741062520</strong> a.n. Viqri Firmansyah
                          </p>
                        </>
                      )}
                      {selectedPayment === 'mandiri' && (
                        <>
                          <p className="flex items-start gap-2 text-apple-500">
                            <span className="text-apple-blue flex-shrink-0 mt-0.5">ℹ</span>
                            Transfer ke <strong className="text-black">Mandiri Virtual Account</strong>
                          </p>
                          <p className="flex items-start gap-2 text-apple-500">
                            <span className="text-apple-blue flex-shrink-0 mt-0.5">🏦</span>
                            No. Rekening: <strong className="text-black ml-1">1310025111396</strong> a.n. Junaedi
                          </p>
                        </>
                      )}
                      {selectedPayment === 'cod' && (
                        <p className="flex items-start gap-2 text-apple-500">
                          <span className="text-apple-blue flex-shrink-0 mt-0.5">ℹ</span>
                          Pesanan akan dibayar tunai saat kurir tiba. Pastikan Anda berada di lokasi pengiriman.
                        </p>
                      )}
                    </div>

                    {/* Upload bukti hanya untuk metode non-COD */}
                    {selectedPayment !== 'cod' && (
                      <div className="flex flex-col items-center gap-4">
                        <label className="text-sm font-medium text-gray-700">Upload Bukti Pembayaran</label>
                        <div className="flex items-center gap-4">
                          {formData.imageUrl && !isAnalyzing && (
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
                            disabled={isAnalyzing}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0066cc]/10 file:text-[#0066cc] hover:file:bg-[#0066cc]/20 transition-colors cursor-pointer disabled:opacity-50"
                          />
                        </div>
                        
                        {/* Status Pengecekan AI */}
                        {isAnalyzing && (
                          <span className="text-xs text-blue-600 animate-pulse font-medium bg-blue-50 p-2 rounded border border-blue-200">
                            🔄 AI sedang memverifikasi keaslian nota pembayaran...
                          </span>
                        )}

                        {/* Pesan Error Jika Ditolak AI */}
                        {errorMessage && (
                          <span className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded border border-red-200 text-center max-w-xs">
                            {errorMessage}
                          </span>
                        )}

                        {/* Informasi Wajib Isi */}
                        {!formData.imageUrl && !errorMessage && !isAnalyzing && (
                          <span className="text-xs text-red-500 font-medium">
                            * Bukti pembayaran wajib diunggah untuk metode ini
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {checkoutStep === 4 && completedOrder && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 py-4">
                    <div className="text-center mb-8">
                       <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100 shadow-sm">
                         <ShieldCheck className="w-8 h-8" />
                       </div>
                       <h3 className="font-bold text-2xl text-black">Pembayaran Berhasil!</h3>
                       {completedOrder.customerName !== 'Guest' && (
                          <p className="text-sm text-gray-600 mt-1">
                            Atas nama: <span className="font-semibold text-black">{completedOrder.customerName}</span>
                          </p>
                        )}
                    </div>

                    <div className="bg-white border text-left border-gray-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Nomor Invoice</p>
                          <p className="font-bold text-black text-lg">{completedOrder.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 mb-1">Tanggal Transaksi</p>
                          <p className="font-medium text-black">
                            {new Date(completedOrder.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
                        {completedOrder.items.map((item: any) => (
                           <div key={item.product.id} className="flex justify-between items-center text-sm">
                             <div className="flex items-center gap-3">
                               {item.product.imageUrl ? (
                                 <img src={item.product.imageUrl} alt={item.product.title} className="w-10 h-10 object-cover rounded bg-gray-50" />
                               ) : (
                                 <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-[10px]">Img</div>
                               )}
                               <div>
                                 <p className="font-medium text-black">{item.product.title}</p>
                                 <p className="text-gray-500">{item.quantity}x @ Rp {getFinalPrice(item.product).toLocaleString('id-ID')}</p>
                               </div>
                             </div>
                             <p className="font-semibold text-black">Rp {(getFinalPrice(item.product) * item.quantity).toLocaleString('id-ID')}</p>
                           </div>
                        ))}
                      </div>

                      <div className="max-w-xs ml-auto">
                        <div className="flex justify-between items-center py-2 text-sm text-gray-600">
                          <span>Subtotal</span>
                          <span>Rp {completedOrder.total.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 text-sm text-gray-600">
                          <span>Ongkos Kirim</span>
                          <span>Rp {shippingCost === 0 ? '0' : shippingCost.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 mt-2 border-t border-gray-100">
                          <span className="font-bold text-black">Total Bayar</span>
                          <span className="font-bold text-lg text-[#0066cc]">Rp {(completedOrder.total + shippingCost).toLocaleString('id-ID')}</span>
                        </div>
                      </div>

                      <div className="bg-apple-50 p-6 rounded-2xl text-sm text-left mt-8 border border-apple-100 space-y-2">
                        {selectedPayment === 'cod' ? (
                          <>
                            <p className="flex items-start gap-2 text-apple-500">
                              <span className="text-apple-blue flex-shrink-0 mt-0.5">💵</span>
                              Siapkan uang tunai sebesar Rp. {(completedOrder.total + shippingCost).toLocaleString('id-ID')} untuk diserahkan kepada kurir saat pesanan tiba.
                            </p>
                            <p className="flex items-start gap-2 text-apple-500">
                              <span className="text-apple-blue flex-shrink-0 mt-0.5">ℹ</span>
                              Pastikan Anda atau perwakilan Anda berada di lokasi pengiriman ketika kurir datang.
                            </p>
                          </>
                        ) : (
                          <p className="flex items-start gap-2 text-apple-500">
                            <span className="text-apple-blue flex-shrink-0 mt-0.5">ℹ</span>
                            Konfirmasi pembayaran lewat WhatsApp{" "}
                            <a
                              href="https://wa.me/085861969844"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-apple-blue underline hover:opacity-75 transition"
                            >
                              Disini
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-8 pt-6 border-t border-apple-100">
                  {[2, 3].includes(checkoutStep) ? (
                    <button type="button" className="px-4 py-2 border rounded-xl hover:bg-gray-50 text-sm" onClick={() => setCheckoutStep(s => s - 1)}>
                      Kembali
                    </button>
                  ) : <div />}
                  <button type="submit" className={`px-8 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition ${checkoutStep === 3 ? "w-full max-w-xs mx-auto" : ""}`}>
                    {checkoutStep === 3 ? 'Kirim Bukti Pembayaran' : checkoutStep === 4 ? 'Tutup Invoice' : 'Lanjutkan'}
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
      
      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {isChatOpen && (
          <div className="absolute bottom-16 right-0 w-80 bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#0066cc] p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold">Chat Bantuan</h3>
                <p className="text-xs text-blue-100">Balasan instan selama jam kerja</p>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="hover:bg-black/10 p-1 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 h-64 overflow-y-auto p-4 space-y-4 bg-gray-50 flex flex-col">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.sender === 'user' ? 'bg-[#0066cc] text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tulis pesan..." 
                className="flex-1 py-2 px-4 bg-gray-100 rounded-full text-sm outline-none focus:ring-1 focus:ring-[#0066cc]"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim()}
                className="bg-[#0066cc] text-white p-2 rounded-full disabled:opacity-50 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 hover:scale-105 ${isChatOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-[#0066cc] hover:bg-[#0077ed]'}`}
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </button>
      </div>

    </div>
  );
}