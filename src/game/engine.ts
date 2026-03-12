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
    name: mode === "PVE_AI" ? "Sen" : "Oyuncu 1",
    health: MAX_HEALTH,
    deck: deck1,
    hand: deck1.slice(0, 5),
    graveyard: [],
    isAuto: false,
  };

  const playerTwo: PlayerState = {
    id: "PLAYER_TWO",
    name: mode === "PVE_AI" ? "Shelby AI" : "Oyuncu 2",
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

  const multiplier = computeElementMultiplier(attackerCard.element, defenderCard.element);
  const baseDamage = attackerCard.power;
  const finalDamage = Math.round(baseDamage * multiplier);

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

