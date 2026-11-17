"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Chess, Square } from "chess.js";
import {
  Bot,
  Check,
  ChevronRight,
  Flag,
  List,
  Plus,
  SlidersHorizontal,
  Undo2,
} from "lucide-react";
import type { SoundCue } from "../lib/chess-sound";
import { BoardPanel, Modal, SectionHead } from "./ui";
import {
  freshGame,
  position,
  validateGame,
  type GameState,
} from "../lib/game-state";
const labels = ["Relaxed", "Casual", "Balanced", "Challenging", "Expert"];
export default function Play({
  player,
  tone,
}: {
  player: string;
  tone: (cue?: SoundCue) => void;
}) {
  const key = "knightfall:game:" + player;
  const [s, setS] = useState<GameState>(freshGame),
    [ready, setReady] = useState(false),
    [selected, select] = useState<Square | null>(null);
  const [promo, setPromo] = useState<Square | null>(null),
    [dialog, setDialog] = useState(false),
    [side, setSide] = useState<"w" | "b">("w"),
    [newLevel, setNewLevel] = useState(3);
  const [error, setError] = useState(""),
    [sync, setSync] = useState(""),
    [retry, again] = useState(0);
  const stamp = useRef(0),
    historyBox = useRef<HTMLDivElement>(null);
  const game = useMemo(() => position(s), [s.moves]),
    over = game.isGameOver(),
    thinking = ready && !over && game.turn() !== s.side;
  useEffect(() => {
    let cancel = false;
    let cached = freshGame();
    try {
      const data = JSON.parse(localStorage.getItem(key) || "null");
      if (validateGame(data)) cached = data;
    } catch {}
    setS(cached);
    fetch("/api/game", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json() as Promise<{ game?: unknown; local?: boolean }>;
      })
      .then((data) => {
        if (cancel) return;
        if (
          validateGame(data.game) &&
          data.game.updatedAt >= cached.updatedAt
        ) {
          stamp.current = data.game.updatedAt;
          setS(data.game);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancel) setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, [key]);
  useEffect(() => {
    if (!ready || s.updatedAt === 0) return;
    let cancel = false;
    let local = false;
    try {
      localStorage.setItem(key, JSON.stringify(s));
      local = true;
    } catch {}
    if (player === "local") {
      setSync(local ? "Saved on this device" : "Unable to save on this device");
      return;
    }
    if (stamp.current === s.updatedAt) {
      setSync("Game saved");
      return;
    }
    setSync("Saving game…");
    const post = () =>
      fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      })
        .then((r) => {
          if (!r.ok) throw Error();
          return r.json() as Promise<{ game?: unknown; local?: boolean }>;
        })
        .then((data) => {
          if (!cancel) {
            stamp.current = s.updatedAt;
            setSync(data.local ? "Saved on this device" : "Game saved");
          }
        })
        .catch(() => {
          if (!cancel)
            setSync(
              local ? "Saved on this device · sync pending" : "Save pending",
            );
        });
    post();
    const reconnect = () => {
      if (stamp.current !== s.updatedAt) post();
    };
    window.addEventListener("online", reconnect);
    const timer = setInterval(reconnect, 20000);
    return () => {
      cancel = true;
      clearInterval(timer);
      window.removeEventListener("online", reconnect);
    };
  }, [ready, s, key, player]);
  function update(x: Partial<GameState>) {
    setS((prev) => ({
      ...prev,
      ...x,
      updatedAt: Math.max(Date.now(), prev.updatedAt + 1),
    }));
  }
  function moveSound(position: Chess) {
    if (position.isCheckmate()) tone(position.turn() === s.side ? "loss" : "win");
    else tone(position.isDraw() ? "draw" : "move");
  }
  useEffect(() => {
    if (!thinking) return;
    let canceled = false;
    const worker = new Worker("/engine.js");
    const timer = setTimeout(() => {
      if (!canceled) {
        worker.terminate();
        setError("The computer paused. Retry its move.");
      }
    }, 10000);
    let replyTimer: ReturnType<typeof setTimeout>;
    const earliest = performance.now() + 1450;
    worker.onmessage = (e) => {
      if (canceled) return;
      clearTimeout(timer);
      replyTimer = setTimeout(() => {
      if (canceled) return;
      try {
        if (!e.data.move) throw Error();
        const g = position(s);
        const m = g.move(e.data.move);
        if (!m) throw Error();
        update({ moves: [...s.moves, e.data.move] });
        setError("");
        moveSound(g);
      } catch {
        setError("The computer paused. Retry its move.");
      }
      }, Math.max(0, earliest - performance.now()));
    };
    worker.onerror = () => {
      clearTimeout(timer);
      if (!canceled) setError("The computer paused. Retry its move.");
    };
    worker.postMessage({ moves: s.moves, level: s.level });
    return () => {
      canceled = true;
      clearTimeout(replyTimer);
      clearTimeout(timer);
      worker.terminate();
    };
  }, [thinking, s.moves, s.level, s.side, retry, tone]);
  useEffect(() => {
    const el = historyBox.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [s.moves]);
  const targets = useMemo(
    () =>
      selected
        ? game.moves({ square: selected, verbose: true }).map((m) => m.to)
        : [],
    [game, selected],
  );
  function make(to: Square, promotion?: string) {
    if (!selected) return;
    const copy = position(s);
    try {
      const m = copy.move({ from: selected, to, promotion });
      update({ moves: [...s.moves, m.from + m.to + (m.promotion || "")] });
      select(null);
      setPromo(null);
      setError("");
      moveSound(copy);
    } catch {}
  }
  function pick(sq: Square) {
    if (!ready || over || thinking) return;
    if (selected === sq) {
      select(null);
      return;
    }
    if (game.get(sq)?.color === s.side) {
      select(sq);
      setError("");
      return;
    }
    if (selected && targets.includes(sq)) {
      if (game.get(selected)?.type === "p" && ["8", "1"].includes(sq[1]))
        setPromo(sq);
      else make(sq);
      return;
    }
    setError(
      selected
        ? "Choose a highlighted legal move."
        : "Select one of your own pieces.",
    );
  }
  const history = useMemo(() => game.history({ verbose: true }), [game]),
    result = game.isCheckmate()
      ? game.turn() === s.side
        ? "Checkmate · You lose"
        : "Checkmate · You win"
      : game.isStalemate()
        ? "Draw by stalemate"
        : game.isInsufficientMaterial()
          ? "Draw by insufficient material"
          : game.isThreefoldRepetition()
            ? "Draw by repetition"
            : "Draw by the fifty-move rule";
  const newDialog = () => {
    setSide(s.side);
    setNewLevel(s.level);
    setDialog(true);
  };
  function undo() {
    if (!s.moves.length) return;
    let moves = s.moves.slice(0, -1);
    while (moves.length && position({ ...s, moves }).turn() !== s.side)
      moves = moves.slice(0, -1);
    update({ moves });
    select(null);
    setError("");
  }
  return (
    <>
      <SectionHead
        title="Play chess"
        description="Play a full game against the computer at your own pace."
      >
        <button className="outlineBtn" onClick={newDialog}>
          <Plus size={16} />
          New game
        </button>
      </SectionHead>
      <div className="workspace">
        <BoardPanel
          game={game}
          selected={selected}
          targets={targets}
          last={history.at(-1) || null}
          replayBlocked={!ready || thinking}
          outcome={over ? { kind: game.isCheckmate() ? (game.turn() === s.side ? "loss" : "win") : "draw", text: result } : undefined}
          orientation={s.side}
          onPick={pick}
          disabled={!ready || thinking || over}
          viewKey={"regular" + s.side}
          label={
            over
              ? "Game over"
              : (game.turn() === "w" ? "White" : "Black") + " to move"
          }
          reset={newDialog}
          check={!over && game.isCheck()}
          message={
            error ||
            (over
              ? result
              : thinking
                ? "Computer is thinking…"
                : selected
                  ? "Choose a highlighted square"
                  : "Select a piece to move")
          }
          accent={over}
        />
        <aside className="brief playBrief">
          <div className="eyebrow">
            <Bot size={15} />
            COMPUTER OPPONENT
          </div>
          <h2>Match settings</h2>
          <p className="briefIntro">
            You’re playing {s.side === "w" ? "White" : "Black"}. Adjust the
            difficulty at any point in the game.
          </p>
          <div className="difficulty">
            <div className="row spread">
              <span className="row">
                <SlidersHorizontal size={15} /> Difficulty
              </span>
              <strong>
                {s.level} · {labels[s.level - 1]}
              </strong>
            </div>
            <input
              aria-label="Computer difficulty"
              type="range"
              min="1"
              max="5"
              step="1"
              value={s.level}
              disabled={!ready}
              onChange={(e) => {
                setError("");
                update({ level: Number(e.target.value) });
              }}
            />
            <div className="row spread scale">
              <span>Relaxed</span>
              <span>Expert</span>
            </div>
          </div>
          <div className="gameStatus">
            <Flag size={16} />
            <span>
              {over ? result : thinking ? "Computer’s turn" : "Your move"}
            </span>
          </div>
          <div className="row spread histHead">
            <span className="eyebrow">
              <List size={14} />
              MOVE HISTORY
            </span>
            <span>
              {s.moves.length} {s.moves.length === 1 ? "ply" : "plies"}
            </span>
          </div>
          <div className="moveHistory" ref={historyBox}>
            {history.length === 0 ? (
              <p>Your moves will appear here.</p>
            ) : (
              Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => (
                <div key={i}>
                  <em>{i + 1}.</em>
                  <b>{history[i * 2].san}</b>
                  <b>{history[i * 2 + 1]?.san || "…"}</b>
                </div>
              ))
            )}
          </div>
          {error.startsWith("The computer") && (
            <button
              className="primaryBtn"
              onClick={() => {
                setError("");
                again((v) => v + 1);
              }}
            >
              Retry computer move
              <ChevronRight size={15} />
            </button>
          )}
          <button
            className="outlineBtn full"
            disabled={
              !ready ||
              !s.moves.length ||
              (s.side === "b" && s.moves.length === 1)
            }
            onClick={undo}
          >
            <Undo2 size={15} />
            Take back a move
          </button>
          {sync && (
            <span className="savedText">
              <Check size={13} />
              {sync}
            </span>
          )}
        </aside>
      </div>
      {dialog && (
        <Modal title="Start a new game" close={() => setDialog(false)}>
          <p>
            {s.moves.length && !over
              ? "Starting a new game replaces your saved match. Choose your side and difficulty."
              : "Choose your side and difficulty."}
          </p>
          <label>Play as</label>
          <div className="sideSelect">
            {(["w", "b"] as const).map((c) => (
              <button
                key={c}
                className={c === side ? "active" : ""}
                onClick={() => setSide(c)}
              >
                <span
                  className={"turnDot " + (c === "w" ? "white" : "black")}
                />
                {c === "w" ? "White" : "Black"}
              </button>
            ))}
          </div>
          <label htmlFor="newLevel">Difficulty · {labels[newLevel - 1]}</label>
          <input
            id="newLevel"
            type="range"
            min="1"
            max="5"
            value={newLevel}
            onChange={(e) => setNewLevel(+e.target.value)}
          />
          <button
            className="primaryBtn"
            onClick={() => {
              update({ moves: [], side, level: newLevel });
              select(null);
              setError("");
              setDialog(false);
            }}
          >
            Start game
            <ChevronRight size={16} />
          </button>
        </Modal>
      )}
      {promo && (
        <Modal title="Promote your pawn" close={() => setPromo(null)}>
          <p>Choose the piece your pawn becomes.</p>
          <div className="promote">
            {["q", "r", "b", "n"].map((p, i) => (
              <button key={p} onClick={() => make(promo, p)}>
                <img src={"/pieces/" + s.side + p + ".webp"} alt="" />
                {["Queen", "Rook", "Bishop", "Knight"][i]}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
