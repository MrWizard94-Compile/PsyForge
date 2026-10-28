import { useCallback, useState } from 'react';

export type EvidenceRole = 'operator' | 'evidence_reviewer';

export interface EvidenceActor {
  id: string;
  role: EvidenceRole;
  tenantId: string;
}

export interface EvidenceSource {
  sourceId: string;
  sourceKey: string;
  version: string;
  title: string;
  stableCitation: string;
  publisher: string;
  publishedAt: string;
  domain: string;
  licenseBasis: string;
  rightsReference: string;
  contentSha256: string;
  contentBytes: number;
  status: 'pending_review' | 'approved' | 'rejected' | 'revoked';
  registeredAt: string;
  reviewedAt?: string;
}

export interface EvidenceRegistration {
  sourceKey: string;
  version: string;
  title: string;
  stableCitation: string;
  publisher: string;
  publishedAt: string;
  domain: string;
  licenseBasis: string;
  rightsReference: string;
  content: string;
}

const API_ROOT = import.meta.env.DEV ? '/api/v1' : '/v1';

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, { ...options, credentials: 'same-origin' });
  const body = await response.json().catch(() => ({})) as { error?: { message?: string } } & T;
  if (!response.ok) {
    throw new Error(body.error?.message ?? `Local service request failed with ${response.status}.`);
  }
  return body;
}

export function useEvidenceRegistry() {
  const [actor, setActor] = useState<EvidenceActor | undefined>();
  const [sources, setSources] = useState<EvidenceSource[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const run = useCallback(async <T,>(operation: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setError(undefined);
    try {
      return await operation();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The local service request failed.');
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);

  const load = useCallback(async () => run(async () => {
    const result = await api<{ sources: EvidenceSource[] }>('/evidence/sources');
    setSources(result.sources);
    return result.sources;
  }), [run]);

  const connect = useCallback(async (token: string) => run(async () => {
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      throw new Error('Use the 64-character token for one configured local actor.');
    }
    const result = await api<{ actor: EvidenceActor }>('/session', { method: 'POST', headers: { 'x-psyforge-api-token': token } });
    setActor(result.actor);
    const listing = await api<{ sources: EvidenceSource[] }>('/evidence/sources');
    setSources(listing.sources);
    return result.actor;
  }), [run]);

  const disconnect = useCallback(async () => run(async () => {
    await api('/session', { method: 'DELETE' });
    setActor(undefined);
    setSources([]);
  }), [run]);

  const register = useCallback(async (registration: EvidenceRegistration) => run(async () => {
    if (actor?.role !== 'operator') {
      throw new Error('Only a local operator can register an evidence source.');
    }
    const result = await api<{ source: EvidenceSource }>('/evidence/sources', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...registration, tenantId: actor.tenantId }) });
    setSources((current) => [...current, result.source]);
    return result.source;
  }), [actor, run]);

  const review = useCallback(async (sourceId: string, decision: 'approved' | 'rejected', rationale: string) => run(async () => {
    if (actor?.role !== 'evidence_reviewer') {
      throw new Error('Only an evidence reviewer can record a source decision.');
    }
    const result = await api<{ source: EvidenceSource }>(`/evidence/sources/${encodeURIComponent(sourceId)}/reviews`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision, rationale }) });
    setSources((current) => current.map((source) => source.sourceId === result.source.sourceId ? result.source : source));
    return result.source;
  }), [actor, run]);

  const revoke = useCallback(async (sourceId: string, rationale: string) => run(async () => {
    if (actor?.role !== 'evidence_reviewer') {
      throw new Error('Only an evidence reviewer can revoke an approved source.');
    }
    const result = await api<{ source: EvidenceSource }>(`/evidence/sources/${encodeURIComponent(sourceId)}/revoke`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ rationale }) });
    setSources((current) => current.map((source) => source.sourceId === result.source.sourceId ? result.source : source));
    return result.source;
  }), [actor, run]);

  return { actor, sources, error, busy, connect, disconnect, load, register, review, revoke };
}