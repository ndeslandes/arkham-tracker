'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: string;
  title: string;
  cycle: string;
  type: string;
  owned: 'Owned' | "Don't care" | 'Want' | 'Preordered' | '';
  played: 'Played' | 'No' | '';
  comments?: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/collection')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching collection:', err);
        setLoading(false);
      });
  }, []);

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const updatedProduct = { ...product, ...updates };
    
    // Optimistic update
    setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));

    try {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch (error) {
      console.error('Error updating product:', error);
      // Revert on error
      setProducts(prev => prev.map(p => p.id === id ? product : p));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium">Loading Investigation...</p>
        </div>
      </div>
    );
  }

  const cycles = Array.from(new Set(products.map(p => p.cycle)));

  const totalOwned = products.filter(p => p.owned === 'Owned' || p.owned === 'Preordered').length;
  const totalPlayed = products.filter(p => p.played === 'Played').length;
  const totalItems = products.length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <header className="mb-8 sticky top-0 bg-slate-950/90 backdrop-blur-md py-6 z-10 border-b border-slate-800">
          <h1 className="text-3xl font-bold mb-6 text-white tracking-tight">Arkham Horror TCG Tracker</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-inner">
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Collection Progress</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-mono font-bold text-blue-400">
                  {totalOwned} <span className="text-slate-600 text-xl">/ {totalItems}</span>
                </p>
                <p className="text-blue-500/50 font-mono text-sm mb-1">{Math.round((totalOwned / totalItems) * 100)}%</p>
              </div>
              <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${(totalOwned / totalItems) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-inner">
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Campaigns Played</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-mono font-bold text-emerald-400">
                  {totalPlayed} <span className="text-slate-600 text-xl">/ {totalItems}</span>
                </p>
                <p className="text-emerald-500/50 font-mono text-sm mb-1">{Math.round((totalPlayed / totalItems) * 100)}%</p>
              </div>
              <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${(totalPlayed / totalItems) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-12 pb-20">
          {cycles.map(cycle => (
            <section key={cycle} className="scroll-mt-40">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-100">
                <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                {cycle}
              </h2>
              <div className="grid gap-3">
                {products.filter(p => p.cycle === cycle).map(product => (
                  <div 
                    key={product.id} 
                    className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                      product.owned === 'Owned' || product.owned === 'Preordered'
                        ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-900/60' 
                        : 'bg-slate-900/10 border-slate-800/30 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-slate-400 border border-slate-700">
                          {product.id}
                        </span>
                        <h3 className="font-semibold text-slate-200 leading-tight">{product.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium uppercase tracking-tighter italic">
                          {product.type}
                        </span>
                        {product.comments && (
                          <span className="text-[11px] text-slate-400 italic">
                            &middot; {product.comments}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8 justify-between md:justify-end">
                      <div className="flex flex-col">
                        <label className="text-[9px] uppercase font-bold text-slate-500 mb-1 tracking-widest">Ownership</label>
                        <select 
                          value={product.owned} 
                          onChange={(e) => updateProduct(product.id, { owned: e.target.value as any })}
                          className={`text-xs font-semibold rounded-lg px-3 py-2 outline-none border transition-colors ${
                            product.owned === 'Owned' 
                              ? 'bg-blue-900/20 border-blue-500/30 text-blue-300' 
                              : product.owned === 'Preordered'
                              ? 'bg-purple-900/20 border-purple-500/30 text-purple-300'
                              : product.owned === 'Want'
                              ? 'bg-amber-900/20 border-amber-500/30 text-amber-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          <option value="">Status...</option>
                          <option value="Owned">Owned</option>
                          <option value="Preordered">Preordered</option>
                          <option value="Want">Want</option>
                          <option value="Don't care">Don't care</option>
                        </select>
                      </div>

                      <div className="flex flex-col items-center">
                        <label className="text-[9px] uppercase font-bold text-slate-500 mb-1 tracking-widest text-center">Played</label>
                        <button
                          onClick={() => updateProduct(product.id, { played: product.played === 'Played' ? 'No' : 'Played' })}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
                            product.played === 'Played'
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                              : 'bg-slate-800 border-slate-700 text-slate-600 hover:border-slate-600'
                          }`}
                        >
                          {product.played === 'Played' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-3 h-3 rounded-sm border-2 border-slate-600"></div>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
