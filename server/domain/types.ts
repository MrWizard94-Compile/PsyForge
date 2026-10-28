export const P0_PURPOSE = 'behavioral_analysis' as const;
export const EVENT_SCHEMA_VERSION = '1.0' as const;
export const FEATURE_DEFINITION_VERSION = '1.0' as const;
export const BASELINE_MODEL_VERSION = '1.0' as const;

export type Purpose = typeof P0_PURPOSE;
export type ActorRole = 'operator' | 'ingestor' | 'reviewer' | 'ethics_reviewer' | 'evidence_reviewer';
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
  modelVersion: string;
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

export type EvidenceDomain =
  | 'game_psychology'
  | 'behavioral_economics'
  | 'motivation_theory'
  | 'cognitive_science'
  | 'game_design'
  | 'social_dynamics'
  | 'ux_research'
  | 'marketing_science'
  | 'education_psychology'
  | 'decision_theory'
  | 'synthetic_test';

export type EvidenceLicenseBasis = 'public_domain' | 'cc_by_4_0' | 'cc_by_sa_4_0' | 'organization_owned' | 'written_permission' | 'synthetic';
export type EvidenceSourceStatus = 'pending_review' | 'approved' | 'rejected' | 'revoked';

/** P6 implements only this director-approved structural subset of the Volume III graph catalog. */
export type GraphNodeType = 'corpus_concept' | 'domain_entity';
export type GraphEdgeType = 'belongs_to';
export const GRAPH_SCHEMA_VERSION = '1.0' as const;

export interface GraphNodeInput {
  key: string;
  label: string;
  type: GraphNodeType;
}

export interface GraphAssertionRegistration {
  tenantId: string;
  evidenceSourceId: string;
  sourceNode: GraphNodeInput;
  targetNode: GraphNodeInput;
  edgeType: GraphEdgeType;
  epistemicTier: 'observed';
}

export interface GraphNode {
  graphNodeId: string;
  tenantId: string;
  key: string;
  label: string;
  type: GraphNodeType;
  evidenceSourceId: string;
  evidenceContentSha256: string;
  authorId: string;
  authorRole: 'operator';
  confidence: 1;
  createdAt: string;
  schemaVersion: typeof GRAPH_SCHEMA_VERSION;
}

export interface GraphAssertion {
  assertionId: string;
  tenantId: string;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  edgeType: GraphEdgeType;
  evidenceSourceId: string;
  evidenceSourceVersion: string;
  evidenceContentSha256: string;
  evidenceStatus: EvidenceSourceStatus;
  epistemicTier: 'observed';
  authorId: string;
  authorRole: 'operator';
  confidence: 1;
  createdAt: string;
  correlationId: string;
  invalidatedAt?: string;
}

export interface GraphAssertionInvalidation {
  invalidationId: string;
  assertionId: string;
  tenantId: string;
  evidenceSourceId: string;
  invalidatedAt: string;
  reason: 'evidence_rights_revoked';
}

/** Content is hashed at the trust boundary and is never persisted by the evidence registry. */
export interface EvidenceSourceRegistration {
  tenantId: string;
  sourceKey: string;
  version: string;
  title: string;
  stableCitation: string;
  publisher: string;
  publishedAt: string;
  domain: EvidenceDomain;
  licenseBasis: EvidenceLicenseBasis;
  rightsReference: string;
  content: string;
}

export interface EvidenceSource {
  sourceId: string;
  tenantId: string;
  sourceKey: string;
  version: string;
  title: string;
  stableCitation: string;
  publisher: string;
  publishedAt: string;
  domain: EvidenceDomain;
  licenseBasis: EvidenceLicenseBasis;
  rightsReference: string;
  contentSha256: string;
  contentBytes: number;
  status: EvidenceSourceStatus;
  registeredAt: string;
  reviewedAt?: string;
}

export interface EvidenceSourceReview {
  reviewId: string;
  sourceId: string;
  tenantId: string;
  reviewerId: string;
  decision: 'approved' | 'rejected';
  rationale: string;
  occurredAt: string;
}

/** A post-approval rights revocation; raw source content is never retained. */
export interface EvidenceSourceRevocation {
  revocationId: string;
  sourceId: string;
  tenantId: string;
  revokerId: string;
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
