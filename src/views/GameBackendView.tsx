import { Shield, Globe, Coins, Users } from 'lucide-react';

export default function GameBackendView() {
  return (
    <div className="space-y-8">
      <header className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Game Architecture & Systems</h2>
        <p className="text-white/60 max-w-2xl text-sm leading-relaxed">
          The infrastructure powering "Echoes of the Frontier", routing telemetry to the AI engine, and the core gameplay loops.
        </p>
      </header>

      {/* Backend Architecture Map */}
      <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-8 text-center">Service Architecture</h3>
        <div className="flex flex-col items-center max-w-3xl mx-auto">
          {/* Client -> Gateway */}
          <div className="w-48 py-3 bg-black/40 border border-white/10 rounded-xl text-center text-sm font-bold text-white/80 mb-6 shadow-sm">
            Player Client
          </div>
          <div className="w-px h-6 bg-white/20 mb-6"></div>

          <div className="w-64 py-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-center text-sm font-bold text-indigo-300 mb-6 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            API Gateway
          </div>
          <div className="w-px h-6 bg-white/20"></div>

          {/* Services Split */}
          <div className="w-full max-w-lg border-t border-white/20 relative mb-6">
            <div className="absolute top-0 left-0 w-px h-6 bg-white/20"></div>
            <div className="absolute top-0 left-1/2 w-px h-6 bg-white/20 -translate-x-1/2"></div>
            <div className="absolute top-0 right-0 w-px h-6 bg-white/20"></div>
          </div>

          <div className="flex w-full justify-between max-w-lg mb-6 relative z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-[11px] font-bold text-white/60 uppercase">World</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Coins className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-[11px] font-bold text-white/60 uppercase">Economy</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-[11px] font-bold text-white/60 uppercase">Identity</span>
            </div>
          </div>

          <div className="w-full max-w-lg border-b border-white/20 relative mb-6">
            <div className="absolute bottom-0 left-0 w-px h-6 bg-white/20"></div>
            <div className="absolute bottom-0 left-1/2 w-px h-6 bg-white/20 -translate-x-1/2"></div>
            <div className="absolute bottom-0 right-0 w-px h-6 bg-white/20"></div>
          </div>
          <div className="w-px h-6 bg-white/20 mb-6"></div>

          <div className="w-64 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-sm font-bold text-emerald-300 mb-6 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            Telemetry Bus
          </div>
          <div className="w-px h-6 bg-white/20 mb-6"></div>

          <div className="w-48 py-3 bg-white/10 border border-white/20 rounded-xl text-center text-sm font-bold text-white/90 shadow-sm">
            AI Intelligence
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* The Game */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-2">Target Title</h3>
          <h2 className="text-2xl font-bold text-white/90 mb-6">Echoes of the Frontier</h2>

          <div className="space-y-6">
            <div>
               <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-3">Core Pillars</h4>
               <div className="grid grid-cols-2 gap-3">
                 <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                   <Globe className="w-4 h-4 text-blue-400" />
                   <span className="text-sm text-white/80">Procedural World</span>
                 </div>
                 <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                   <Shield className="w-4 h-4 text-purple-400" />
                   <span className="text-sm text-white/80">Action Defines Identity</span>
                 </div>
                 <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                   <Coins className="w-4 h-4 text-amber-400" />
                   <span className="text-sm text-white/80">Player-Driven Economy</span>
                 </div>
                 <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                   <Users className="w-4 h-4 text-emerald-400" />
                   <span className="text-sm text-white/80">Guild Organizations</span>
                 </div>
               </div>
            </div>

            <div>
               <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-3">Skill Ecosystem</h4>
               <div className="flex flex-wrap gap-2">
                 {['Exploration', 'Crafting', 'Architecture', 'Trade', 'Combat', 'Diplomacy', 'Discovery', 'Taming'].map(skill => (
                   <span key={skill} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-white/70">
                     {skill}
                   </span>
                 ))}
               </div>
            </div>
          </div>
        </section>

        {/* Monetization Engine */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-1">Revenue Architecture</h3>
              <h2 className="text-2xl font-bold text-white/90">Monetization Engine</h2>
            </div>
            <span className="text-[9px] px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded font-bold uppercase tracking-wider">
              No Exploitation
            </span>
          </div>

          <div className="space-y-4">
            <MonetizationPillar title="Cosmetics" rating={5} description="Visual flair and identity expression." />
            <MonetizationPillar title="Housing" rating={5} description="Strong emotional attachment & persistence." />
            <MonetizationPillar title="Creator Marketplace" rating={5} description="Network effects & community generated value." />
            <MonetizationPillar title="Expansions" rating={4} description="Major content drops." />
            <MonetizationPillar title="Subscription" rating={4} description="Optional VIP with storage, perks, and creator tools." />
          </div>
        </section>
      </div>
    </div>
  );
}

function MonetizationPillar({ title, rating, description }: { title: string, rating: number, description: string }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-black/20 border border-white/5">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-white/90">{title}</span>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className={`w-3 h-3 ${i < rating ? 'text-amber-400' : 'text-white/20'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-white/50">{description}</p>
    </div>
  );
}
