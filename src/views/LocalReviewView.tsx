import { useState } from 'react';
import { ClipboardCheck, Download, LogOut, ShieldCheck } from 'lucide-react';
import { type LocalActor, type LocalRole, type ReviewDecision, useLocalReview } from '../hooks/useLocalReview';

const REVIEW_DECISIONS: Array<{ decision: ReviewDecision; label: string; permittedRole: LocalRole }> = [
  { decision: 'approved', label: 'Approve review', permittedRole: 'reviewer' },
  { decision: 'rejected', label: 'Reject review', permittedRole: 'reviewer' },
  { decision: 'modified', label: 'Record modified review', permittedRole: 'reviewer' },
  { decision: 'vetoed', label: 'Ethics veto', permittedRole: 'ethics_reviewer' },
];

export default function LocalReviewView() {
  const local = useLocalReview();
  const [token, setToken] = useState('');
  const [actorId, setActorId] = useState('local-reviewer');
  const [tenantId, setTenantId] = useState('studio-alpha');
  const [role, setRole] = useState<LocalRole>('reviewer');
  const [recommendationId, setRecommendationId] = useState('');
  const [rationale, setRationale] = useState('');

  const submitConnection = async (event: React.FormEvent) => {
    event.preventDefault();
    const connected = await local.connect(token, { id: actorId, tenantId, role } satisfies LocalActor);
    if (connected !== undefined) {
      setToken('');
    }
  };

  const exportAudit = async () => {
    const events = await local.exportAudit();
    if (events === undefined) {
      return;
    }
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `psyforge-audit-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <header className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2"><ClipboardCheck className="w-6 h-6 text-indigo-300" /><h2 className="text-2xl font-bold tracking-tight">Local Recommendation Review</h2></div>
        <p className="text-white/60 max-w-3xl text-sm leading-relaxed">This console connects only to the local PsyForge service. It never deploys a game change: every result is an evidence-bound, low-confidence review record.</p>
      </header>

      {local.actor === undefined ? (
        <form onSubmit={submitConnection} className="grid gap-4 bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">Run <code>npm run start:server</code>, then paste the runtime token from <code>data/.psyforge-local-token</code>. The token is used once to create an HttpOnly local session and is never stored by this page.</div>
          <label className="grid gap-1 text-sm"><span className="text-white/60">Local token</span><input aria-label="Local token" value={token} onChange={(event) => setToken(event.target.value)} type="password" autoComplete="off" className="rounded-lg bg-black/30 border border-white/10 p-3" required /></label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="grid gap-1 text-sm"><span className="text-white/60">Actor ID</span><input aria-label="Actor ID" value={actorId} onChange={(event) => setActorId(event.target.value)} className="rounded-lg bg-black/30 border border-white/10 p-3" required /></label>
            <label className="grid gap-1 text-sm"><span className="text-white/60">Tenant ID</span><input aria-label="Tenant ID" value={tenantId} onChange={(event) => setTenantId(event.target.value)} className="rounded-lg bg-black/30 border border-white/10 p-3" required /></label>
            <label className="grid gap-1 text-sm"><span className="text-white/60">Role</span><select aria-label="Role" value={role} onChange={(event) => setRole(event.target.value as LocalRole)} className="rounded-lg bg-black/30 border border-white/10 p-3"><option value="operator">Operator</option><option value="reviewer">Reviewer</option><option value="ethics_reviewer">Ethics reviewer</option><option value="ingestor">Ingestor</option></select></label>
          </div>
          <button disabled={local.busy} className="w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">Create local session</button>
        </form>
      ) : (
        <section className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-4">
            <div><p className="text-sm font-semibold text-emerald-200">Local session: {local.actor.id}</p><p className="text-xs text-emerald-100/70">{local.actor.role} · {local.actor.tenantId} · loopback-only service</p></div>
            <button onClick={() => void local.disconnect()} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm"><LogOut className="w-4 h-4" /> Disconnect</button>
          </div>
          <div className="grid md:grid-cols-[1fr_auto] gap-3 bg-white/5 border border-white/10 rounded-2xl p-5">
            <label className="grid gap-1 text-sm"><span className="text-white/60">Recommendation ID</span><input aria-label="Recommendation ID" value={recommendationId} onChange={(event) => setRecommendationId(event.target.value)} placeholder="UUID from the local API workflow" className="rounded-lg bg-black/30 border border-white/10 p-3" /></label>
            <div className="flex items-end"><button onClick={() => void local.loadRecommendation(recommendationId)} disabled={local.busy || recommendationId.length === 0} className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold disabled:opacity-50">Load review</button></div>
          </div>
          {local.recommendation !== undefined && <section className="space-y-4 rounded-2xl bg-white/5 border border-white/10 p-6">
            <div className="flex justify-between gap-4"><div><h3 className="text-lg font-bold">{local.recommendation.status.replace('_', ' ')}</h3><p className="text-sm text-white/60">Subject: {local.recommendation.subjectId}</p></div><ShieldCheck className="w-6 h-6 text-amber-300" /></div>
            <p className="text-sm text-white/90">{local.recommendation.summary}</p><p className="text-sm text-amber-100/80">{local.recommendation.uncertainty}</p>
            <div className="grid sm:grid-cols-4 gap-3 text-xs"><Metric label="Manipulation risk" value={local.recommendation.ethicsScore.manipulationRisk} /><Metric label="Privacy risk" value={local.recommendation.ethicsScore.privacyRisk} /><Metric label="Fairness risk" value={local.recommendation.ethicsScore.fairnessRisk} /><Metric label="Confidence" value={local.recommendation.ethicsScore.confidence} /></div>
            {local.recommendation.status === 'pending_review' && <><label className="grid gap-1 text-sm"><span className="text-white/60">Decision rationale</span><textarea aria-label="Decision rationale" value={rationale} onChange={(event) => setRationale(event.target.value)} minLength={10} maxLength={2000} className="min-h-28 rounded-lg bg-black/30 border border-white/10 p-3" /></label><div className="flex flex-wrap gap-3">{REVIEW_DECISIONS.filter((item) => item.permittedRole === local.actor?.role).map((item) => <button key={item.decision} onClick={() => void local.decide(item.decision, rationale)} disabled={local.busy || rationale.trim().length < 10} className={item.decision === 'vetoed' ? 'rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold disabled:opacity-50' : 'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold disabled:opacity-50'}>{item.label}</button>)}</div></>}
          </section>}
          {local.actor.role === 'operator' && <button onClick={() => void exportAudit()} disabled={local.busy} className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold disabled:opacity-50"><Download className="w-4 h-4" /> Export tenant audit JSON</button>}
        </section>
      )}
      {local.error !== undefined && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{local.error}</div>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg bg-black/20 border border-white/10 p-3"><p className="text-white/50">{label}</p><p className="mt-1 font-mono text-white">{value}</p></div>;
}
