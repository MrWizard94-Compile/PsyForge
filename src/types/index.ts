export interface PsychologyConcept {
  id: string;
  concept: string;
  category: string;
  mechanism: string;
  gameApplications: string[];
  risk: string;
  ethicalRating: 'Low' | 'Medium' | 'High';
}

export interface PlayerModel {
  id: string;
  name: string;
  type: string;
  traits: {
    explorer: number;
    collector: number;
    social: number;
    competitive: number;
    builder: number;
    story: number;
  };
  predictions: {
    likelyAction: string;
    churnRisk: string;
    monetizationTier: string;
  };
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'Concept' | 'Emotion' | 'Outcome';
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface DesignAgent {
  id: string;
  name: string;
  icon: string;
  color: string;
  focus: string;
  exampleQuery: string;
  status: 'Active' | 'Standby' | 'Analyzing';
  recentInsight: string;
}
