import { playerModels } from '../data/players';
import { Users } from 'lucide-react';

export default function PlayerModelsView() {
  return (
    <>
      <header className="mb-8 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Player Intelligence</h2>
        <p className="text-white/60 max-w-2xl text-sm leading-relaxed">
          Dynamic multidimensional profiles built from telemetry over time. Rather than demographics, we model motivation.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {playerModels.map(model => (
          <div key={model.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Profile: {model.id}</h3>
                  <p className="text-xs text-white/50">{model.name}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30 font-bold uppercase tracking-wider">
                TYPE: {model.type}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-black/20 p-4 rounded-2xl border border-white/5">
              <TraitBar label="Explorer" value={model.traits.explorer} colorClass="bg-indigo-500" />
              <TraitBar label="Collector" value={model.traits.collector} colorClass="bg-purple-500" />
              <TraitBar label="Social" value={model.traits.social} colorClass="bg-blue-500" />
              <TraitBar label="Competitive" value={model.traits.competitive} colorClass="bg-pink-500" />
              <TraitBar label="Builder" value={model.traits.builder} colorClass="bg-cyan-500" />
              <TraitBar label="Story" value={model.traits.story} colorClass="bg-amber-500" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
               <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-3">Model Evolved Traits</h4>
               <p className="text-sm text-white/80 italic leading-relaxed">
                 Started as Unknown. Over time, demonstrated high affinity for {Object.entries(model.traits).filter(([, value]) => value > 70).map(([trait]) => trait).join(', ')} patterns. Avoids {Object.entries(model.traits).filter(([, value]) => value < 30).map(([trait]) => trait).join(', ')} activities.
               </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function TraitBar({ label, value, colorClass }: { label: string, value: number, colorClass: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px] font-medium"><span className="text-white/50 uppercase tracking-wide">{label}</span><span className="text-white/90">{value}%</span></div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5"><div className={`h-full ${colorClass} rounded-full`} style={{ width: `${value}%` }}></div></div>
    </div>
  );
}
