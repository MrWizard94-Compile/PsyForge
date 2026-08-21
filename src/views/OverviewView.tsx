import React from 'react';
import { Gamepad2, Activity, BrainCircuit, Network, Code2, LineChart } from 'lucide-react';

export default function OverviewView() {
  return (
    <>
      <header className="mb-8 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold tracking-tight mb-2">System Overview</h2>
        <p className="text-white/60 max-w-2xl text-sm leading-relaxed">
          PsyForge is an AI-driven player psychology & game intelligence platform designed to understand, model, simulate, and improve human interaction with digital experiences.
        </p>
      </header>

      {/* Ecosystem Visualization Map */}
      <div className="max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col items-center relative">

          {/* Player Client */}
          <div className="flex flex-col items-center z-10">
            <span className="text-[10px] font-semibold tracking-[0.2em] text-white/40 mb-2 uppercase">Human Behavior</span>
            <Node title="Player Client" subtitle="Mobile / Desktop" icon={<Gamepad2 className="w-5 h-5 text-indigo-300" />} />
          </div>

          <Connector />

          {/* Telemetry Engine */}
          <Node title="Telemetry Engine" icon={<Activity className="w-5 h-5 text-blue-400" />} />

          <div className="h-8 w-px bg-white/20"></div>
          <div className="w-full max-w-lg border-t border-white/20 relative">
            <div className="absolute top-0 left-0 w-px h-8 bg-white/20"></div>
            <div className="absolute top-0 left-1/2 w-px h-8 bg-white/20 -translate-x-1/2"></div>
            <div className="absolute top-0 right-0 w-px h-8 bg-white/20"></div>
          </div>

          {/* State Layer */}
          <div className="flex w-full max-w-lg justify-between mt-8 z-10">
              <StateNode label="Game State" />
              <StateNode label="Player Model" />
              <StateNode label="Economy State" />
          </div>

          <div className="w-full max-w-lg border-b border-white/20 relative mt-8">
            <div className="absolute bottom-0 left-0 w-px h-8 bg-white/20"></div>
            <div className="absolute bottom-0 left-1/2 w-px h-8 bg-white/20 -translate-x-1/2"></div>
            <div className="absolute bottom-0 right-0 w-px h-8 bg-white/20"></div>
          </div>
          <div className="h-8 w-px bg-white/20"></div>

          {/* Intelligence Stack */}
          <div className="flex flex-col gap-6 w-full max-w-sm z-10 items-center">
            <Node title="Psychology Engine" icon={<BrainCircuit className="w-5 h-5 text-purple-400" />} className="w-full" />
            <Connector short />
            <Node title="Knowledge Graph" icon={<Network className="w-5 h-5 text-emerald-400" />} className="w-full" />
            <Connector short />
            <Node title="AI Design Agents" icon={<Code2 className="w-5 h-5 text-orange-400" />} className="w-full" />
            <Connector short />
            <Node title="Design Intelligence" icon={<LineChart className="w-5 h-5 text-rose-400" />} className="w-full" />
          </div>
        </div>
      </div>
    </>
  );
}

function Node({ title, subtitle, icon, className = '' }: { title: string, subtitle?: string, icon?: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center gap-4 shadow-sm min-w-[200px] ${className}`}>
      {icon && <div className="p-2 bg-white/10 rounded-lg border border-white/10 text-white/80">{icon}</div>}
      <div>
        <div className="font-semibold text-sm text-white/90 uppercase tracking-wider">{title}</div>
        {subtitle && <div className="text-[10px] text-white/50 mt-0.5 uppercase tracking-wide">{subtitle}</div>}
      </div>
    </div>
  );
}

function StateNode({ label }: { label: string }) {
  return (
    <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[11px] font-semibold text-indigo-300 uppercase tracking-wider shadow-[0_0_10px_rgba(99,102,241,0.1)]">
      {label}
    </div>
  );
}

function Connector({ short = false }: { short?: boolean }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div className={`w-px bg-white/20 ${short ? 'h-6' : 'h-10'}`}></div>
      <div className="w-2 h-2 border-b-2 border-r-2 border-white/20 rotate-45 transform translate-y-[-4px]"></div>
    </div>
  );
}
