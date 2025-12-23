
import React, { useState, useEffect, useRef } from 'react';
import { Product, Category } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
  initialData?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: Category.FIREWORKS,
    caseCost: undefined,
    caseQuantity: undefined,
    unitCost: undefined,
    caseWholesalePrice: undefined,
    wholesalePrice: undefined,
    retailPrice: undefined,
    imageUrl: '',
    remarks: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        category: Category.FIREWORKS,
        caseCost: undefined,
        caseQuantity: undefined,
        unitCost: undefined,
        caseWholesalePrice: undefined,
        wholesalePrice: undefined,
        retailPrice: undefined,
        imageUrl: '',
        remarks: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const syncUnitPrices = () => {
    setFormData(prev => {
      const updates: Partial<Product> = {};
      if (prev.caseCost && prev.caseQuantity) {
        updates.unitCost = Number((prev.caseCost / prev.caseQuantity).toFixed(2));
      }
      if (prev.caseWholesalePrice && prev.caseQuantity && !prev.wholesalePrice) {
        updates.wholesalePrice = Number((prev.caseWholesalePrice / prev.caseQuantity).toFixed(2));
      }
      return { ...prev, ...updates };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-800">{initialData ? '编辑商品信息' : '录入新商品'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Image Upload Area */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className={`w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${formData.imageUrl ? 'border-transparent' : 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30'}`}>
              {formData.imageUrl ? (
                <>
                  <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm font-bold transition-opacity">
                    更换照片
                  </div>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">点击上传商品照片</p>
                </>
              )}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 ml-1">商品名称 *</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
              placeholder="请输入商品名称..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 ml-1">类别</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold"
              >
                {Object.values(Category).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 ml-1">备注</label>
              <input
                type="text"
                value={formData.remarks || ''}
                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all"
                placeholder="包装/规格/备注..."
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">进货及整箱价格</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-indigo-400 uppercase mb-1">整箱进价 (¥)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.caseCost || ''}
                  onBlur={syncUnitPrices}
                  onChange={e => setFormData({ ...formData, caseCost: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-indigo-100 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-indigo-400 uppercase mb-1">整箱数量 (件)</label>
                <input
                  type="number"
                  value={formData.caseQuantity || ''}
                  onBlur={syncUnitPrices}
                  onChange={e => setFormData({ ...formData, caseQuantity: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-indigo-100 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-emerald-500 uppercase mb-1">整箱批发价 (¥)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.caseWholesalePrice || ''}
                  onBlur={syncUnitPrices}
                  onChange={e => setFormData({ ...formData, caseWholesalePrice: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">单件成本 (¥)</label>
              <input
                type="number"
                step="0.01"
                value={formData.unitCost || ''}
                onChange={e => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || undefined })}
                className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-transparent focus:bg-white focus:border-slate-200 outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-emerald-400 uppercase mb-1">单件批发 (¥)</label>
              <input
                type="number"
                step="0.01"
                value={formData.wholesalePrice || ''}
                onChange={e => setFormData({ ...formData, wholesalePrice: parseFloat(e.target.value) || undefined })}
                className="w-full px-3 py-2 rounded-lg bg-emerald-50 border border-transparent focus:bg-white focus:border-emerald-200 outline-none font-bold text-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-indigo-400 uppercase mb-1">建议售价 (¥)</label>
              <input
                type="number"
                step="0.01"
                value={formData.retailPrice || ''}
                onChange={e => setFormData({ ...formData, retailPrice: parseFloat(e.target.value) || undefined })}
                className="w-full px-3 py-2 rounded-lg bg-indigo-100 border border-transparent focus:bg-white focus:border-indigo-300 outline-none text-indigo-700 font-black text-lg"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-2xl border-2 border-slate-100 font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 font-bold text-white hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
