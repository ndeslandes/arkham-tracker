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
  url?: string;
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
    <main className="min-h-screen bg-background text-foreground selection:bg-eldritch selection:text-white">
      <div className="max-w-4xl mx-auto p-4 md:p-8 relative z-10">
        <header className="mb-12 sticky top-0 bg-background/90 backdrop-blur-md py-8 z-10 border-b-2 border-eldritch shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <h1 className="text-4xl font-typewriter font-bold mb-8 text-slate-100 tracking-tight text-center uppercase">
            Investigation Archive: Arkham TCG
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 p-5 rounded-sm border border-eldritch shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-900/50 group-hover:bg-blue-800 transition-colors"></div>
              <p className="font-typewriter text-slate-500 text-xs uppercase font-bold tracking-widest mb-2">Expeditions Secured</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-typewriter font-bold text-blue-400">
                  {totalOwned} <span className="text-slate-600 text-xl">/ {totalItems}</span>
                </p>
                <p className="text-blue-500/50 font-typewriter text-sm mb-1">{Math.round((totalOwned / totalItems) * 100)}%</p>
              </div>
              <div className="mt-4 w-full bg-black/40 rounded-none h-1.5 border border-eldritch/30">
                <div 
                  className="bg-blue-800 h-full rounded-none transition-all duration-1000 shadow-[0_0_8px_rgba(30,58,138,0.5)]" 
                  style={{ width: `${(totalOwned / totalItems) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-slate-900/60 p-5 rounded-sm border border-eldritch shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-900/50 group-hover:bg-emerald-800 transition-colors"></div>
              <p className="font-typewriter text-slate-500 text-xs uppercase font-bold tracking-widest mb-2">Mysteries Solved</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-typewriter font-bold text-emerald-500/80">
                  {totalPlayed} <span className="text-slate-600 text-xl">/ {totalItems}</span>
                </p>
                <p className="text-emerald-500/40 font-typewriter text-sm mb-1">{Math.round((totalPlayed / totalItems) * 100)}%</p>
              </div>
              <div className="mt-4 w-full bg-black/40 rounded-none h-1.5 border border-eldritch/30">
                <div 
                  className="bg-emerald-900 h-full rounded-none transition-all duration-1000 shadow-[0_0_8px_rgba(6,78,59,0.5)]" 
                  style={{ width: `${(totalPlayed / totalItems) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-16 pb-32">
          {cycles.map(cycle => (
            <section key={cycle} className="scroll-mt-48">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-eldritch to-transparent"></div>
                <h2 className="text-2xl font-typewriter font-bold text-slate-300 uppercase tracking-widest">
                  {cycle}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-eldritch to-transparent"></div>
              </div>
              <div className="grid gap-4">
                {products.filter(p => p.cycle === cycle).map(product => (
                  <div 
                    key={product.id} 
                    className={`flex flex-col md:flex-row md:items-center justify-between p-5 border relative transition-all duration-300 ${
                      product.owned === 'Owned' || product.owned === 'Preordered'
                        ? 'bg-slate-900/30 border-eldritch hover:bg-slate-900/50 hover:border-slate-700/50' 
                        : 'bg-black/20 border-slate-900/50 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex-1 mb-6 md:mb-0">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="px-2 py-0.5 rounded-none bg-black/60 text-[10px] font-typewriter font-bold text-slate-500 border border-eldritch/50">
                          {product.id}
                        </span>
                        <h3 className="text-lg font-serif font-semibold text-slate-200 tracking-wide leading-tight">{product.title}</h3>
                        {product.url && (
                          <a 
                            href={product.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-slate-600 hover:text-blue-400/60 transition-colors"
                            title="View official record"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-[11px] text-slate-500 font-typewriter uppercase tracking-tighter italic">
                          {product.type}
                        </span>
                        {product.comments && (
                          <span className="text-[11px] text-slate-400 italic font-serif flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-eldritch"></span>
                            {product.comments}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-10 justify-between md:justify-end">
                      <div className="flex flex-col min-w-[120px]">
                        <label className="text-[9px] font-typewriter uppercase font-bold text-slate-600 mb-1.5 tracking-[0.2em]">Record Status</label>
                        <select 
                          value={product.owned} 
                          onChange={(e) => updateProduct(product.id, { owned: e.target.value as any })}
                          className={`text-xs font-typewriter font-bold rounded-sm px-3 py-2.5 outline-none border transition-all appearance-none cursor-pointer ${
                            product.owned === 'Owned' 
                              ? 'bg-blue-900/10 border-blue-900/40 text-blue-300/80 focus:border-blue-700' 
                              : product.owned === 'Preordered'
                              ? 'bg-purple-900/10 border-purple-900/40 text-purple-300/80 focus:border-purple-700'
                              : product.owned === 'Want'
                              ? 'bg-amber-900/10 border-amber-900/40 text-amber-300/80 focus:border-amber-700'
                              : 'bg-black/40 border-eldritch text-slate-500 hover:border-slate-700'
                          }`}
                        >
                          <option value="" className="bg-slate-900">Unrecorded</option>
                          <option value="Owned" className="bg-slate-900">In Collection</option>
                          <option value="Preordered" className="bg-slate-900">En Route</option>
                          <option value="Want" className="bg-slate-900">Acquisition Target</option>
                          <option value="Don't care" className="bg-slate-900">Disregarded</option>
                        </select>
                      </div>

                      <div className="flex flex-col items-center">
                        <label className="text-[9px] font-typewriter uppercase font-bold text-slate-600 mb-1.5 tracking-[0.2em] text-center">Executed</label>
                        <button
                          onClick={() => updateProduct(product.id, { played: product.played === 'Played' ? 'No' : 'Played' })}
                          className={`w-11 h-11 rounded-sm flex items-center justify-center border transition-all relative group ${
                            product.played === 'Played'
                              ? 'bg-emerald-900/10 border-emerald-800/50 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                              : 'bg-black/40 border-eldritch text-slate-700 hover:border-slate-600'
                          }`}
                          title={product.played === 'Played' ? 'Mark as Not Played' : 'Mark as Played'}
                        >
                          {product.played === 'Played' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-none border border-slate-700 group-hover:border-slate-500"></div>
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
