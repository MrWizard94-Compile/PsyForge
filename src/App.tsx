import React, { useState } from 'react';
import {
  Activity,
  BrainCircuit,
  Gamepad2,
  LineChart,
  Network,
  Users,
  Server,
  Code2,
  ClipboardCheck,
} from 'lucide-react';
import OverviewView from './views/OverviewView';
import PsychologyCorpusView from './views/PsychologyCorpusView';
import KnowledgeGraphView from './views/KnowledgeGraphView';
import PlayerModelsView from './views/PlayerModelsView';
import SimulationView from './views/SimulationView';
import AIDesignAgentsView from './views/AIDesignAgentsView';
import GameBackendView from './views/GameBackendView';
import PlatformSaaSView from './views/PlatformSaaSView';
import LocalReviewView from './views/LocalReviewView';
import { useBackendStatus } from './hooks/useBackendStatus';

type ViewState = 'overview' | 'psychology' | 'knowledge' | 'players' | 'simulation' | 'agents' | 'backend' | 'saas' | 'review';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('overview');
  const backendStatus = useBackendStatus();

  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return <OverviewView />;
      case 'psychology':
        return <PsychologyCorpusView />;
      case 'knowledge':
        return <KnowledgeGraphView />;
      case 'players':
        return <PlayerModelsView />;
      case 'simulation':
        return <SimulationView />;
      case 'agents':
        return <AIDesignAgentsView />;
      case 'backend':
        return <GameBackendView />;
      case 'saas':
        return <PlatformSaaSView />;
      case 'review':
        return <LocalReviewView />;
      default:
        return <OverviewView />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
      case 'NOMINAL':
        return 'text-green-400';
      case 'SYNCING':
      case 'DEGRADED':
        return 'text-yellow-400';
      case 'OFFLINE':
        return 'text-red-400';
      default:
        return 'text-white/50';
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050508] text-white font-sans relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[150px]"></div>
      </div>

      {/* Sidebar */}
      <aside className="relative z-10 w-full md:w-64 border-r border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col gap-8 flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-2 cursor-pointer" onClick={() => setCurrentView('overview')}>
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center font-bold text-xl tracking-tighter text-white">ΨF</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">PSYFORGE</h1>
              <p className="text-[9px] text-indigo-300/60 font-medium tracking-[0.15em] uppercase">Studio Intelligence</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
          Deterministic demo panels — optional local review service
        </div>

        <nav className="flex flex-col gap-2 overflow-y-auto pr-2">
          <NavItem icon={<Activity />} label="System Overview" active={currentView === 'overview'} onClick={() => setCurrentView('overview')} />
          <NavItem icon={<Users />} label="Player Models" active={currentView === 'players'} onClick={() => setCurrentView('players')} />
          <NavItem icon={<BrainCircuit />} label="Psychology Engine" active={currentView === 'psychology'} onClick={() => setCurrentView('psychology')} />
          <NavItem icon={<Network />} label="Knowledge Graph" active={currentView === 'knowledge'} onClick={() => setCurrentView('knowledge')} />
          <NavItem icon={<Code2 />} label="AI Design Agents" active={currentView === 'agents'} onClick={() => setCurrentView('agents')} />
          <NavItem icon={<LineChart />} label="Simulation Engine" active={currentView === 'simulation'} onClick={() => setCurrentView('simulation')} />
          <NavItem icon={<Gamepad2 />} label="Game Backend" active={currentView === 'backend'} onClick={() => setCurrentView('backend')} />
          <NavItem icon={<Server />} label="Platform SaaS" active={currentView === 'saas'} onClick={() => setCurrentView('saas')} />
          <NavItem icon={<ClipboardCheck />} label="Local Review" active={currentView === 'review'} onClick={() => setCurrentView('review')} />
        </nav>

        <div className="mt-auto p-4 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10">
          <p className="text-[10px] text-white/40 uppercase mb-2 font-bold tracking-wider">Sample Service Status</p>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-white/70">Graph DB</span>
            <span className={`text-[11px] font-bold ${getStatusColor(backendStatus.graphDb)}`}>{backendStatus.graphDb}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-white/70">Inference Node</span>
            <span className={`text-[11px] font-bold ${getStatusColor(backendStatus.inferenceNode)}`}>{backendStatus.inferenceNode}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-6 md:p-10 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors text-left ${active ? 'bg-white/10 border border-white/20 text-indigo-300 shadow-[0_0_8px_rgba(129,140,248,0.1)]' : 'text-white/60 hover:text-white/90 hover:bg-white/5 border border-transparent'}`}>
      <span className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>
      {label}
    </button>
  );
}
