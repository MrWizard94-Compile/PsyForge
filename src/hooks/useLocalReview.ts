import { useCallback, useState } from 'react';

export type LocalRole = 'operator' | 'ingestor' | 'reviewer' | 'ethics_reviewer';
export type ReviewDecision = 'approved' | 'rejected' | 'modified' | 'vetoed';

export interface LocalActor {
  id: string;
  role: LocalRole;
  tenantId: string;
}

export interface LocalRecommendation {
  recommendationId: string;
  tenantId: string;
  subjectId: string;
  modelResultId: string;
  createdAt: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'modified' | 'vetoed';
  summary: string;
  uncertainty: string;
  ethicsScore: {
    manipulationRisk: number;
    privacyRisk: number;
    fairnessRisk: number;
    confidence: string;
    disposition: string;
  };
}

export interface LocalAuditEvent {
  auditId: string;
  occurredAt: string;
  action: string;
  outcome: string;
  targetType: string;
  targetId: string;
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

export function useLocalReview() {
  const [actor, setActor] = useState<LocalActor | undefined>();
  const [recommendation, setRecommendation] = useState<LocalRecommendation | undefined>();
  const [auditEvents, setAuditEvents] = useState<LocalAuditEvent[]>([]);
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

  const connect = useCallback(async (token: string) => run(async () => {
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      throw new Error('Enter the 64-character token for one configured local actor.');
    }
    const result = await api<{ actor: LocalActor }>('/session', { method: 'POST', headers: { 'x-psyforge-api-token': token } });
    setActor(result.actor);
    return result.actor;
  }), [run]);

  const disconnect = useCallback(async () => run(async () => {
    await api('/session', { method: 'DELETE' });
    setActor(undefined);
    setRecommendation(undefined);
    setAuditEvents([]);
  }), [run]);

  const loadRecommendation = useCallback(async (recommendationId: string) => run(async () => {
    const result = await api<{ recommendation: LocalRecommendation }>(`/recommendations/${encodeURIComponent(recommendationId)}`);
    setRecommendation(result.recommendation);
    return result.recommendation;
  }), [run]);

  const decide = useCallback(async (decision: ReviewDecision, rationale: string) => run(async () => {
    if (recommendation === undefined) {
      throw new Error('Load a recommendation before recording a decision.');
    }
    const result = await api<{ recommendation: LocalRecommendation }>(`/recommendations/${recommendation.recommendationId}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision, rationale }) });
    setRecommendation(result.recommendation);
    return result.recommendation;
  }), [recommendation, run]);

  const exportAudit = useCallback(async () => run(async () => {
    const result = await api<{ auditEvents: LocalAuditEvent[] }>('/audit');
    setAuditEvents(result.auditEvents);
    return result.auditEvents;
  }), [run]);

  return { actor, recommendation, auditEvents, error, busy, connect, disconnect, loadRecommendation, decide, exportAudit };
}
