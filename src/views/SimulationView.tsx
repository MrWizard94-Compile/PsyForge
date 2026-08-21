import { playerModels } from '../data/players';
import { LineChart, Play, RotateCcw, Activity } from 'lucide-react';
import { useSimulation } from '../hooks/useSimulation';

export default function SimulationView() {
  const model = playerModels[0];
  if (model === undefined) {
    throw new Error('The simulation demonstration requires at least one player model.');
  }
  const { state, progress, runSimulation, reset } = useSimulation(3000);

  return (
    <>
      <header className="mb-8 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Simulation Engine</h2>
        <p className="text-white/60 max-w-2xl text-sm leading-relaxed">
          Run a deterministic demonstration of a proposed design change. This view does not execute a production simulation.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Simulation Target: {model.id}</h3>

             {state === 'idle' && (
               <button
                 onClick={runSimulation}
                 className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(79,70,229,0.4)]"
               >
                 <Play className="w-4 h-4" /> Run Simulation
               </button>
             )}

             {state === 'running' && (
               <div className="flex items-center gap-3">
                 <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                 <span className="text-sm font-medium text-indigo-300">Simulating... {Math.round(progress)}%</span>
               </div>
             )}

             {state === 'complete' && (
               <button
                 onClick={reset}
                 className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
               >
                 <RotateCcw className="w-4 h-4" /> Reset
               </button>
             )}
          </div>

          <div className="bg-black/20 p-4 rounded-2xl border border-white/5 mb-6">
             <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Demonstration Scenario</p>
             <p className="text-sm text-white/90">Patch 1.4: Mandatory PvP resource zones for high-end crafting.</p>
          </div>

          <div className="flex-1 space-y-4 relative">
             <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Simulation Output</h4>

             {state === 'idle' && (
               <div className="absolute inset-0 flex items-center justify-center top-10 border border-dashed border-white/10 rounded-2xl bg-black/10">
                 <p className="text-sm text-white/40 font-medium">Ready to simulate. Press 'Run Simulation'.</p>
               </div>
             )}

             {state === 'running' && (
               <div className="space-y-4 opacity-50 pointer-events-none transition-opacity duration-300">
                 <div className="h-24 bg-white/5 rounded-xl border border-white/10 animate-pulse" />
                 <div className="h-24 bg-white/5 rounded-xl border border-white/10 animate-pulse" />
               </div>
             )}

             {state === 'complete' && (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                   <p className="text-[10px] text-red-400 font-bold mb-1 uppercase tracking-wider">Churn Risk Alert</p>
                   <p className="text-sm text-white/90 font-medium leading-relaxed">
                     {model.predictions.churnRisk} The demonstration projects stress metrics exceeding threshold for '{model.type}' cohort.
                   </p>
                 </div>
                 <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                   <p className="text-[10px] text-green-400 font-bold mb-1 uppercase tracking-wider">Positive Alternative</p>
                   <p className="text-sm text-white/90 font-medium leading-relaxed">
                     In this fixed example, making crafting resources available via Co-op PvE raises engagement by 12%. {model.predictions.likelyAction}
                   </p>
                 </div>
               </div>
             )}
          </div>
        </div>

        <div className="w-full lg:w-80 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col transition-opacity duration-500">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-6 flex items-center gap-2">
            <LineChart className="w-4 h-4 text-indigo-400" />
            Forecast Engine
          </h3>
          <div className={`space-y-6 ${state === 'complete' ? 'opacity-100' : 'opacity-30'}`}>
             <div>
               <div className="flex justify-between text-[11px] font-bold mb-2"><span className="text-white/40 uppercase">Forecast Revenue (Q3)</span><span className="text-green-400">+$420k</span></div>
               <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-green-500 rounded-full w-[70%] transition-all duration-1000" style={{ width: state === 'complete' ? '70%' : '0%' }}></div></div>
             </div>
             <div>
               <div className="flex justify-between text-[11px] font-bold mb-2"><span className="text-white/40 uppercase">Forecast Churn (Q3)</span><span className="text-red-400">+14%</span></div>
               <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-red-500 rounded-full w-[45%] transition-all duration-1000" style={{ width: state === 'complete' ? '45%' : '0%' }}></div></div>
             </div>
             <div className="pt-4 border-t border-white/10">
               <p className="text-[10px] text-white/40 font-bold mb-1 uppercase tracking-wider">Monetization Profile</p>
               <p className="text-sm text-white/90 font-mono bg-black/40 px-3 py-2 rounded-lg border border-white/5">{model.predictions.monetizationTier}</p>
             </div>
          </div>
        </div>
      </div>
    </>
  );
}
