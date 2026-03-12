import { useState, useEffect } from "react";
import { useWallet, type InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import type { GameMode, PlayerId } from "../game/types";
import { createNewGame, applyMove } from "../game/engine";
import { ELEMENT_COLORS, ELEMENT_LABELS } from "../game/cards";
import type { GameState } from "../game/engine";
import { buildRegisterMovePayload, buildRegisterResultPayload, uploadBlob } from "../shelby/client";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

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
  const [status, setStatus] = useState<string | null>(null);
  const { account, signAndSubmitTransaction } = useWallet();

  useEffect(() => {
    if (mode && !game) {
      setGame(createNewGame(mode));
    }
  }, [mode, game]);

  const startNewGame = (nextMode: GameMode) => {
    setMode(nextMode);
    setGame(createNewGame(nextMode));
    setStatus(null);
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

  const handleMoveOnChain = async (nextGame: GameState, moveResult: ReturnType<typeof applyMove>) => {
    if (!account) {
      setStatus("Cüzdan bağlı değil. Hamle local oynandı, zincire yazılmadı.");
      setGame(nextGame);
      return;
    }

    setIsUploading(true);
    try {
      const registerMove = await buildRegisterMovePayload({
        accountAddress: account.address,
        gameId: nextGame.id,
        move: moveResult.move,
      });

      const moveTx: InputTransactionData = {
        data: registerMove.payload,
      };

      const submittedMove = await signAndSubmitTransaction(moveTx);

      await aptosClient.waitForTransaction({ transactionHash: submittedMove.hash });

      await uploadBlob({
        accountAddress: account.address,
        blobName: registerMove.blobName,
        data: registerMove.data,
      });

      if (moveResult.result) {
        const registerResult = await buildRegisterResultPayload({
          accountAddress: account.address,
          result: moveResult.result,
        });

        const resultTx: InputTransactionData = {
          data: registerResult.payload,
        };

        const submittedResult = await signAndSubmitTransaction(resultTx);
        await aptosClient.waitForTransaction({ transactionHash: submittedResult.hash });

        await uploadBlob({
          accountAddress: account.address,
          blobName: registerResult.blobName,
          data: registerResult.data,
        });

        setStatus(
          `Oyun sonucu Shelby'ye kaydedildi. Explorer'da ${submittedResult.hash} ve ${submittedMove.hash} hash'leri ile görebilirsin.`,
        );
      } else {
        setStatus(`Hamle Shelby'ye kaydedildi. Explorer'da ${submittedMove.hash} hash'i ile görebilirsin.`);
      }

      setGame(nextGame);
    } catch (error) {
      console.error(error);
      setStatus("Shelby'ye kaydederken hata oluştu, hamle local olarak oynandı.");
      setGame(nextGame);
    } finally {
      setIsUploading(false);
    }
  };

  const playCard = async (playerId: PlayerId, cardId: string) => {
    if (!game || game.finishedAt) return;
    if (game.turn.activePlayer !== playerId) return;

    const card = game.players[playerId].hand.find((c) => c.id === cardId);
    if (!card) return;

    const moveResult = applyMove(game, playerId, card);
    await handleMoveOnChain(moveResult.next, moveResult);
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
        <p className="subtitle">Shelby Protocol üzerinde Web3 kart savaşı</p>
        <div className="mode-buttons">
          <button onClick={() => startNewGame("PVP_LOCAL")}>İki Oyunculu (Aynı Cihaz)</button>
          <button onClick={() => startNewGame("PVE_AI")}>Bilgisayara Karşı</button>
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
          <h1>ShelbyWars</h1>
          <p className="subtitle">
            Oyun ID: <code>{game.id}</code> • Mod: {mode === "PVE_AI" ? "AI" : "PvP"}
          </p>
        </div>
        <div className="header-actions">
          <button onClick={() => startNewGame(mode ?? "PVE_AI")}>Yeniden Başlat</button>
          <button onClick={autoPlayTurn} disabled={isUploading || !!game.finishedAt}>
            Sıradaki Hamleyi Otomatik Oyna
          </button>
        </div>
      </header>

      <main className="board">
        <PlayerPanel
          player={p2}
          isActive={game.turn.activePlayer === "PLAYER_TWO"}
          onToggleAuto={() => toggleAuto("PLAYER_TWO")}
          onPlayCard={(cardId) => playCard("PLAYER_TWO", cardId)}
          isUploading={isUploading}
        />

        <div className="center-info">
          <div className="turn-indicator">
            Tur: {game.turn.turnNumber} • Sıra: {game.turn.activePlayer === "PLAYER_ONE" ? p1.name : p2.name}
          </div>
          {game.finishedAt && (
            <div className="game-over">
              Oyun Bitti:{" "}
              {p1.health === p2.health
                ? "Berabere"
                : p1.health > p2.health
                  ? `${p1.name} kazandı`
                  : `${p2.name} kazandı`}
            </div>
          )}
          {status && <div className="status">{status}</div>}
        </div>

        <PlayerPanel
          player={p1}
          isActive={game.turn.activePlayer === "PLAYER_ONE"}
          onToggleAuto={() => toggleAuto("PLAYER_ONE")}
          onPlayCard={(cardId) => playCard("PLAYER_ONE", cardId)}
          isUploading={isUploading}
        />
      </main>

      <section className="history">
        <h2>Hamle Geçmişi (Shelby Hot Storage)</h2>
        {!game.history.length && <p>Henüz hamle yok.</p>}
        {game.history.map((move) => (
          <div key={move.turnNumber} className="history-item">
            <span className="turn">Tur {move.turnNumber}</span>
            <span>
              {move.attacker === "PLAYER_ONE" ? p1.name : p2.name}{" "}
              <strong>{move.attackerCard.name}</strong> ile{" "}
              {move.defender === "PLAYER_ONE" ? p1.name : p2.name} üzerinde{" "}
              <strong>{move.finalDamage}</strong> hasar verdi (
              {ELEMENT_LABELS[move.attackerCard.element]} → {ELEMENT_LABELS[move.defenderCard.element]} x
              {move.elementMultiplier.toFixed(1)})
            </span>
          </div>
        ))}
      </section>

      <footer className="footer">Her hamle Shelby hot storage'a JSON blob olarak kaydedilir.</footer>
    </div>
  );
};

interface PlayerPanelProps {
  player: GameState["players"]["PLAYER_ONE"];
  isActive: boolean;
  isUploading: boolean;
  onToggleAuto: () => void;
  onPlayCard: (cardId: string) => void;
}

const PlayerPanel = ({ player, isActive, onToggleAuto, onPlayCard, isUploading }: PlayerPanelProps) => {
  return (
    <section className={`player-panel ${isActive ? "active" : ""}`}>
      <div className="player-header">
        <div>
          <h2>{player.name}</h2>
          <p>
            Can: <strong>{player.health}</strong>
          </p>
        </div>
        <div className="player-controls">
          <button onClick={onToggleAuto}>{player.isAuto ? "Oto: Açık" : "Oto: Kapalı"}</button>
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
        {!player.hand.length && <p>Elde kart kalmadı.</p>}
      </div>
    </section>
  );
};

