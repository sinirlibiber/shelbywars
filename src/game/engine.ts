import { computeElementMultiplier, createInitialDeck, pickRandomCard } from "./cards";
import type {
  Card,
  GameMode,
  GameResult,
  MoveRecord,
  PlayerId,
  PlayerState,
  Turn,
} from "./types";

export interface GameState {
  id: string;
  mode: GameMode;
  players: Record<PlayerId, PlayerState>;
  turn: Turn;
  history: MoveRecord[];
  startedAt: number;
  finishedAt: number | null;
}

export const MAX_HEALTH = 30;

export function createNewGame(mode: GameMode): GameState {
  const id = `game_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
  const deck1 = createInitialDeck();
  const deck2 = createInitialDeck();

  const playerOne: PlayerState = {
    id: "PLAYER_ONE",
    name: mode === "PVE_AI" ? "You" : "Player 1",
    health: MAX_HEALTH,
    deck: deck1,
    hand: deck1.slice(0, 5),
    graveyard: [],
    isAuto: false,
  };

  const playerTwo: PlayerState = {
    id: "PLAYER_TWO",
    name: mode === "PVE_AI" ? "Shelby AI" : "Player 2",
    health: MAX_HEALTH,
    deck: deck2,
    hand: deck2.slice(0, 5),
    graveyard: [],
    isAuto: mode === "PVE_AI",
  };

  return {
    id,
    mode,
    players: {
      PLAYER_ONE: playerOne,
      PLAYER_TWO: playerTwo,
    },
    turn: {
      turnNumber: 1,
      activePlayer: "PLAYER_ONE",
    },
    history: [],
    startedAt: Date.now(),
    finishedAt: null,
  };
}

export function getOpponentId(playerId: PlayerId): PlayerId {
  return playerId === "PLAYER_ONE" ? "PLAYER_TWO" : "PLAYER_ONE";
}

export function applyMove(
  state: GameState,
  attackerId: PlayerId,
  attackerCard: Card,
): { next: GameState; move: MoveRecord; result: GameResult | null } {
  if (state.finishedAt) {
    return { next: state, move: state.history[state.history.length - 1]!, result: null };
  }

  const defenderId = getOpponentId(attackerId);
  const defender = state.players[defenderId];

  const defenderCard = pickRandomCard(defender.hand) ?? defender.hand[0] ?? attackerCard;

  // lightweight effect system (purely derived from chosen cards)
  let baseDamage = attackerCard.power;

  // Card-specific bonus randomness (non-crypto; for gameplay only)
  if (attackerCard.id === "fire_meteor") {
    if (Math.random() < 0.35) baseDamage += 1;
  }
  if (attackerCard.id === "lightning_chain") {
    baseDamage += Math.random() < 0.5 ? 1 : 0;
  }
  if (attackerCard.id === "wild_glitch") {
    baseDamage += Math.floor(Math.random() * 6); // +0..+5
  }
  if (attackerCard.id === "shadow_fang" && defender.health < 10) {
    baseDamage += 2;
  }

  let multiplier = computeElementMultiplier(attackerCard.element, defenderCard.element);
  if (attackerCard.id === "mystic_sigil") {
    // ignore disadvantage
    multiplier = Math.max(1, multiplier);
  }
  if (attackerCard.id === "wild_shelby_core") {
    multiplier *= 1.1;
  }

  let finalDamage = Math.round(baseDamage * multiplier);

  // Defensive effects based on defender's chosen card
  let shield = 0;
  if (defenderCard.id === "ice_barrier" || defenderCard.id === "shadow_veil") {
    shield = 2;
  }
  if (defenderCard.id === "ice_spike") {
    shield = 1;
  }
  finalDamage = Math.max(0, finalDamage - shield);

  const move: MoveRecord = {
    gameId: state.id,
    turnNumber: state.turn.turnNumber,
    mode: state.mode,
    attacker: attackerId,
    defender: defenderId,
    attackerCard,
    defenderCard,
    baseDamage,
    elementMultiplier: multiplier,
    finalDamage,
    timestamp: Date.now(),
  };

  const next: GameState = {
    ...state,
    players: {
      ...state.players,
      [attackerId]: {
        ...state.players[attackerId],
        hand: state.players[attackerId].hand.filter((c) => c.id !== attackerCard.id),
        graveyard: [...state.players[attackerId].graveyard, attackerCard],
      },
      [defenderId]: {
        ...defender,
        health: Math.max(0, defender.health - finalDamage),
      },
    },
    history: [...state.history, move],
  };

  let result: GameResult | null = null;
  const defenderHealth = next.players[defenderId].health;
  const attackerHealth = next.players[attackerId].health;

  if (defenderHealth <= 0 || attackerHealth <= 0) {
    const winner =
      defenderHealth <= 0 && attackerHealth <= 0
        ? "DRAW"
        : defenderHealth <= 0
          ? attackerId
          : defenderId;
    const loser =
      winner === "DRAW"
        ? "NONE"
        : winner === "PLAYER_ONE"
          ? "PLAYER_TWO"
          : "PLAYER_ONE";

    result = {
      gameId: state.id,
      mode: state.mode,
      winner,
      loser,
      totalTurns: next.history.length,
      startedAt: state.startedAt,
      finishedAt: Date.now(),
    };

    next.finishedAt = result.finishedAt;
  } else {
    next.turn = {
      turnNumber: state.turn.turnNumber + 1,
      activePlayer: getOpponentId(state.turn.activePlayer),
    };
  }

  return { next, move, result };
}

