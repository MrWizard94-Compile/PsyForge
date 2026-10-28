import { useState } from 'react';
import { BookOpenCheck, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { type EvidenceRegistration, type EvidenceSource, useEvidenceRegistry } from '../hooks/useEvidenceRegistry';

const EMPTY_REGISTRATION: EvidenceRegistration = {
  sourceKey: 'synthetic-source-001',
  version: 'v1',
  title: 'Synthetic local evidence source',
  stableCitation: 'internal:synthetic-source-001:v1',
  publisher: 'Local PsyForge operator',
  publishedAt: '2026-08-21T00:00:00.000Z',
  domain: 'synthetic_test',
  licenseBasis: 'synthetic',
  rightsReference: 'Synthetic test data created for P5 evidence-registry verification.',
  content: 'Synthetic evidence content. The service hashes this local text and never persists it.',
};

const DOMAINS = ['game_psychology', 'behavioral_economics', 'motivation_theory', 'cognitive_science', 'game_design', 'social_dynamics', 'ux_research', 'marketing_science', 'education_psychology', 'decision_theory', 'synthetic_test'];
const LICENSES = ['public_domain', 'cc_by_4_0', 'cc_by_sa_4_0', 'organization_owned', 'written_permission', 'synthetic'];

export default function EvidenceRegistryView() {
  const registry = useEvidenceRegistry();
  const [token, setToken] = useState('');
  const [registration, setRegistration] = useState<EvidenceRegistration>(EMPTY_REGISTRATION);
  const [rationales, setRationales] = useState<Record<string, string>>({});

  const connect = async (event: React.FormEvent) => {
    event.preventDefault();
    const actor = await registry.connect(token);
    if (actor !== undefined) {
      setToken('');
    }
  };

  const updateRegistration = (key: keyof EvidenceRegistration, value: string) => {
    setRegistration((current) => ({ ...current, [key]: value }));
  };

  const rationaleFor = (sourceId: string) => rationales[sourceId] ?? '';
  const updateRationale = (sourceId: string, value: string) => setRationales((current) => ({ ...current, [sourceId]: value }));
  const register = async () => {
    const source = await registry.register(registration);
    if (source !== undefined) {
      setRegistration((current) => ({ ...current, content: '' }));
    }
  };

  return <div className="max-w-6xl space-y-6">
    <header className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <div className="mb-2 flex items-center gap-3"><BookOpenCheck className="h-6 w-6 text-indigo-300" /><h2 className="text-2xl font-bold">Local Evidence Registry</h2></div>
      <p className="max-w-4xl text-sm leading-relaxed text-white/60">P5 records a source’s rights basis, stable citation, local SHA-256, and human review. Source text is hashed at the local service boundary and is never stored, exported, embedded, fetched from a URL, or sent to a model. A reviewer can revoke an approved source when its rights basis changes; no downstream graph or corpus capability exists in this slice.</p>
    </header>

    {registry.actor === undefined ? <form onSubmit={connect} className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">Start the local service, then use the intended actor token from <code>data/.psyforge-local-actors.json</code>. The service binds the actor, tenant, and role to the credential; this page cannot select or elevate a role.</p>
      <label className="grid gap-1 text-sm"><span className="text-white/60">Actor token</span><input aria-label="Evidence actor token" value={token} onChange={(event) => setToken(event.target.value)} type="password" autoComplete="off" required className="rounded-lg border border-white/10 bg-black/30 p-3" /></label>
      <button disabled={registry.busy} className="w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">Create local session</button>
    </form> : <>
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
        <div><p className="font-semibold text-emerald-200">Local session: {registry.actor.id}</p><p className="text-xs text-emerald-100/70">{registry.actor.role} · {registry.actor.tenantId} · source text is not retained</p></div>
        <div className="flex gap-2"><button onClick={() => void registry.load()} disabled={registry.busy} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Refresh</button><button onClick={() => void registry.disconnect()} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm"><LogOut className="h-4 w-4" /> Disconnect</button></div>
      </section>

      {registry.actor.role === 'operator' && <form onSubmit={(event) => { event.preventDefault(); void register(); }} className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="font-bold">Register local source for human review</h3>
        <div className="grid gap-4 md:grid-cols-2"><TextField label="Source key" value={registration.sourceKey} onChange={(value) => updateRegistration('sourceKey', value)} /><TextField label="Version" value={registration.version} onChange={(value) => updateRegistration('version', value)} /><TextField label="Title" value={registration.title} onChange={(value) => updateRegistration('title', value)} /><TextField label="Publisher" value={registration.publisher} onChange={(value) => updateRegistration('publisher', value)} /><TextField label="Stable citation" value={registration.stableCitation} onChange={(value) => updateRegistration('stableCitation', value)} /><TextField label="Published at (ISO-8601)" value={registration.publishedAt} onChange={(value) => updateRegistration('publishedAt', value)} /></div>
        <div className="grid gap-4 md:grid-cols-2"><SelectField label="Corpus domain" value={registration.domain} values={DOMAINS} onChange={(value) => updateRegistration('domain', value)} /><SelectField label="Rights basis" value={registration.licenseBasis} values={LICENSES} onChange={(value) => updateRegistration('licenseBasis', value)} /></div>
        <TextArea label="Rights reference" value={registration.rightsReference} onChange={(value) => updateRegistration('rightsReference', value)} /><TextArea label="Local source text (maximum 48 KiB; hashed, never stored)" value={registration.content} onChange={(value) => updateRegistration('content', value)} />
        <button disabled={registry.busy} className="w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">Register pending source</button>
      </form>}

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6"><h3 className="font-bold">Registered evidence metadata</h3>{registry.sources.length === 0 ? <p className="text-sm text-white/50">No evidence sources are registered for this tenant.</p> : registry.sources.map((source) => <article key={source.sourceId} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4"><EvidenceSourceSummary source={source} />{registry.actor?.role === 'evidence_reviewer' && source.status === 'pending_review' && <EvidenceReviewControls sourceId={source.sourceId} rationale={rationaleFor(source.sourceId)} busy={registry.busy} onRationale={(value) => updateRationale(source.sourceId, value)} onReview={(decision) => void registry.review(source.sourceId, decision, rationaleFor(source.sourceId))} />}{registry.actor?.role === 'evidence_reviewer' && source.status === 'approved' && <EvidenceRevocationControls sourceId={source.sourceId} rationale={rationaleFor(source.sourceId)} busy={registry.busy} onRationale={(value) => updateRationale(source.sourceId, value)} onRevoke={() => void registry.revoke(source.sourceId, rationaleFor(source.sourceId))} />}</article>)}</section>
    </>}
    {registry.error !== undefined && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{registry.error}</div>}
  </div>;
}

