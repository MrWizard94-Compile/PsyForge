import { PlayerModel } from '../types';

export const playerModels: PlayerModel[] = [
  {
    id: 'SIM_88391',
    name: 'Unknown Player',
    type: 'Master Builder',
    traits: {
      explorer: 87,
      collector: 92,
      social: 44,
      competitive: 21,
      builder: 76,
      story: 68
    },
    predictions: {
      likelyAction: 'Purchase: "Ancient Citadel" cosmetic pack.',
      churnRisk: 'High if PvP-mandatory event triggers in Q3.',
      monetizationTier: 'VIP-L3 (Creator Support)'
    }
  },
  {
    id: 'SIM_11024',
    name: 'Unknown Player',
    type: 'Social Mentor',
    traits: {
      explorer: 30,
      collector: 45,
      social: 95,
      competitive: 10,
      builder: 50,
      story: 85
    },
    predictions: {
      likelyAction: 'Gift cosmetic item to new guild member.',
      churnRisk: 'High if guild activity drops below 20%.',
      monetizationTier: 'VIP-L1'
    }
  }
];
