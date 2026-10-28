import { useCallback, useState } from 'react';

export type GraphInspectorRole = 'operator' | 'evidence_reviewer';

export interface GraphInspectorActor {
  id: string;
  role: GraphInspectorRole;
  tenantId: string;
}

interface GraphNode {
  key: string;
  label: string;
  type: 'corpus_concept' | 'domain_entity';
}

export interface GraphAssertion {
  assertionId: string;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  edgeType: 'belongs_to';
  evidenceSourceId: string;
  evidenceSourceVersion: string;
  evidenceContentSha256: string;
  evidenceStatus: 'approved' | 'revoked';
  epistemicTier: 'observed';
  authorId: string;
  authorRole: 'operator';
  confidence: 1;
  createdAt: string;
  correlationId: string;
  invalidatedAt?: string;
}

const API_ROOT = import.meta.env.DEV ? '/api/v1' : '/v1';

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, { ...options, credentials: 'same-origin' });
  const body = await response.json().catch(() => ({})) as { error?: { message?: string } } & T;
  if (!response.ok) {
    throw new Error(body.error?.message ?? `Local graph inspector request failed with ${response.status}.`);
  }
  return body;
}

/** Connects a credential-bound local session for read-only P6 graph inspection. */
export function useGraphInspector() {
  const [actor, setActor] = useState<GraphInspectorActor | undefined>();
  const [assertions, setAssertions] = useState<GraphAssertion[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const run = useCallback(async <T,>(operation: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setError(undefined);
    try {
      return await operation();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The local graph inspector request failed.');
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);

  const load = useCallback(async () => run(async () => {
    const result = await api<{ assertions: GraphAssertion[] }>('/graph/assertions');
    setAssertions(result.assertions);
    return result.assertions;
  }), [run]);

  const connect = useCallback(async (token: string) => run(async () => {
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      throw new Error('Use the 64-character token for one configured local actor.');
    }
    const result = await api<{ actor: GraphInspectorActor }>('/session', { method: 'POST', headers: { 'x-psyforge-api-token': token } });
    if (result.actor.role !== 'operator' && result.actor.role !== 'evidence_reviewer') {
      throw new Error('Only an operator or evidence reviewer may inspect P6 graph provenance.');
    }
    setActor(result.actor);
    const listing = await api<{ assertions: GraphAssertion[] }>('/graph/assertions');
    setAssertions(listing.assertions);
    return result.actor;
  }), [run]);

  const disconnect = useCallback(async () => run(async () => {
    await api('/session', { method: 'DELETE' });
    setActor(undefined);
    setAssertions([]);
  }), [run]);

  return { actor, assertions, error, busy, connect, disconnect, load };
}