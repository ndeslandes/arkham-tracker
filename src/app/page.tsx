'use client';

import { useState, useEffect } from 'react';

interface Scenario {
  name: string;
  played: boolean;
}

interface Product {
  id: string;
  title: string;
  cycle: string;
  type: string;
  owned: 'Owned' | "Don't care" | 'Want' | 'Preordered' | '';
  played: 'Played' | 'No' | '';
  scenarios: Scenario[];
  scenarioCount: number;
  comments?: string;
  url?: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideDisregarded, setHideDisregarded] = useState(false);
  const [collapsedCycles, setCollapsedCycles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/collection')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
          
          // Auto-collapse completed cycles
          const initialCollapsed: Record<string, boolean> = {};
          const cycles = Array.from(new Set(data.map((p: Product) => p.cycle)));
          
          cycles.forEach(cycle => {
            const cycleProducts = data.filter((p: Product) => p.cycle === cycle && p.owned !== "Don't care");
            if (cycleProducts.length > 0) {
              const allScenarios = cycleProducts.flatMap(p => p.scenarios || []);
              const hasScenarios = allScenarios.length > 0;
              const allPlayed = hasScenarios && allScenarios.every(s => s.played);
              if (allPlayed) {
                initialCollapsed[cycle] = true;
              }
            }
          });
          setCollapsedCycles(initialCollapsed);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching collection:', err);
        setLoading(false);
      });
  }, []);

  const toggleCycleCollapse = (cycle: string) => {
    setCollapsedCycles(prev => ({
      ...prev,
      [cycle]: !prev[cycle]
    }));
  };

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

  // Unique scenarios calculation
  const uniqueScenariosMap = new Map<string, { played: boolean; isDisregarded: boolean }>();
  
  products.forEach(p => {
    p.scenarios.forEach(s => {
      const key = `${p.cycle}|${s.name}`;
      const existing = uniqueScenariosMap.get(key);
      
      const played = (existing?.played) || s.played;
      const isDisregarded = existing ? (existing.isDisregarded && p.owned === "Don't care") : (p.owned === "Don't care");
      
      uniqueScenariosMap.set(key, { played, isDisregarded });
    });
  });

  const uniqueScenariosList = Array.from(uniqueScenariosMap.values());
  const totalPlayedScenarios = uniqueScenariosList.filter(s => s.played && !s.isDisregarded).length;
  const totalPossibleScenarios = uniqueScenariosList.filter(s => !s.isDisregarded).length;

  const totalOwned = products.filter(p => (p.owned === 'Owned' || p.owned === 'Preordered') && p.owned !== "Don't care").length;
  const totalItems = products.filter(p => p.owned !== "Don't care").length;

  const toggleScenario = async (productId: string, scenarioIdx: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const scenario = product.scenarios[scenarioIdx];
    const newPlayedStatus = !scenario.played;
    const scenarioName = scenario.name;
    const cycle = product.cycle;

    const updatedProducts = products.map(p => {
      if (p.cycle === cycle) {
        const sIdx = p.scenarios.findIndex(s => s.name === scenarioName);
        if (sIdx > -1) {
          const newScenarios = [...p.scenarios];
          newScenarios[sIdx] = { ...newScenarios[sIdx], played: newPlayedStatus };
          return { ...p, scenarios: newScenarios };
        }
      }
      return p;
    });

    const prevProducts = products;
    setProducts(updatedProducts);

    try {
      const affectedProducts = updatedProducts.filter((p, idx) => p.scenarios !== prevProducts[idx].scenarios);
      await Promise.all(affectedProducts.map(p => 
        fetch('/api/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p),
        })
      ));
    } catch (error) {
      console.error('Error updating scenarios:', error);
      setProducts(prevProducts);
    }
  };

  const filteredProducts = products.filter(p => !hideDisregarded || p.owned !== "Don't care");
  const cycles = Array.from(new Set(filteredProducts.map(p => p.cycle))).sort((a, b) => {
    if (a === 'Investigator Starter Decks') return 1;
    if (b === 'Investigator Starter Decks') return -1;
    return 0; // Maintain relative order for others
  });

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-eldritch selection:text-white">
      <div className="max-w-4xl mx-auto p-4 md:p-8 relative z-10">
        <header className="mb-12 sticky top-0 bg-background/90 backdrop-blur-md py-8 z-10 border-b-2 border-eldritch shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="text-4xl font-typewriter font-bold text-slate-100 tracking-tight uppercase">
              Investigation Archive: Arkham TCG
            </h1>
            <button
              onClick={() => setHideDisregarded(!hideDisregarded)}
              className={`px-4 py-2 text-[10px] font-typewriter font-bold uppercase tracking-widest border transition-all ${
                hideDisregarded 
                  ? 'bg-amber-900/20 border-amber-700 text-amber-400 shadow-[0_0_15px_rgba(180,83,9,0.1)]' 
                  : 'bg-black/40 border-eldritch text-slate-500 hover:border-slate-700 hover:text-slate-400'
              }`}
            >
              {hideDisregarded ? 'Showing Active Records' : 'Hide Disregarded'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 p-5 rounded-sm border border-eldritch shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-900/50 group-hover:bg-blue-800 transition-colors"></div>
              <p className="font-typewriter text-slate-500 text-xs uppercase font-bold tracking-widest mb-2">Expeditions Secured</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-typewriter font-bold text-blue-400">
                  {totalOwned} <span className="text-slate-600 text-xl">/ {totalItems}</span>
                </p>
                <p className="text-blue-500/50 font-typewriter text-sm mb-1">{totalItems > 0 ? Math.round((totalOwned / totalItems) * 100) : 0}%</p>
              </div>
              <div className="mt-4 w-full bg-black/40 rounded-none h-1.5 border border-eldritch/30">
                <div 
                  className="bg-blue-800 h-full rounded-none transition-all duration-1000 shadow-[0_0_8px_rgba(30,58,138,0.5)]" 
                  style={{ width: `${totalItems > 0 ? (totalOwned / totalItems) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-slate-900/60 p-5 rounded-sm border border-eldritch shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-900/50 group-hover:bg-emerald-800 transition-colors"></div>
              <p className="font-typewriter text-slate-500 text-xs uppercase font-bold tracking-widest mb-2">Scenarios Solved</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-typewriter font-bold text-emerald-500/80">
                  {totalPlayedScenarios} <span className="text-slate-600 text-xl">/ {totalPossibleScenarios}</span>
                </p>
                <p className="text-emerald-500/40 font-typewriter text-sm mb-1">{totalPossibleScenarios > 0 ? Math.round((totalPlayedScenarios / totalPossibleScenarios) * 100) : 0}%</p>
              </div>
              <div className="mt-4 w-full bg-black/40 rounded-none h-1.5 border border-eldritch/30">
                <div 
                  className="bg-emerald-900 h-full rounded-none transition-all duration-1000 shadow-[0_0_8px_rgba(6,78,59,0.5)]" 
                  style={{ width: `${totalPossibleScenarios > 0 ? (totalPlayedScenarios / totalPossibleScenarios) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-16 pb-32">
          {cycles.map(cycle => {
            const cycleProducts = filteredProducts.filter(p => p.cycle === cycle);
            const allScenarios = cycleProducts.flatMap(p => p.scenarios || []);
            const hasScenarios = allScenarios.length > 0;
            const allPlayed = hasScenarios && allScenarios.every(s => s.played);
            const isCollapsed = collapsedCycles[cycle];

            return (
              <section key={cycle} className="scroll-mt-48">
                <div 
                  onClick={() => toggleCycleCollapse(cycle)}
                  className="flex items-center gap-4 mb-8 cursor-pointer group select-none"
                >
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-eldritch to-transparent"></div>
                  <div className="flex flex-col items-center gap-1 px-4">
                    <div className="flex items-center gap-3">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <h2 className="text-2xl font-typewriter font-bold text-slate-300 uppercase tracking-widest group-hover:text-white transition-colors">
                        {cycle}
                      </h2>
                    </div>
                    {allPlayed && (
                      <span className="text-[9px] font-typewriter font-bold text-emerald-500/60 uppercase tracking-[0.3em] animate-pulse">
                        Case Closed
                      </span>
                    )}
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-eldritch to-transparent"></div>
                </div>
                
                {!isCollapsed && (
                  <div className="grid gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    {cycleProducts.map(product => (
                      <div 
                        key={product.id} 
                        className={`flex flex-col p-5 border relative transition-all duration-300 ${
                          product.owned === 'Owned' || product.owned === 'Preordered'
                            ? 'bg-slate-900/30 border-eldritch hover:bg-slate-900/50 hover:border-slate-700/50' 
                            : 'bg-black/20 border-slate-900/50 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
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
                                onChange={(e) => updateProduct(product.id, { owned: e.target.value as Product['owned'] })}
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
                          </div>
                        </div>

                        {product.scenarios && product.scenarios.length > 0 && (
                          <div className="mt-6 pt-6 border-t border-eldritch/30">
                            <label className="text-[9px] font-typewriter uppercase font-bold text-slate-600 mb-3 block tracking-[0.2em]">Scenarios</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {product.scenarios.map((scenario, idx) => (
                                <div 
                                  key={idx}
                                  onClick={() => toggleScenario(product.id, idx)}
                                  className={`flex items-center gap-3 p-2 rounded-sm border cursor-pointer transition-all ${
                                    scenario.played 
                                      ? 'bg-emerald-900/10 border-emerald-800/40 text-emerald-400/90 shadow-[0_0_10px_rgba(16,185,129,0.02)]' 
                                      : 'bg-black/20 border-eldritch/50 text-slate-500 hover:border-slate-700 hover:bg-black/40'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-none border flex items-center justify-center transition-all ${
                                    scenario.played ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-700'
                                  }`}>
                                    {scenario.played && (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                  <span className="text-xs font-serif tracking-wide">{scenario.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
