
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, Category } from './types';
import { StatCard } from './components/StatCard';
import { ProductModal } from './components/ProductModal';
import { BatchReviewModal } from './components/BatchReviewModal';
import { parseProductImage } from './services/geminiService';

const INITIAL_MOCK_DATA: Product[] = [
  // --- 小烟花类 (补充了整箱进价和整箱批发价) ---
  { id: 'p1', name: '顾和隆 三角斗士 24/1', category: Category.SMALL_FIREWORKS, caseCost: 276, caseQuantity: 24, unitCost: 11.5, caseWholesalePrice: 480, wholesalePrice: 20, retailPrice: 35, updatedAt: Date.now() },
  { id: 'p2', name: '顾和隆 孔雀开屏 20/1', category: Category.SMALL_FIREWORKS, caseCost: 240, caseQuantity: 20, unitCost: 12, caseWholesalePrice: 400, wholesalePrice: 22, retailPrice: 38, updatedAt: Date.now() },
  { id: 'p3', name: '迷你孔雀开屏 36/1', category: Category.SMALL_FIREWORKS, caseCost: 252, caseQuantity: 36, unitCost: 7, caseWholesalePrice: 450, wholesalePrice: 13, retailPrice: 15, updatedAt: Date.now() },
  { id: 'p4', name: '顾和隆 威猛加特林 12/1', category: Category.SMALL_FIREWORKS, caseCost: 144, caseQuantity: 12, unitCost: 12, caseWholesalePrice: 240, wholesalePrice: 20, retailPrice: 35, updatedAt: Date.now() },
  { id: 'p5', name: '旧金山黑老大彩箱 48/10/10', category: Category.SMALL_FIREWORKS, caseCost: 56, caseQuantity: 48, unitCost: 1.17, caseWholesalePrice: 130, wholesalePrice: 3, retailPrice: 5, updatedAt: Date.now() },
  { id: 'p6', name: '顾和隆 月兔 12/1', category: Category.SMALL_FIREWORKS, caseCost: 117, caseQuantity: 12, unitCost: 9.75, caseWholesalePrice: 180, wholesalePrice: 15, retailPrice: 25, updatedAt: Date.now() },
  { id: 'p11', name: '彩菊烟花 40/12/8', category: Category.SMALL_FIREWORKS, caseCost: 160, caseQuantity: 40, unitCost: 4, caseWholesalePrice: 300, wholesalePrice: 7.5, retailPrice: 10, updatedAt: Date.now() },

  // --- 烟花类 ---
  { id: 'f1', name: '顾和隆 80发浪漫时光 日景', category: Category.FIREWORKS, caseCost: 80, caseQuantity: 1, unitCost: 80, retailPrice: 168, remarks: '日景爆款', updatedAt: Date.now() },
  { id: 'f2', name: '顾和隆 100发美焰 (彩箱)', category: Category.FIREWORKS, caseCost: 55, caseQuantity: 1, unitCost: 55, retailPrice: 128, updatedAt: Date.now() },
  { id: 'f5', name: '易守华 36发九天揽月', category: Category.FIREWORKS, unitCost: 309, retailPrice: 580, updatedAt: Date.now() },

  // --- 鞭炮类 ---
  { id: 'c1', name: '义学 财盈门全红银花炮 4号-10封', category: Category.CRACKERS, unitCost: 167, retailPrice: 280, updatedAt: Date.now() }
];

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [pendingProducts, setPendingProducts] = useState<Partial<Product>[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New storage key v6 for extended pricing schema
  useEffect(() => {
    const saved = localStorage.getItem('store_products_v6');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setProducts(parsed);
        } else {
          setProducts(INITIAL_MOCK_DATA);
        }
      } catch (e) {
        setProducts(INITIAL_MOCK_DATA);
      }
    } else {
      setProducts(INITIAL_MOCK_DATA);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('store_products_v6', JSON.stringify(products));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (p.remarks && p.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === '全部' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const stats = useMemo(() => {
    const total = products.length;
    const invValue = products.reduce((acc, p) => acc + (p.unitCost || 0), 0);
    const margins = products
      .filter(p => p.retailPrice && p.unitCost)
      .map(p => ((p.retailPrice! - p.unitCost!) / p.retailPrice!) * 100);
    const avgMargin = margins.length > 0 ? margins.reduce((a, b) => a + b, 0) / margins.length : 0;
    
    return {
      totalItems: total,
      averageMargin: Math.round(avgMargin),
      inventoryValue: invValue.toLocaleString()
    };
  }, [products]);

  const handleSaveProduct = (data: Partial<Product>) => {
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...data, updatedAt: Date.now() } as Product : p));
    } else {
      const newProduct: Product = {
        ...data as any,
        id: crypto.randomUUID(),
        updatedAt: Date.now(),
        category: data.category || Category.OTHERS
      };
      setProducts(prev => [newProduct, ...prev]);
    }
    setEditingProduct(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const parsed = await parseProductImage(base64);
        if (parsed && parsed.length > 0) {
          setPendingProducts(parsed);
        } else {
          alert('未能从图片中识别到商品，请确保图片清晰。');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert('识别出错，请重试');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteProduct = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个商品吗？')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12z" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">店面价格簿</h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">Smart Price Manager</p>
            </div>
          </div>

          <div className="flex-1 max-w-lg mx-2">
            <div className="relative group">
              <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                type="text"
                placeholder="搜索名称、价格、规格..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-100 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl transition-all outline-none font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="hidden sm:flex p-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all active:scale-90"
              title="拍照批量识别"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button
              onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
              className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center gap-2 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              <span className="hidden md:inline">录入</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 pb-32">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <StatCard label="在库品种" value={stats.totalItems} color="bg-indigo-50 text-indigo-600" icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} />
          <StatCard label="预计利润率" value={`${stats.averageMargin}%`} color="bg-emerald-50 text-emerald-600" icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <StatCard label="当前类别" value={selectedCategory} color="bg-slate-100 text-slate-600" icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>} />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar scroll-smooth">
          {['全部', ...Object.values(Category)].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-8 py-3 rounded-2xl whitespace-nowrap text-sm font-black transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200'
                  : 'bg-white text-slate-500 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(product => {
            const margin = product.retailPrice && product.unitCost 
              ? Math.round((product.retailPrice - product.unitCost) / product.retailPrice * 100) 
              : null;
            return (
              <div 
                key={product.id} 
                onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer overflow-hidden flex flex-col"
              >
                {/* Product Header / Image */}
                <div className="h-44 bg-slate-50 relative overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={product.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 group-hover:bg-indigo-50 transition-colors">
                      <div className="text-4xl font-black text-slate-200 group-hover:text-indigo-200 transition-colors">{product.name.charAt(0)}</div>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-sm">
                      {product.category}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => deleteProduct(product.id, e)}
                    className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md rounded-full text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{product.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1 h-4 italic mb-6">{product.remarks || '无备注信息'}</p>

                  <div className="space-y-4 mt-auto">
                    {/* Entry Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-slate-50 flex flex-col justify-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">整箱进价</p>
                        <p className="text-sm font-black text-slate-700">¥{product.caseCost?.toLocaleString() || '-'}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 flex flex-col justify-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">单件成本</p>
                        <p className="text-sm font-black text-slate-700">¥{product.unitCost?.toLocaleString() || '-'}</p>
                      </div>
                    </div>

                    {/* Sales Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-emerald-50/50 flex flex-col justify-center">
                        <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">整箱批发</p>
                        <p className="text-sm font-black text-emerald-600">¥{product.caseWholesalePrice?.toLocaleString() || '-'}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-indigo-50/50 flex flex-col justify-center border border-indigo-100 shadow-sm">
                        <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">零售价</p>
                        <p className="text-base font-black text-indigo-700">¥{product.retailPrice?.toLocaleString() || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {margin !== null && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden mr-3">
                        <div 
                          className={`h-full transition-all duration-1000 ${margin > 40 ? 'bg-emerald-500' : 'bg-orange-500'}`} 
                          style={{ width: `${Math.min(margin, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-[11px] font-black whitespace-nowrap ${margin > 40 ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {margin}% 利润
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Scan Action for Mobile */}
      <div className="fixed bottom-8 right-8 sm:hidden z-50">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </div>

      {/* Scanning UI Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 text-center max-w-sm mx-4">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 border-[12px] border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 border-[12px] border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-12 h-12 text-indigo-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900">正在识别表格</h3>
              <p className="text-slate-500 mt-4 leading-relaxed font-medium">Gemini 正在提取整箱进价、批发价等关键信息...</p>
            </div>
          </div>
        </div>
      )}

      {/* Batch Review */}
      {pendingProducts && (
        <BatchReviewModal 
          items={pendingProducts} 
          onCancel={() => setPendingProducts(null)}
          onConfirm={(items) => {
            setProducts(prev => [...items, ...prev]);
            setPendingProducts(null);
          }}
        />
      )}

      {/* Single Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingProduct(null); }}
        onSave={handleSaveProduct}
        initialData={editingProduct}
      />
    </div>
  );
};

export default App;