function EvidenceSourceSummary({ source }: { source: EvidenceSource }) {
  return <><div className="flex flex-wrap items-start justify-between gap-2"><div><h4 className="font-semibold">{source.title}</h4><p className="text-xs text-white/50">{source.sourceKey} · {source.version} · {source.status}</p></div><ShieldCheck className="h-5 w-5 text-indigo-300" /></div><p className="text-sm text-white/70">{source.stableCitation}</p><p className="font-mono text-xs text-white/50">SHA-256 {source.contentSha256} · {source.contentBytes} bytes · {source.licenseBasis}</p></>;
}

function EvidenceReviewControls({ sourceId, rationale, busy, onRationale, onReview }: { sourceId: string; rationale: string; busy: boolean; onRationale: (value: string) => void; onReview: (decision: 'approved' | 'rejected') => void }) {
  const valid = rationale.trim().length >= 10;
  return <div className="grid gap-2"><textarea aria-label={`Evidence rationale ${sourceId}`} value={rationale} onChange={(event) => onRationale(event.target.value)} minLength={10} maxLength={2000} placeholder="Human review rationale (10–2000 characters)" className="min-h-24 rounded-lg border border-white/10 bg-black/30 p-3 text-sm" /><div className="flex gap-2"><button onClick={() => onReview('approved')} disabled={busy || !valid} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold disabled:opacity-50">Approve source</button><button onClick={() => onReview('rejected')} disabled={busy || !valid} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold disabled:opacity-50">Reject source</button></div></div>;
}

function EvidenceRevocationControls({ sourceId, rationale, busy, onRationale, onRevoke }: { sourceId: string; rationale: string; busy: boolean; onRationale: (value: string) => void; onRevoke: () => void }) {
  const valid = rationale.trim().length >= 10;
  return <div className="grid gap-2 border-t border-amber-400/20 pt-3"><textarea aria-label={`Evidence revocation rationale ${sourceId}`} value={rationale} onChange={(event) => onRationale(event.target.value)} minLength={10} maxLength={2000} placeholder="Rights-revocation rationale (10–2000 characters)" className="min-h-24 rounded-lg border border-white/10 bg-black/30 p-3 text-sm" /><button onClick={onRevoke} disabled={busy || !valid} className="w-fit rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold disabled:opacity-50">Revoke approved source</button></div>;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1 text-sm"><span className="text-white/60">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} required className="rounded-lg border border-white/10 bg-black/30 p-3" /></label>; }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1 text-sm"><span className="text-white/60">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} required className="min-h-24 rounded-lg border border-white/10 bg-black/30 p-3" /></label>; }
function SelectField({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) { return <label className="grid gap-1 text-sm"><span className="text-white/60">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-white/10 bg-black/30 p-3">{values.map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select></label>; }