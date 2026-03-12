import type { Card, ElementType } from "./types";

const elements: ElementType[] = ["FIRE", "ICE", "LIGHTNING", "SHADOW", "MYSTIC"];

export const ELEMENT_LABELS: Record<ElementType, string> = {
  FIRE: "Fire",
  ICE: "Ice",
  LIGHTNING: "Lightning",
  SHADOW: "Shadow",
  MYSTIC: "Mystic",
};

export const ELEMENT_COLORS: Record<ElementType, string> = {
  FIRE: "#f97316",
  ICE: "#38bdf8",
  LIGHTNING: "#eab308",
  SHADOW: "#6b21a8",
  MYSTIC: "#22c55e",
};

export const ELEMENT_ADVANTAGE: Record<ElementType, ElementType[]> = {
  FIRE: ["ICE"],
  ICE: ["LIGHTNING"],
  LIGHTNING: ["SHADOW"],
  SHADOW: ["MYSTIC"],
  MYSTIC: ["FIRE"],
};

export const ADVANTAGE_MULTIPLIER = 1.5;
export const DISADVANTAGE_MULTIPLIER = 0.7;

export const ALL_CARDS: Card[] = [
  {
    id: "fire_blade",
    name: "Flame Blade",
    element: "FIRE",
    power: 9,
    description: "A sword forged from pure flame.",
    effectText: "Strong vs Ice due to element advantage.",
  },
  {
    id: "fire_meteor",
    name: "Meteor Rain",
    element: "FIRE",
    power: 8,
    description: "Burning stones falling from the sky.",
    effectText: "Has a chance to deal +1 bonus damage.",
  },
  {
    id: "fire_phoenix",
    name: "Phoenix Ember",
    element: "FIRE",
    power: 7,
    description: "A reborn spirit of fire.",
    effectText: "Consistent mid damage.",
  },
  {
    id: "ice_spike",
    name: "Ice Spikes",
    element: "ICE",
    power: 8,
    description: "Frozen lances erupt from the ground.",
    effectText: "Chilling hit: can reduce incoming damage next turn.",
  },
  {
    id: "ice_barrier",
    name: "Glacier Barrier",
    element: "ICE",
    power: 6,
    description: "A thick wall of ice.",
    effectText: "Defensive: reduces the next damage you take.",
  },
  {
    id: "ice_storm",
    name: "Blizzard Surge",
    element: "ICE",
    power: 7,
    description: "A whiteout storm that bites deep.",
    effectText: "Solid control damage; great into Lightning (advantage).",
  },
  {
    id: "lightning_bolt",
    name: "Thunderbolt",
    element: "LIGHTNING",
    power: 9,
    description: "A bolt that lands with a crack of thunder.",
    effectText: "Strong vs Shadow due to element advantage.",
  },
  {
    id: "lightning_chain",
    name: "Chain Lightning",
    element: "LIGHTNING",
    power: 8,
    description: "It arcs and hunts for a path.",
    effectText: "Randomly gains +1 power this turn.",
  },
  {
    id: "lightning_orb",
    name: "Storm Orb",
    element: "LIGHTNING",
    power: 7,
    description: "A humming sphere of charged air.",
    effectText: "Reliable mid damage.",
  },
  {
    id: "shadow_fang",
    name: "Shadow Fangs",
    element: "SHADOW",
    power: 8,
    description: "Claws that strike from the dark.",
    effectText: "Execute: deals +2 if target is below 10 HP.",
  },
  {
    id: "shadow_veil",
    name: "Umbral Veil",
    element: "SHADOW",
    power: 6,
    description: "A veil that blurs intent and aim.",
    effectText: "Evasion: reduces the next damage you take.",
  },
  {
    id: "shadow_reaper",
    name: "Soul Reaper",
    element: "SHADOW",
    power: 9,
    description: "The sharpest edge of the void.",
    effectText: "High damage finisher; strong vs Mystic (advantage).",
  },
  {
    id: "mystic_oracle",
    name: "Mystic Oracle",
    element: "MYSTIC",
    power: 7,
    description: "A seer who bends probability.",
    effectText: "Empower: gives +1 power to your next card.",
  },
  {
    id: "mystic_sigil",
    name: "Runic Sigil",
    element: "MYSTIC",
    power: 8,
    description: "A seal of ancient symbols.",
    effectText: "Balanced: ignores disadvantage (min multiplier 1.0).",
  },
  {
    id: "mystic_nova",
    name: "Astral Nova",
    element: "MYSTIC",
    power: 9,
    description: "A starborn detonation.",
    effectText: "Strong vs Fire due to element advantage.",
  },
  {
    id: "wild_shelby_core",
    name: "Shelby Core",
    element: "MYSTIC",
    power: 10,
    description: "Power drawn from Shelby hot storage.",
    effectText: "Overclock: +10% damage regardless of matchup.",
  },
  {
    id: "wild_glitch",
    name: "Chain Glitch",
    element: "SHADOW",
    power: 5,
    description: "Unstable, unpredictable power.",
    effectText: "Chaos: damage can spike (+0 to +5).",
  },
];

export function computeElementMultiplier(attacker: ElementType, defender: ElementType): number {
  const hasAdvantage = ELEMENT_ADVANTAGE[attacker]?.includes(defender);
  const hasDisadvantage = ELEMENT_ADVANTAGE[defender]?.includes(attacker);

  if (hasAdvantage) return ADVANTAGE_MULTIPLIER;
  if (hasDisadvantage) return DISADVANTAGE_MULTIPLIER;
  return 1;
}

export function pickRandomCard(from: Card[]): Card | null {
  if (!from.length) return null;
  const idx = Math.floor(Math.random() * from.length);
  return from[idx] ?? null;
}

export function createInitialDeck(): Card[] {
  // Basitçe 17 kartın hepsini tek kopya olarak kullan
  return [...ALL_CARDS];
}

