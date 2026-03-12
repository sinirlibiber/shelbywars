import type { Card, ElementType } from "./types";

const elements: ElementType[] = ["FIRE", "ICE", "LIGHTNING", "SHADOW", "MYSTIC"];

export const ELEMENT_LABELS: Record<ElementType, string> = {
  FIRE: "Ateş",
  ICE: "Buz",
  LIGHTNING: "Yıldırım",
  SHADOW: "Gölge",
  MYSTIC: "Gizem",
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
    name: "Alev Kılıcı",
    element: "FIRE",
    power: 9,
    description: "Saf ateşten bir kılıç.",
    effectText: "Buz kartlarına karşı ekstra hasar.",
  },
  {
    id: "fire_meteor",
    name: "Meteor Yağmuru",
    element: "FIRE",
    power: 8,
    description: "Gökyüzünden inen alev taşları.",
    effectText: "Rastgele ek 1 hasar verebilir.",
  },
  {
    id: "fire_phoenix",
    name: "Anka Alevi",
    element: "FIRE",
    power: 7,
    description: "Yeniden doğan alev ruhu.",
    effectText: "Düşük güçte ama tutarlı hasar.",
  },
  {
    id: "ice_spike",
    name: "Buz Dikenleri",
    element: "ICE",
    power: 8,
    description: "Yerden fışkıran buz sivrileri.",
    effectText: "Işın kartlarını yavaşlatır.",
  },
  {
    id: "ice_barrier",
    name: "Buz Bariyeri",
    element: "ICE",
    power: 6,
    description: "Kalın bir buz duvarı.",
    effectText: "Alınan hasarı biraz azaltır.",
  },
  {
    id: "ice_storm",
    name: "Tipi Fırtınası",
    element: "ICE",
    power: 7,
    description: "Dondurucu bir kar fırtınası.",
    effectText: "Gizem kartlarına karşı istikrarlı.",
  },
  {
    id: "lightning_bolt",
    name: "Yıldırım Oku",
    element: "LIGHTNING",
    power: 9,
    description: "Gökgürültüsüyle inen şimşek.",
    effectText: "Gölge kartlarını deler geçer.",
  },
  {
    id: "lightning_chain",
    name: "Zincir Yıldırımı",
    element: "LIGHTNING",
    power: 8,
    description: "Birden fazla hedefe atlar.",
    effectText: "Rastgele +1 güç.",
  },
  {
    id: "lightning_orb",
    name: "Fırtına Küresi",
    element: "LIGHTNING",
    power: 7,
    description: "Elektrik yüklü enerji küresi.",
    effectText: "Tutarlı, orta seviye hasar.",
  },
  {
    id: "shadow_fang",
    name: "Gölge Dişleri",
    element: "SHADOW",
    power: 8,
    description: "Karanlıktan fırlayan pençeler.",
    effectText: "Zayıf rakipleri bitirir.",
  },
  {
    id: "shadow_veil",
    name: "Karanlık Örtü",
    element: "SHADOW",
    power: 6,
    description: "Rakibin hamlesini bulanıklaştırır.",
    effectText: "Alınan hasarı düşürür.",
  },
  {
    id: "shadow_reaper",
    name: "Ruh Biçen",
    element: "SHADOW",
    power: 9,
    description: "Karanlığın en keskin hali.",
    effectText: "Gizem kartlarına karşı ölümcül.",
  },
  {
    id: "mystic_oracle",
    name: "Gizemli Kâhin",
    element: "MYSTIC",
    power: 7,
    description: "Geleceği gören ruh.",
    effectText: "Zayıf kartları güçlendirir.",
  },
  {
    id: "mystic_sigil",
    name: "Rün Mührü",
    element: "MYSTIC",
    power: 8,
    description: "Kadim sembollerle mühür.",
    effectText: "Her elemente dengeli hasar.",
  },
  {
    id: "mystic_nova",
    name: "Astral Nova",
    element: "MYSTIC",
    power: 9,
    description: "Yıldızlardan inen patlama.",
    effectText: "Ateş kartlarına ekstra hasar.",
  },
  {
    id: "wild_shelby_core",
    name: "Shelby Çekirdeği",
    element: "MYSTIC",
    power: 10,
    description: "Shelby hot storage gücü.",
    effectText: "Her elemente karşı hafif avantaj.",
  },
  {
    id: "wild_glitch",
    name: "Zincir Glitch'i",
    element: "SHADOW",
    power: 5,
    description: "Kararsız, tahmin edilemez güç.",
    effectText: "Hasarı rastgele artabilir.",
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

