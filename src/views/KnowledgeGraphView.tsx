import { useState } from 'react';
import { Eye, Link2, LockKeyhole, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { type GraphAssertion, useGraphInspector } from '../hooks/useGraphInspector';

const NODE_TYPE_LABELS = { corpus_concept: 'Corpus Concept', domain_entity: 'Domain Entity' } as const;

/** Read-only surface for the narrow P6 graph kernel; it never writes graph data or source text. */
export default function KnowledgeGraphView() {
  const inspector = useGraphInspector();
  const [token, setToken] = useState('');

  const connect = async (event: React.FormEvent) => {
    event.preventDefault();
    const actor = await inspector.connect(token);
    if (actor !== undefined) {
      setToken('');
    }
  };

  return <div className="max-w-6xl space-y-6">
    <header className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <div className="mb-2 flex items-center gap-3"><Eye className="h-6 w-6 text-emerald-300" /><h2 className="text-2xl font-bold">P6 Graph Inspector</h2></div>
      <p className="max-w-4xl text-sm leading-relaxed text-white/60">This is a read-only view of the director-approved structural subset: <strong>Corpus Concept → Belongs_To → Domain Entity</strong>. Every assertion is synthetic, observed, evidence-bound, and immutable. It does not retrieve source text, infer relationships, calculate embeddings, call a model, or create recommendations.</p>
    </header>

    {inspector.actor === undefined ? <form onSubmit={connect} className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"><LockKeyhole className="mr-2 inline h-4 w-4" />Start the local service and enter the configured <code>operator</code> or <code>evidence_reviewer</code> token from <code>data/.psyforge-local-actors.json</code>. The token fixes actor, tenant, and role; this inspector cannot select or elevate them.</p>
      <label className="grid gap-1 text-sm"><span className="text-white/60">Actor token</span><input aria-label="Graph inspector actor token" value={token} onChange={(event) => setToken(event.target.value)} type="password" autoComplete="off" required className="rounded-lg border border-white/10 bg-black/30 p-3" /></label>
      <button disabled={inspector.busy} className="w-fit rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold disabled:opacity-50">Open read-only session</button>
    </form> : <>
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
        <div><p className="font-semibold text-emerald-200">Local inspector session: {inspector.actor.id}</p><p className="text-xs text-emerald-100/70">{inspector.actor.role} · {inspector.actor.tenantId} · source text is never returned</p></div>
        <div className="flex gap-2"><button onClick={() => void inspector.load()} disabled={inspector.busy} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Refresh</button><button onClick={() => void inspector.disconnect()} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm"><LogOut className="h-4 w-4" /> Disconnect</button></div>
      </section>
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6"><div className="flex items-center gap-2"><Link2 className="h-5 w-5 text-indigo-300" /><h3 className="font-bold">Immutable structural assertions</h3></div>{inspector.assertions.length === 0 ? <p className="text-sm text-white/50">No P6 assertions are registered for this tenant. Graph writes are intentionally API/fixture-only and require an approved synthetic evidence source.</p> : inspector.assertions.map((assertion) => <AssertionCard key={assertion.assertionId} assertion={assertion} />)}</section>
    </>}
    {inspector.error !== undefined && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{inspector.error}</div>}
  </div>;
}

function AssertionCard({ assertion }: { assertion: GraphAssertion }) {
  const active = assertion.invalidatedAt === undefined;
  return <article className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{assertion.sourceNode.label} <span className="text-indigo-300">— Belongs To →</span> {assertion.targetNode.label}</p><p className="mt-1 text-xs text-white/50">{NODE_TYPE_LABELS[assertion.sourceNode.type]} · {NODE_TYPE_LABELS[assertion.targetNode.type]} · observed structural assertion</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? 'bg-emerald-500/15 text-emerald-200' : 'bg-amber-500/15 text-amber-200'}`}>{active ? 'Active provenance' : 'Invalidated by rights revocation'}</span></div><div className="grid gap-2 text-xs text-white/60 md:grid-cols-2"><p><ShieldCheck className="mr-1 inline h-4 w-4 text-indigo-300" />Evidence source {assertion.evidenceSourceId} · v{assertion.evidenceSourceVersion} · {assertion.evidenceStatus}</p><p className="font-mono">SHA-256 {assertion.evidenceContentSha256}</p><p>Author {assertion.authorId} ({assertion.authorRole}) · confidence {assertion.confidence}</p><p>Created {assertion.createdAt}{assertion.invalidatedAt === undefined ? '' : ` · invalidated ${assertion.invalidatedAt}`}</p></div></article>;
}