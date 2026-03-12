import { useState, useEffect } from "react";
import { useWallet, type InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import type { GameMode, PlayerId } from "../game/types";
import { createNewGame, applyMove } from "../game/engine";
import { ELEMENT_COLORS, ELEMENT_LABELS } from "../game/cards";
import type { GameState } from "../game/engine";
import { buildRegisterGameLogPayload, uploadBlob } from "../shelby/client";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import type { GameLog } from "../game/types";

const aptosClient = new Aptos(
  new AptosConfig({
    network: Network.TESTNET,
    clientConfig: {
      API_KEY: import.meta.env.VITE_APTOS_API_KEY,
    },
  }),
);

export const App = () => {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedTx, setSavedTx] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const { account, signAndSubmitTransaction, wallets, connect, disconnect } = useWallet();

  useEffect(() => {
    if (mode && !game) {
      setGame(createNewGame(mode));
    }
  }, [mode, game]);

  const startNewGame = (nextMode: GameMode) => {
    setMode(nextMode);
    setGame(createNewGame(nextMode));
    setStatus(null);
    setSavedTx(null);
  };

  const toggleAuto = (id: PlayerId) => {
    if (!game) return;
    setGame({
      ...game,
      players: {
        ...game.players,
        [id]: {
          ...game.players[id],
          isAuto: !game.players[id].isAuto,
        },
      },
    });
  };

  const saveGameToShelby = async () => {
    if (!game || !game.finishedAt) return;
    if (!account) {
      setStatus("Wallet not connected. Connect your wallet to save the match to Shelby.");
      return;
    }
    if (savedTx) {
      setStatus(`Already saved. Tx: ${savedTx}`);
      return;
    }

    setIsSaving(true);
    try {
      const p1 = game.players.PLAYER_ONE;
      const p2 = game.players.PLAYER_TWO;
      const winner =
        p1.health === p2.health ? "DRAW" : p1.health > p2.health ? "PLAYER_ONE" : "PLAYER_TWO";
      const loser = winner === "DRAW" ? "NONE" : winner === "PLAYER_ONE" ? "PLAYER_TWO" : "PLAYER_ONE";

      const result = {
        gameId: game.id,
        mode: game.mode,
        winner,
        loser,
        totalTurns: game.history.length,
        startedAt: game.startedAt,
        finishedAt: game.finishedAt,
      } as const;

      const log: GameLog = {
        type: "shelbywars_game_log",
        storage: "hot",
        protocol: "ShelbyWars",
        version: 1,
        gameId: game.id,
        mode: game.mode,
        startedAt: game.startedAt,
        finishedAt: game.finishedAt,
        players: [
          { id: "PLAYER_ONE", name: p1.name },
          { id: "PLAYER_TWO", name: p2.name },
        ],
        moves: game.history,
        result: result as any,
      };

      const register = await buildRegisterGameLogPayload({
        accountAddress: account.address,
        gameId: game.id,
        log,
      });

      const tx: InputTransactionData = { data: register.payload };
      const submitted = await signAndSubmitTransaction(tx);
      await aptosClient.waitForTransaction({ transactionHash: submitted.hash });

      await uploadBlob({
        accountAddress: account.address,
        blobName: register.blobName,
        data: register.data,
      });

      setSavedTx(submitted.hash);
      setStatus(`Match saved to Shelby Hot Storage. Explorer tx: ${submitted.hash}`);
    } catch (e) {
      console.error(e);
      setStatus("Failed to save match to Shelby. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const playCard = async (playerId: PlayerId, cardId: string) => {
    if (!game || game.finishedAt) return;
    if (game.turn.activePlayer !== playerId) return;

    const card = game.players[playerId].hand.find((c) => c.id === cardId);
    if (!card) return;

    const moveResult = applyMove(game, playerId, card);
    setGame(moveResult.next);
  };

  const autoPlayTurn = async () => {
    if (!game || game.finishedAt) return;
    const active = game.turn.activePlayer;
    const hand = game.players[active].hand;
    if (!hand.length) return;
    const card = hand[Math.floor(Math.random() * hand.length)];
    await playCard(active, card.id);
  };

  const renderModeSelector = () => {
    if (mode && game) return null;

    return (
      <div className="mode-selector">
        <h1 className="title">ShelbyWars</h1>
        <p className="subtitle">A Web3 card battle on Shelby Protocol (Aptos)</p>
        <div className="mode-buttons">
          <button onClick={() => startNewGame("PVP_LOCAL")}>Local PvP (Same Device)</button>
          <button onClick={() => startNewGame("PVE_AI")}>Play vs AI</button>
        </div>
      </div>
    );
  };

  if (!game) {
    return (
      <div className="app-root">
        {renderModeSelector()}
        <footer className="footer">ShelbyWars • Aptos • Hot Storage</footer>
      </div>
    );
  }

  const p1 = game.players.PLAYER_ONE;
  const p2 = game.players.PLAYER_TWO;

  return (
    <div className="app-root">
      <header className="header">
        <div>
          <button
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = "/";
              }
            }}
          >
            ← Back
          </button>
          <h1>ShelbyWars</h1>
          <p className="subtitle">
            Game ID: <code>{game.id}</code> • Mode: {mode === "PVE_AI" ? "AI" : "PvP"}
          </p>
        </div>
        <div className="header-actions">
          <div className="wallet-info">
            {account ? (
              <>
                <span>
                  Wallet:{" "}
                  <code>
                    {account.address.slice(0, 6)}...{account.address.slice(-4)}
                  </code>
                </span>
                <button onClick={() => disconnect()}>Disconnect</button>
              </>
            ) : (
              <>
                <span>Wallet not connected</span>
                {wallets.length > 0 && (
                  <button onClick={() => connect(wallets[0].name)}>Connect Wallet</button>
                )}
              </>
            )}
          </div>
          <button onClick={() => startNewGame(mode ?? "PVE_AI")}>Restart</button>
          <button onClick={autoPlayTurn} disabled={isUploading || !!game.finishedAt}>
            Auto-play Next Turn
          </button>
        </div>
      </header>

      <main className="board">
        <PlayerPanel
          player={p2}
          isActive={game.turn.activePlayer === "PLAYER_TWO"}
          onToggleAuto={() => toggleAuto("PLAYER_TWO")}
          onPlayCard={(cardId) => playCard("PLAYER_TWO", cardId)}
          isUploading={isUploading || !account}
          requireWallet={!account}
        />

        <div className="center-info">
          <div className="turn-indicator">
            Turn: {game.turn.turnNumber} • Active: {game.turn.activePlayer === "PLAYER_ONE" ? p1.name : p2.name}
          </div>
          {game.finishedAt && (
            <div className="game-over">
              Game Over:{" "}
              {p1.health === p2.health
                ? "Draw"
                : p1.health > p2.health
                  ? `${p1.name} wins`
                  : `${p2.name} wins`}
            </div>
          )}
          {status && <div className="status">{status}</div>}
          {game.finishedAt && (
            <button onClick={saveGameToShelby} disabled={isSaving || !account || !!savedTx}>
              {savedTx ? "Saved ✅" : isSaving ? "Saving..." : "Save match to Shelby (1 signature)"}
            </button>
          )}
        </div>

        <PlayerPanel
          player={p1}
          isActive={game.turn.activePlayer === "PLAYER_ONE"}
          onToggleAuto={() => toggleAuto("PLAYER_ONE")}
          onPlayCard={(cardId) => playCard("PLAYER_ONE", cardId)}
          isUploading={isUploading || !account}
          requireWallet={!account}
        />
      </main>

      <section className="history">
        <h2>Match Log (local)</h2>
        {!game.history.length && <p>No moves yet.</p>}
        {game.history.map((move) => (
          <div key={move.turnNumber} className="history-item">
            <span className="turn">Turn {move.turnNumber}</span>
            <span>
              {move.attacker === "PLAYER_ONE" ? p1.name : p2.name}{" "}
              used <strong>{move.attackerCard.name}</strong> on{" "}
              {move.defender === "PLAYER_ONE" ? p1.name : p2.name} for{" "}
              <strong>{move.finalDamage}</strong> damage (
              {ELEMENT_LABELS[move.attackerCard.element]} → {ELEMENT_LABELS[move.defenderCard.element]} ×
              {move.elementMultiplier.toFixed(1)})
            </span>
          </div>
        ))}
      </section>

      <FAQ />
      <footer className="footer">Save once at the end: one on-chain tx + one hot storage blob.</footer>
    </div>
  );
};

