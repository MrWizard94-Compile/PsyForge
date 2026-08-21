import { designAgents as initialAgents } from '../data/agents';
import { DesignAgent } from '../types';

export function useDesignAgents() {
  return initialAgents satisfies DesignAgent[];
}
