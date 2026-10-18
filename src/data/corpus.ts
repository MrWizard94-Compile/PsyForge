import { PsychologyConcept } from '../types';

export const psychologyCorpus: PsychologyConcept[] = [
  {
    id: 'c_001',
    concept: 'Loss Aversion',
    category: 'Behavioral Economics',
    mechanism: 'Humans avoid losses more strongly than they seek equivalent gains.',
    gameApplications: ['Progress protection', 'Collection systems', 'Recovery mechanics'],
    risk: 'Can create anxiety if abused.',
    ethicalRating: 'Medium',
  },
  {
    id: 'c_002',
    concept: 'Variable Rewards',
    category: 'Cognitive Psychology',
    mechanism: 'Unpredictable reinforcement schedules create higher engagement than predictable ones.',
    gameApplications: ['Loot tables', 'Critical hits', 'Procedural discovery'],
    risk: 'High potential for addictive behavioral loops.',
    ethicalRating: 'High',
  },
  {
    id: 'c_003',
    concept: 'Intrinsic Motivation',
    category: 'Motivation Theory',
    mechanism: 'Humans are driven by autonomy, competence, and relatedness.',
    gameApplications: ['Skill trees', 'Cosmetic customization', 'Guild structures'],
    risk: 'Over-monetization can destroy intrinsic motivation.',
    ethicalRating: 'Low',
  },
  {
    id: 'c_004',
    concept: 'Endowment Effect',
    category: 'Behavioral Economics',
    mechanism: 'People value items more highly simply because they own them.',
    gameApplications: ['Starter items', 'Free trials with retained data', 'Base building'],
    risk: 'Creates friction in trading/economy systems.',
    ethicalRating: 'Medium',
  }
];