const FAQ = () => {
  return (
    <section className="history faq">
      <h2>FAQ</h2>
      <details>
        <summary>How do elements work?</summary>
        <p>
          ShelbyWars uses a simple advantage wheel: Fire &gt; Ice &gt; Lightning &gt; Shadow &gt; Mystic &gt; Fire.
          Advantage deals 1.5× damage, disadvantage deals 0.7×.
        </p>
      </details>
      <details>
        <summary>What do the card effects do?</summary>
        <ul>
          <li>
            <strong>Meteor Rain</strong>: 35% chance to deal +1 bonus damage.
          </li>
          <li>
            <strong>Chain Lightning</strong>: 50% chance to gain +1 power.
          </li>
          <li>
            <strong>Chain Glitch</strong>: random bonus damage from +0 to +5.
          </li>
          <li>
            <strong>Shadow Fangs</strong>: if the target is below 10 HP, deals +2 bonus damage.
          </li>
          <li>
            <strong>Glacier Barrier / Umbral Veil</strong>: reduces incoming damage by 2 when used as defense.
          </li>
          <li>
            <strong>Ice Spikes</strong>: reduces incoming damage by 1 when used as defense.
          </li>
          <li>
            <strong>Runic Sigil</strong>: ignores disadvantage (minimum multiplier becomes 1.0).
          </li>
          <li>
            <strong>Shelby Core</strong>: adds a small 10% damage boost.
          </li>
        </ul>
      </details>
      <details>
        <summary>Why do I only sign once?</summary>
        <p>
          Each on-chain registration normally requires a signature. To keep UX smooth, ShelbyWars saves the full match log
          at the end in a single hot storage JSON blob registered by one transaction.
        </p>
      </details>
    </section>
  );
};

