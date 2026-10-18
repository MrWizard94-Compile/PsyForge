import { DesignAgent } from '../types';

export const designAgents: DesignAgent[] = [
  {
    id: 'agt_psy',
    name: 'Psychology Agent',
    icon: 'Brain',
    color: 'indigo',
    focus: 'Motivation, Cognitive Load, Emotional Resonance',
    exampleQuery: '"What motivates this behavior?"',
    status: 'Active',
    recentInsight: 'Loss aversion is peaking in Sector 4. Recommend introducing a "Recovery Quest" to mitigate player frustration.'
  },
  {
    id: 'agt_eco',
    name: 'Economy Agent',
    icon: 'Coins',
    color: 'amber',
    focus: 'Inflation, Faucets/Sinks, Resource Valuation',
    exampleQuery: '"Will this break the market?"',
    status: 'Active',
    recentInsight: 'Rare timber supply is 40% above forecast. Adjust drop rates in the Frontier forest regions.'
  },
  {
    id: 'agt_ret',
    name: 'Retention Agent',
    icon: 'UserCheck',
    color: 'emerald',
    focus: 'Session Length, Churn Prediction, Habit Formation',
    exampleQuery: '"Why are players leaving?"',
    status: 'Analyzing',
    recentInsight: 'Players who skip the housing tutorial have a 60% higher Day-7 churn rate.'
  },
  {
    id: 'agt_eth',
    name: 'Ethics Agent',
    icon: 'Scale',
    color: 'red',
    focus: 'Dark Patterns, Addiction Risk, Exploitation',
    exampleQuery: '"Is this manipulative?"',
    status: 'Active',
    recentInsight: 'Recent lootbox pattern for "Explorer" types is trending towards high manipulation risk (Grade: C-). Recommend redesign.'
  },
  {
    id: 'agt_dsg',
    name: 'Designer Agent',
    icon: 'PenTool',
    color: 'cyan',
    focus: 'Mechanic Synthesis, Thematic Consistency',
    exampleQuery: '"Suggest alternatives."',
    status: 'Standby',
    recentInsight: 'Awaiting design block resolution. Ready to propose 3 alternative progression systems.'
  }
];
