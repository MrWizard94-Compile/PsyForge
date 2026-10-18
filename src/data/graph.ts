import { GraphNode, GraphEdge } from '../types';

export const knowledgeNodes: GraphNode[] = [
  { id: 'var_reward', label: 'Variable Rewards', type: 'Concept' },
  { id: 'curiosity', label: 'Curiosity', type: 'Emotion' },
  { id: 'exploration', label: 'Exploration', type: 'Outcome' },
  { id: 'discovery_sat', label: 'Discovery Satisfaction', type: 'Emotion' },
  { id: 'retention', label: 'Retention', type: 'Outcome' },
];

export const knowledgeEdges: GraphEdge[] = [
  { source: 'var_reward', target: 'curiosity', relationship: 'CAUSES' },
  { source: 'curiosity', target: 'exploration', relationship: 'INCREASES' },
  { source: 'exploration', target: 'discovery_sat', relationship: 'IMPROVES' },
  { source: 'discovery_sat', target: 'retention', relationship: 'INCREASES' },
];
