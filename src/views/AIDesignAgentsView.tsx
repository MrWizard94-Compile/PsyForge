import React from 'react';
import { useDesignAgents } from '../hooks/useDesignAgents';
import { Brain, Coins, UserCheck, Scale, PenTool, MessageSquareText } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Brain: <Brain className="w-5 h-5" />,
  Coins: <Coins className="w-5 h-5" />,
  UserCheck: <UserCheck className="w-5 h-5" />,
  Scale: <Scale className="w-5 h-5" />,
  PenTool: <PenTool className="w-5 h-5" />
};

const colorMap: Record<string, string> = {
  indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  red: 'text-red-400 bg-red-500/10 border-red-500/30',
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
};

const textMap: Record<string, string> = {
  indigo: 'text-indigo-300',
  amber: 'text-amber-300',
  emerald: 'text-emerald-300',
  red: 'text-red-300',
  cyan: 'text-cyan-300'
};

const glowMap: Record<string, string> = {
  indigo: 'bg-indigo-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  red: 'bg-red-500',
  cyan: 'bg-cyan-500'
};

export default function AIDesignAgentsView() {
  const agents = useDesignAgents();

  return (
    <>
      <header className="mb-8 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold tracking-tight mb-2">AI Design Agents</h2>
        <p className="text-white/60 max-w-2xl text-sm leading-relaxed">
          Multiple specialized intelligence agents evaluating telemetry, querying the knowledge graph, and proposing game design adjustments.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents.map(agent => (
          <div key={agent.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden group">
            {/* Background glow based on agent color - subtle */}
            <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[50px] transition-opacity duration-1000 ${agent.status === 'Active' || agent.status === 'Analyzing' ? 'opacity-40' : 'opacity-10'} group-hover:opacity-60 ${glowMap[agent.color]}`}></div>

            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 ${agent.status !== 'Standby' ? colorMap[agent.color] : 'bg-white/5 border-white/10 text-white/40'}`}>
                  {iconMap[agent.icon]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">{agent.name}</h3>
                  <p className={`text-[10px] font-mono uppercase tracking-widest transition-colors duration-500 ${agent.status !== 'Standby' ? textMap[agent.color] : 'text-white/30'}`}>{agent.id}</p>
                </div>
              </div>
              <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors duration-500 ${agent.status === 'Active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : agent.status === 'Analyzing' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/10 text-white/50 border border-white/10'}`}>
                {agent.status}
              </span>
            </div>

            <div className="space-y-3 relative z-10 mt-2">
              <div>
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">Domain Focus</span>
                <p className="text-sm text-white/80">{agent.focus}</p>
              </div>
              <div>
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">Core Directive</span>
                <p className="text-sm text-white/80 italic">"{agent.exampleQuery}"</p>
              </div>
            </div>

            <div className="mt-auto pt-4 relative z-10">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquareText className={`w-4 h-4 transition-colors duration-500 ${agent.status === 'Analyzing' ? 'text-blue-400 animate-pulse' : 'text-white/40'}`} />
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                    {agent.status === 'Analyzing' ? 'Processing Telemetry...' : 'Latest Insight'}
                  </span>
                </div>
                <p className={`text-[13px] leading-relaxed transition-all duration-500 ${agent.status === 'Analyzing' ? 'opacity-50 blur-[2px]' : 'opacity-100 blur-0'} ${textMap[agent.color]}`}>
                  {agent.recentInsight}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
