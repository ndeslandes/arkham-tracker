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
  const [collapsedCycles, setCollapsedCycles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/collection')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Synchronize scenario 'played' status across all products on load
          const playedScenarios = new Set<string>();
          data.forEach((p: Product) => {
            p.scenarios?.forEach(s => {
              if (s.played) playedScenarios.add(`${p.cycle}|${s.name}`);
            });
          });

          const synchronizedData = data.map((p: Product) => ({
            ...p,
            scenarios: p.scenarios?.map(s => ({
              ...s,
              played: s.played || playedScenarios.has(`${p.cycle}|${s.name}`)
            })) || []
          }));

          setProducts(synchronizedData);
          
          // Auto-collapse completed cycles
          const initialCollapsed: Record<string, boolean> = {};
          const cycles = Array.from(new Set(synchronizedData.map((p: Product) => p.cycle)));
          
          cycles.forEach(cycle => {
            const cycleProducts = synchronizedData.filter((p: Product) => p.cycle === cycle);
            if (cycleProducts.length > 0) {
              const allScenarios = cycleProducts.flatMap(p => p.scenarios || []);
              const uniqueNames = new Set(allScenarios.map(s => s.name));
              const allPlayed = uniqueNames.size > 0 && Array.from(uniqueNames).every(name => 
                allScenarios.find(s => s.name === name)?.played
              );
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

  // Unique scenarios calculation (Count every unique scenario once per cycle)
  const uniqueScenariosMap = new Map<string, { played: boolean }>();
  
  products.forEach(p => {
    p.scenarios.forEach(s => {
      const key = `${p.cycle}|${s.name}`;
      const existing = uniqueScenariosMap.get(key);
      const played = (existing?.played) || s.played;
      uniqueScenariosMap.set(key, { played });
    });
  });

  const uniqueScenariosList = Array.from(uniqueScenariosMap.values());
  const totalPlayedScenarios = uniqueScenariosList.filter(s => s.played).length;
  const totalPossibleScenarios = uniqueScenariosList.length;

  const totalOwned = products.filter(p => p.owned === 'Owned' || p.owned === 'Preordered').length;
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

  const cycles = Array.from(new Set(products.map(p => p.cycle))).sort((a, b) => {
    const bottomCycles = ['Standalones', 'Investigator Starter Decks', 'Novellas'];
    if (bottomCycles.includes(a) && !bottomCycles.includes(b)) return 1;
    if (!bottomCycles.includes(a) && bottomCycles.includes(b)) return -1;
    if (bottomCycles.includes(a) && bottomCycles.includes(b)) {
      return bottomCycles.indexOf(a) - bottomCycles.indexOf(b);
    }
    return 0;
  });

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-eldritch selection:text-white">
      <div className="max-w-4xl mx-auto p-4 md:p-8 relative z-10">
        <header className="mb-12 sticky top-0 bg-background/90 backdrop-blur-md py-8 z-10 border-b-2 border-eldritch shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="text-4xl font-typewriter font-bold text-slate-100 tracking-tight uppercase">
              Investigation Archive: Arkham TCG
            </h1>
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
            const cycleProducts = products.filter(p => p.cycle === cycle);
            const allScenarios = cycleProducts.flatMap(p => p.scenarios || []);
            const uniqueNames = Array.from(new Set(allScenarios.map(s => s.name)));
            const allPlayed = uniqueNames.length > 0 && uniqueNames.every(name => 
               allScenarios.find(s => s.name === name)?.played
            );
            const isCollapsed = collapsedCycles[cycle];

            // Grouping Logic
            let investigatorExpansions = cycleProducts.filter(p => p.type === 'Investigator Expansion' || (cycle === 'Core' && p.id === 'AHC60'));
            let campaignExpansions = cycleProducts.filter(p => p.type === 'Campaign Expansion');
            let legacyProducts = cycleProducts.filter(p => p.type === 'Deluxe' || p.type === 'Mythos Pack' || (cycle === 'Core' && p.id === 'AHC01'));
            let otherProducts = cycleProducts.filter(p => !['Investigator Expansion', 'Campaign Expansion', 'Deluxe', 'Mythos Pack'].includes(p.type) && p.id !== 'AHC60' && p.id !== 'AHC01');

            const showLegacyAsSubItems = (campaignExpansions.length > 0 || investigatorExpansions.length > 0) && legacyProducts.length > 0;
            const attachLegacyToId = campaignExpansions[0]?.id || investigatorExpansions[0]?.id;

            const renderProducts: Product[] = [];
            investigatorExpansions.forEach(p => renderProducts.push(p));
            campaignExpansions.forEach(p => renderProducts.push(p));
            if (!showLegacyAsSubItems) legacyProducts.forEach(p => renderProducts.push(p));
            otherProducts.forEach(p => renderProducts.push(p));

            return (
              <section key={cycle} className="scroll-mt-48 relative">
                {allPlayed && (
                  <div className="absolute -top-10 right-0 pointer-events-none z-20 opacity-60 mix-blend-lighten -rotate-12 border-[6px] border-emerald-500/40 p-1.5 rounded-sm shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <div className="border-2 border-emerald-500/30 px-6 py-2 flex flex-col items-center bg-emerald-950/10 backdrop-blur-[2px]">
                      <span className="font-typewriter font-black text-emerald-500 text-[11px] tracking-[0.3em] uppercase leading-none mb-1">Investigation</span>
                      <span className="font-typewriter font-black text-emerald-400 text-2xl tracking-[0.15em] uppercase leading-none">Archived</span>
                    </div>
                  </div>
                )}

                <div 
                  onClick={() => toggleCycleCollapse(cycle)}
                  className="flex items-center gap-4 mb-8 cursor-pointer group select-none relative z-10"
                >
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-eldritch to-transparent"></div>
                  <div className="flex flex-col items-center gap-2 px-6">
                    <div className="flex items-center gap-4">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                      <h2 className="text-2xl font-typewriter font-bold text-slate-300 uppercase tracking-widest group-hover:text-white transition-colors text-center">
                        {cycle}
                      </h2>
                      {allPlayed && (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {allPlayed && (
                      <span className="text-[10px] font-typewriter font-bold text-emerald-500 uppercase tracking-[0.4em]">
                        Case Closed
                      </span>
                    )}
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-eldritch to-transparent"></div>
                </div>
                
                {!isCollapsed && (
                  <div className="grid gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    {renderProducts.map(product => (
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
                              {product.scenarios.map((scenario, idx) => {
                                const displayNum = idx + 1;

                                return (
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
                                    <span className="text-[10px] font-typewriter font-bold opacity-40 min-w-[1.2em]">{displayNum}.</span>
                                    <span className="text-xs font-serif tracking-wide">{scenario.name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {showLegacyAsSubItems && product.id === attachLegacyToId && (
                          <div className="mt-6 pt-6 border-t border-eldritch/30">
                            <label className="text-[9px] font-typewriter uppercase font-bold text-slate-600 mb-3 block tracking-[0.2em]">Legacy Releases Tracking</label>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                              {legacyProducts.map(lp => (
                                <div key={lp.id} className={`flex items-center justify-between p-3 rounded-sm border transition-all ${
                                  lp.owned === 'Owned' || lp.owned === 'Preordered'
                                    ? 'bg-blue-900/10 border-blue-900/30 shadow-inner' 
                                    : 'bg-black/20 border-eldritch/50'
                                }`}>
                                  <div className="flex flex-col gap-1 pr-2">
                                    <div className="flex items-center gap-2">
                                      <span className="px-1.5 py-0.5 bg-black/60 border border-slate-700 text-[9px] font-mono text-slate-500 rounded-sm">
                                        {lp.id}
                                      </span>
                                      <span className="text-xs font-serif text-slate-300 leading-tight">{lp.title}</span>
                                    </div>
                                    <span className="text-[9px] text-slate-500 font-typewriter uppercase tracking-tighter italic">{lp.type}</span>
                                  </div>
                                  <select 
                                    value={lp.owned}
                                    onChange={(e) => updateProduct(lp.id, { owned: e.target.value as Product['owned'] })}
                                    className={`text-[10px] font-typewriter font-bold bg-slate-900 border rounded text-slate-400 px-2 py-1.5 outline-none transition-colors cursor-pointer ${
                                      lp.owned === 'Owned' ? 'border-blue-700/50 text-blue-400' : 'border-slate-700 hover:border-slate-500'
                                    }`}
                                  >
                                    <option value="">Unrecorded</option>
                                    <option value="Owned">Owned</option>
                                    <option value="Preordered">En Route</option>
                                    <option value="Want">Target</option>
                                    <option value="Don't care">Disregarded</option>
                                  </select>
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
