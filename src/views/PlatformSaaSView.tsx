import { Users, Zap, ArrowRight, Target, Server } from 'lucide-react';

export default function PlatformSaaSView() {
  return (
    <div className="space-y-8">
      <header className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">PsyForge Studio Intelligence</h2>
          <p className="text-white/60 max-w-2xl text-sm leading-relaxed">
            The B2B SaaS platform offering. Studios upload telemetry, receive intelligence, and run simulations.
          </p>
        </div>
        <div className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <Target className="w-4 h-4" /> Go to Market Phase
        </div>
      </header>

      {/* The Loop */}
      <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-x-auto">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-8 text-center">The Ultimate End State</h3>
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          <LoopStep label="Understand Humans" />
          <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0" />
          <LoopStep label="Simulate Humans" />
          <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0" />
          <LoopStep label="Design Experiences" />
          <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0" />
          <LoopStep label="Measure Reality" />
          <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0" />
          <LoopStep label="Improve Understanding" highlight />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Data Flow */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-6">Product Data Exchange</h3>
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-black/30 p-5 rounded-2xl border border-white/5">
              <h4 className="text-[11px] text-white/40 font-bold uppercase tracking-wider mb-3">Studios Upload</h4>
              <ul className="flex flex-wrap gap-2">
                {['Player Data', 'Economy Data', 'Reviews', 'Game Design Documents'].map(item => (
                  <li key={item} className="text-xs font-medium text-white/70 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">{item}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <Zap className="w-4 h-4 text-indigo-400" />
              </div>
            </div>

            <div className="bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/20">
              <h4 className="text-[11px] text-indigo-400/60 font-bold uppercase tracking-wider mb-3">PsyForge Returns</h4>
              <ul className="flex flex-wrap gap-2">
                {['Retention Problems', 'Player Segments', 'Economy Forecasts', 'Feature Recommendations', 'Simulation Results'].map(item => (
                  <li key={item} className="text-xs font-medium text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Scale & Team */}
        <div className="flex flex-col gap-8">
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" /> Hosting Architecture
            </h3>
            <div className="space-y-3">
              <ScaleTier name="Early Prototype" cost="$100-300/mo" details="Docker, Postgres, Vector DB, Local AI models" />
              <ScaleTier name="Beta" cost="$2k-5k/mo" details="Kubernetes, Managed Database, GPU inference, Analytics cluster" />
              <ScaleTier name="Scale (100k+ players)" cost="$10k-50k/mo" details="Multi-region, Dedicated AI inference, Data warehouse" />
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex-1">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" /> Minimum Team Required
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <TeamMember role="Founder / Architect" detail="You." />
              <TeamMember role="AI Engineer" detail="Models + pipelines" />
              <TeamMember role="Backend Engineer" detail="Game services" />
              <TeamMember role="Game Designer" detail="Systems balance" />
              <TeamMember role="Artist / Animator" detail="World creation" />
              <TeamMember role="Community Manager" detail="Player ecosystem" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function LoopStep({ label, highlight = false }: { label: string, highlight?: boolean }) {
  return (
    <div className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-center flex-1 min-w-[120px] ${
      highlight
      ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
      : 'bg-white/5 border border-white/10 text-white/70'
    }`}>
      {label}
    </div>
  );
}

function ScaleTier({ name, cost, details }: { name: string, cost: string, details: string }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-black/20 border border-white/5">
      <div className="flex justify-between items-center">
        <span className="text-[13px] font-bold text-white/90">{name}</span>
        <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">{cost}</span>
      </div>
      <p className="text-[11px] text-white/50">{details}</p>
    </div>
  );
}

function TeamMember({ role, detail }: { role: string, detail: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
      <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">{role}</p>
      <p className="text-xs text-white/70">{detail}</p>
    </div>
  );
}
