export const P0_PURPOSE = 'behavioral_analysis' as const;
export const EVENT_SCHEMA_VERSION = '1.0' as const;
export const FEATURE_DEFINITION_VERSION = '1.0' as const;
export const BASELINE_MODEL_VERSION = '1.0' as const;

export type Purpose = typeof P0_PURPOSE;
export type ActorRole = 'operator' | 'ingestor' | 'reviewer' | 'ethics_reviewer';
export type EventType = 'session.ended' | 'activity.completed';
export type ActivityType = 'exploration' | 'combat' | 'social' | 'crafting';
export type EpistemicTier = 'observed' | 'inferred';
export type RecommendationStatus = 'pending_review' | 'approved' | 'rejected' | 'modified' | 'vetoed';

export interface Actor {
  id: string;
  role: ActorRole;
  tenantId: string;
}

export interface ConsentGrant {
  tenantId: string;
  subjectId: string;
  purpose: Purpose;
  policyVersion: string;
  grantedAt: string;
  expiresAt: string;
}

export interface SessionEndedPayload {
  sessionId: string;
  durationSeconds: number;
}

export interface ActivityCompletedPayload {
  activityType: ActivityType;
}

export interface TelemetryEventBase {
  schemaVersion: typeof EVENT_SCHEMA_VERSION;
  eventId: string;
  tenantId: string;
  subjectId: string;
  purpose: Purpose;
  eventType: EventType;
  occurredAt: string;
}

export type TelemetryEvent =
  | (TelemetryEventBase & { eventType: 'session.ended'; payload: SessionEndedPayload })
  | (TelemetryEventBase & { eventType: 'activity.completed'; payload: ActivityCompletedPayload });

export type StoredTelemetryEvent = TelemetryEvent & { receivedAt: string };

export interface AuditEvent {
  auditId: string;
  occurredAt: string;
  tenantId: string;
  actorId: string;
  actorRole: ActorRole;
  action: string;
  targetType: string;
  targetId: string;
  outcome: 'accepted' | 'rejected' | 'ignored' | 'completed';
  correlationId: string;
  detail: Record<string, string | number | boolean | null>;
}

export interface FeatureValue {
  featureKey: 'session_count_7d' | 'active_day_count_7d' | 'average_session_duration_seconds_7d' | 'exploration_activity_ratio_7d';
  tenantId: string;
  subjectId: string;
  windowStart: string;
  windowEnd: string;
  value: number;
  unit: 'count' | 'days' | 'seconds' | 'ratio';
  epistemicTier: EpistemicTier;
  sourceEventIds: string[];
  definitionVersion: typeof FEATURE_DEFINITION_VERSION;
  computedAt: string;
}

export interface BaselineModelResult {
  modelResultId: string;
  tenantId: string;
  subjectId: string;
  modelVersion: typeof BASELINE_MODEL_VERSION;
  computedAt: string;
  engagementIndex: number;
  confidence: 'low';
  explanation: string;
  featureSnapshot: FeatureValue[];
}

export interface EthicsScoreCard {
  manipulationRisk: 0;
  privacyRisk: 0;
  fairnessRisk: 0;
  confidence: 'low';
  disposition: 'review_required';
}

export interface Recommendation {
  recommendationId: string;
  tenantId: string;
  subjectId: string;
  modelResultId: string;
  createdAt: string;
  status: RecommendationStatus;
  summary: string;
  uncertainty: string;
  ethicsScore: EthicsScoreCard;
}

export interface ReviewDecision {
  decisionId: string;
  recommendationId: string;
  tenantId: string;
  reviewerId: string;
  reviewerRole: 'reviewer' | 'ethics_reviewer';
  decision: 'approved' | 'rejected' | 'modified' | 'vetoed';
  rationale: string;
  occurredAt: string;
}

export class DomainError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
