import { knowledgeNodes, knowledgeEdges } from '../data/graph';
import { Network } from 'lucide-react';

export default function KnowledgeGraphView() {
  return (
    <>
      <header className="mb-8 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Knowledge Graph</h2>
        <p className="text-white/60 max-w-2xl text-sm leading-relaxed">
          Relational intelligence mapping psychological concepts to player outcomes and behaviors.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
        <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <Network className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Live Relationships</h3>
          </div>

          <div className="flex-1 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute z-10 w-32 h-32 rounded-full border border-indigo-500/30 flex items-center justify-center bg-indigo-500/10 text-[10px] text-center px-4 shadow-[0_0_20px_rgba(99,102,241,0.2)]">Variable Rewards</div>

              <div className="absolute z-10 top-[20%] left-[20%] w-24 h-24 rounded-full border border-purple-500/30 flex items-center justify-center bg-purple-500/10 text-[10px] shadow-[0_0_15px_rgba(168,85,247,0.2)]">Curiosity</div>

              <div className="absolute z-10 top-[20%] right-[20%] w-24 h-24 rounded-full border border-blue-500/30 flex items-center justify-center bg-blue-500/10 text-[10px] shadow-[0_0_15px_rgba(59,130,246,0.2)]">Exploration</div>

              <div className="absolute z-10 bottom-[20%] right-[30%] w-28 h-28 rounded-full border border-cyan-500/30 flex items-center justify-center bg-cyan-500/10 text-[10px] shadow-[0_0_15px_rgba(6,182,212,0.2)]">Discovery Satisfaction</div>

              <div className="absolute z-10 bottom-[10%] left-[30%] w-24 h-24 rounded-full border border-emerald-500/30 flex items-center justify-center bg-emerald-500/10 text-[10px] shadow-[0_0_15px_rgba(16,185,129,0.2)]">Retention</div>

              {/* Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0" stroke="currentColor" fill="none">
                <line x1="50%" y1="50%" x2="25%" y2="28%" stroke="indigo" strokeWidth="2" strokeDasharray="4" />
                <line x1="25%" y1="28%" x2="75%" y2="28%" stroke="purple" strokeWidth="2" strokeDasharray="4" />
                <line x1="75%" y1="28%" x2="65%" y2="70%" stroke="blue" strokeWidth="2" strokeDasharray="4" />
                <line x1="65%" y1="70%" x2="35%" y2="80%" stroke="cyan" strokeWidth="2" strokeDasharray="4" />
              </svg>
            </div>

            <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/40 rounded-xl text-[11px] font-mono text-indigo-200 border border-white/5 z-20">
              <span className="text-white/40">Query: </span>
              MATCH (n:Concept)-[r]-&gt;(m) WHERE n.id = 'var_reward' RETURN n, r, m
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex-1">
             <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Nodes</h3>
             <ul className="space-y-2">
               {knowledgeNodes.map(node => (
                 <li key={node.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-white/5 border border-white/5">
                   <span className="text-white/80 font-medium">{node.label}</span>
                   <span className="text-[9px] uppercase text-white/40 bg-black/40 px-2 py-0.5 rounded">{node.type}</span>
                 </li>
               ))}
             </ul>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex-1">
             <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Relationships</h3>
             <ul className="space-y-2">
               {knowledgeEdges.map((edge, idx) => (
                 <li key={idx} className="flex flex-col text-[10px] p-2 rounded-lg bg-white/5 border border-white/5">
                   <div className="flex items-center gap-2 text-white/60">
                     <span className="text-white/80">{knowledgeNodes.find(n => n.id === edge.source)?.label || edge.source}</span>
                     <span className="text-indigo-400 font-bold">[{edge.relationship}]</span>
                     <span className="text-white/80">{knowledgeNodes.find(n => n.id === edge.target)?.label || edge.target}</span>
                   </div>
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </div>
    </>
  );
}
