export type ElementType = "FIRE" | "ICE" | "LIGHTNING" | "SHADOW" | "MYSTIC";

export type PlayerId = "PLAYER_ONE" | "PLAYER_TWO";

export interface Card {
  id: string;
  name: string;
  element: ElementType;
  power: number;
  description: string;
  effectText: string;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  health: number;
  deck: Card[];
  hand: Card[];
  graveyard: Card[];
  isAuto: boolean;
}

export interface Turn {
  turnNumber: number;
  activePlayer: PlayerId;
}

export type GameMode = "PVP_LOCAL" | "PVE_AI";

export interface MoveRecord {
  gameId: string;
  turnNumber: number;
  mode: GameMode;
  attacker: PlayerId;
  defender: PlayerId;
  attackerCard: Card;
  defenderCard: Card;
  baseDamage: number;
  elementMultiplier: number;
  finalDamage: number;
  timestamp: number;
}

export interface GameResult {
  gameId: string;
  mode: GameMode;
  winner: PlayerId | "DRAW";
  loser: PlayerId | "NONE";
  totalTurns: number;
  startedAt: number;
  finishedAt: number;
}