interface PlayerPanelProps {
  player: GameState["players"]["PLAYER_ONE"];
  isActive: boolean;
  isUploading: boolean;
  requireWallet?: boolean;
  onToggleAuto: () => void;
  onPlayCard: (cardId: string) => void;
}

const PlayerPanel = ({
  player,
  isActive,
  onToggleAuto,
  onPlayCard,
  isUploading,
  requireWallet,
}: PlayerPanelProps) => {
  return (
    <section className={`player-panel ${isActive ? "active" : ""}`}>
      <div className="player-header">
        <div>
          <h2>{player.name}</h2>
          <p>
            HP: <strong>{player.health}</strong>
          </p>
        </div>
        <div className="player-controls">
          <button onClick={onToggleAuto}>{player.isAuto ? "Auto: ON" : "Auto: OFF"}</button>
          {requireWallet && <span className="player-wallet-warning">Connect wallet</span>}
        </div>
      </div>
      <div className="hand">
        {player.hand.map((card) => (
          <button
            key={card.id}
            className="card"
            style={{ borderColor: ELEMENT_COLORS[card.element] }}
            onClick={() => onPlayCard(card.id)}
            disabled={!isActive || isUploading}
          >
            <div className="card-title">
              <span>{card.name}</span>
              <span className="card-power">{card.power}</span>
            </div>
            <div className="card-element" style={{ color: ELEMENT_COLORS[card.element] }}>
              {ELEMENT_LABELS[card.element]}
            </div>
            <p className="card-desc">{card.description}</p>
            <p className="card-effect">{card.effectText}</p>
          </button>
        ))}
        {!player.hand.length && <p>No cards left in hand.</p>}
      </div>
    </section>
  );
};

