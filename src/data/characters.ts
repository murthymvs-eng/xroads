export interface CharacterDef {
  id: string;
  name: string;
  texture: string; // runtime URL, served from /assets (publicDir)
  cost: number;    // money to unlock (0 = free)
}

// The original build's selectable roster. More can be added over time.
export const CHARACTERS: CharacterDef[] = [
  { id: 'chicken', name: 'Chicken', texture: '/sprites/chicken.png', cost: 0 },
  { id: 'hipster', name: 'Hipster', texture: '/sprites/hipster-1.png', cost: 50 },
  { id: 'trex', name: 'T-Rex', texture: '/sprites/trex.png', cost: 100 },
  { id: 'whale', name: 'Whale', texture: '/sprites/whale-1.png', cost: 150 },
];

export const DEFAULT_CHARACTER = 'chicken';
