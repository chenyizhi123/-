
import React, { useState } from 'react';
import { Product, Category } from '../types';

interface BatchReviewModalProps {
  items: Partial<Product>[];
  onCancel: () => void;
  onConfirm: (finalItems: Product[]) => void;
}

export const BatchReviewModal: React.FC<BatchReviewModalProps> = ({ items, onCancel, onConfirm }) => {
  const [editedItems, setEditedItems] = useState<Partial<Product>[]>(items);

  const updateItem = (index: number, field: keyof Product, value: any) => {
    const newList = [...editedItems];
    newList[index] = { ...newList[index], [field]: value };
    setEditedItems(newList);
  };

  const handleSave = () => {
    const finalProducts: Product[] = editedItems.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      updatedAt: Date.now(),
      name: item.name || '未命名商品',
      category: item.category || Category.OTHERS,
    } as Product));
    onConfirm(finalProducts);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[95vw] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900">AI 识别结果核对</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">请核对识别出的整箱进价、批发价及零售价，确保数据无误</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-x-auto p-6 bg-slate-50/30">
          <div className="min-w-[1200px]">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 sticky top-0 bg-slate-50 z-10">
              <div className="col-span-3">商品名称</div>
              <div className="col-span-1 text-center">整箱进价</div>
              <div className="col-span-1 text-center">每箱数量</div>
              <div className="col-span-1 text-center">单件进价</div>
              <div className="col-span-2 text-center text-emerald-600">整箱批发</div>
              <div className="col-span-2 text-center text-emerald-600">单件批发</div>
              <div className="col-span-1 text-center text-indigo-600">建议零售</div>
              <div className="col-span-1 text-right">操作</div>
            </div>

            <div className="mt-4 space-y-2">
              {editedItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:shadow-xl hover:scale-[1.01] transition-all items-center">
                  <div className="col-span-3">
                    <input 
                      className="w-full bg-transparent border-b border-slate-100 focus:border-indigo-500 outline-none py-1 text-sm font-bold text-slate-800"
                      value={item.name}
                      onChange={e => updateItem(idx, 'name', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <input 
                      type="number"
                      className="w-full text-center bg-transparent border-b border-slate-100 focus:border-indigo-500 outline-none py-1 text-sm"
                      value={item.caseCost || ''}
                      onChange={e => updateItem(idx, 'caseCost', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1">
                    <input 
                      type="number"
                      className="w-full text-center bg-transparent border-b border-slate-100 focus:border-indigo-500 outline-none py-1 text-sm"
                      value={item.caseQuantity || ''}
                      onChange={e => updateItem(idx, 'caseQuantity', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1">
                    <input 
                      type="number"
                      className="w-full text-center bg-transparent border-b border-slate-100 focus:border-indigo-500 outline-none py-1 text-sm text-slate-400"
                      value={item.unitCost || ''}
                      onChange={e => updateItem(idx, 'unitCost', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="number"
                      className="w-full text-center bg-emerald-50 rounded-lg border-b-2 border-emerald-200 focus:border-emerald-500 outline-none py-2 text-sm font-black text-emerald-700"
                      value={item.caseWholesalePrice || ''}
                      onChange={e => updateItem(idx, 'caseWholesalePrice', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="number"
                      className="w-full text-center bg-emerald-50 rounded-lg border-b-2 border-emerald-200 focus:border-emerald-500 outline-none py-2 text-sm font-black text-emerald-700"
                      value={item.wholesalePrice || ''}
                      onChange={e => updateItem(idx, 'wholesalePrice', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1">
                    <input 
                      type="number"
                      className="w-full text-center bg-indigo-50 rounded-lg border-b-2 border-indigo-200 focus:border-indigo-500 outline-none py-2 text-sm text-indigo-700 font-black"
                      value={item.retailPrice || ''}
                      onChange={e => updateItem(idx, 'retailPrice', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button 
                      onClick={() => setEditedItems(prev => prev.filter((_, i) => i !== idx))}
                      className="p-2 text-rose-400 hover:text-rose-600 transition-colors bg-rose-50 rounded-xl"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">检测到 {editedItems.length} 款商品准备入库</p>
          <div className="flex gap-4">
            <button onClick={onCancel} className="px-8 py-3 rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">再检查下</button>
            <button 
              onClick={handleSave}
              className="px-12 py-3 rounded-2xl bg-slate-900 text-white font-black hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all active:scale-95"
            >
              一键入库
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
