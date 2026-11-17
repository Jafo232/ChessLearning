"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Check,
  ChevronRight,
  CircleCheck,
  Crosshair,
  Grid2X2,
  Layers3,
  Rotate3D,
  StepBack,
  Orbit,
  Maximize2,
  Minimize2,
  Scale,
  Trophy,
  Flag,
  RotateCcw,
  Shield,
  Swords,
  X,
} from "lucide-react";
import type { Chess, Move, Square } from "chess.js";
import type { Lesson } from "../lib/lessons";
import Board from "./board";
import { createReplay, replayDuration, type MoveReplay } from "../lib/move-replay";
import { materialBalance } from "../lib/material";
import { readAngle, defaultAngle, limitAngle, angleLimit, type BoardAngle } from "../lib/board-angle";

export function Mark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" className="brandmark">
      <path
        d="M6 33h26v3H6zm1-4 4-9 6-5-5 2-3 4-5-4 7-10 6-1 1-5 5 5 4-2c7 7 7 16 3 25Z"
        fill="currentColor"
      />
      <path d="m13 11 4-1-2 3z" fill="#18161d" />
      <path d="m19 7 3 3" stroke="#18161d" strokeWidth="1.8" />
    </svg>
  );
}
export function ModeChip({ lesson }: { lesson: Lesson }) {
  const Icon = lesson.mode === "Attack" ? Swords : Shield;
  return (
    <span className={"modeChip " + lesson.mode.toLowerCase()}>
      <Icon size={12} />
      {lesson.mode}
    </span>
  );
}
export function Tile({
  lesson,
  n,
  done,
  current,
  onClick,
}: {
  lesson: Lesson;
  n: number;
  done: boolean;
  current: boolean;
  onClick: () => void;
}) {
  const art = lesson.id === "scholars-mate" ? "wq" : lesson.art;
  return (
    <button
      className={"lessonTile " + (current ? "current" : "")}
      onClick={onClick}
    >
      <span className={"tileThumb " + lesson.tone}>
        <span className="smallGrid" />
        <img alt="" src={"/pieces/" + art + ".webp"} />
      </span>
      <span className="tileText">
        <span className="tileKicker">
          {done ? (
            <>
              <Check size={11} /> SOLVED
            </>
          ) : (
            <>LESSON {String(n + 1).padStart(2, "0")}</>
          )}
        </span>
        <strong>{lesson.title}</strong>
        <span className="tileMeta">
          {lesson.mode}
          <i /> {lesson.trap ? lesson.trap.length + "-move trap" : lesson.motif}
        </span>
      </span>
      <ChevronRight size={16} className="tileArrow" />
    </button>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
}) {
  const el = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const n = el.current;
    n?.showModal();
    return () => n?.close();
  }, []);
  return (
    <dialog
      ref={el}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="dialog"
    >
      <div className="modalContent">
        <div className="row spread">
          <h2>{title}</h2>
          <button className="iconBtn" onClick={close} aria-label="Close">
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export type PanelProps = {
  game: Chess;
  selected: Square | null;
  targets: Square[];
  last: Move | null;
  replayBlocked?: boolean;
  onReplay?: () => void;
  outcome?: { kind: "win" | "loss" | "draw"; text: string };
  onPick: (sq: Square) => void;
  disabled: boolean;
  orientation: "w" | "b";
  label: string;
  reset: () => void;
  message: string;
  viewKey: string;
  check?: boolean;
  accent?: boolean;
};
export function BoardPanel({
  game,
  selected,
  targets,
  last, replayBlocked, onReplay, outcome,
  onPick,
  disabled,
  orientation,
  label,
  reset,
  message,
  viewKey,
  check,
  accent,
}: PanelProps) {
  const [flat, setFlat] = useState(false),
    [flip, setFlip] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!expanded) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", escape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", escape);
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);
  const [angle, setAngle] = useState(defaultAngle), [angleOpen, setAngleOpen] = useState(false);
  const [motion, setMotion] = useState<{ game: Chess; viewKey: string; clip: MoveReplay } | null>(null);
  const fen = game.fen();
  const previous = useRef({fen, viewKey});
  const active = motion?.game === game && motion.viewKey === viewKey ? motion.clip : null;
  const startMotion = useCallback((move: Move, slow: boolean) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMotion({ game, viewKey, clip: createReplay(move, reduced, slow) });
  }, [game, viewKey]);
  useEffect(() => {
    const prev = previous.current;
    previous.current = { fen, viewKey };
    if (last && prev.viewKey === viewKey && prev.fen !== fen && prev.fen === last.before)
      startMotion(last, false);
  }, [fen, viewKey, last, startMotion]);
  useEffect(() => {
    if (!motion) return;
    const timer = setTimeout(() => setMotion(null), motion.clip.slow ? replayDuration : 845);
    return () => clearTimeout(timer);
  }, [motion]);
  useEffect(() => { setAngle(readAngle()); }, []);
  const changeAngle = useCallback((next: BoardAngle) => {
    setAngle(next);
    try { localStorage.setItem("knightfall:angle", JSON.stringify(next)); } catch {}
  }, []);
  const score = materialBalance(game, orientation);
  const ResultIcon = outcome?.kind === "win" ? Trophy : Flag;
  useEffect(() => {
    setFlip(false);
  }, [viewKey, orientation]);
  useEffect(() => {
    try {
      setFlat(localStorage.getItem("knightfall:board") === "2d");
    } catch {}
  }, []);
  function view(flat: boolean) {
    setFlat(flat);
    try {
      localStorage.setItem("knightfall:board", flat ? "2d" : "3d");
    } catch {}
  }
  return (
    <section className={"boardPanel" + (expanded ? " expandedBoard" : "")} aria-label="Chessboard">
      <div className="boardToolbar">
        <div className="turnGroup">
          <span
            className={"turnDot " + (game.turn() === "w" ? "white" : "black")}
          />
          <strong>{label}</strong>
          {check && <span className="checkTag">Check</span>}
        </div>
        <div className="boardDisplayTools">
          <button className="focusBoard" aria-pressed={expanded} title={expanded ? "Exit focus view" : "Focus on board"} aria-label={expanded ? "Exit focus view" : "Focus on board"} onClick={() => setExpanded(!expanded)}>
            {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        {!flat && <div className="cameraControl">
          <button className="cameraButton" aria-expanded={angleOpen} onClick={() => setAngleOpen(!angleOpen)} title="Adjust board angle"><Orbit size={14} /> Angle</button>
          {angleOpen && <div className="cameraMenu">
            <strong>Board angle</strong><p>Drag the board to rotate and tilt.</p>
            {(["rotation", "tilt"] as const).map(axis => <label key={axis}>{axis === "rotation" ? "Rotation" : "Tilt"} <output>{angle[axis]}°</output>
              <input aria-label={axis === "rotation" ? "Board rotation" : "Board tilt"} type="range" min={angleLimit[axis][0]} max={angleLimit[axis][1]} value={angle[axis]} onChange={e => changeAngle(limitAngle(axis === "rotation" ? +e.target.value : angle.rotation, axis === "tilt" ? +e.target.value : angle.tilt))} />
            </label>)}
            <div className="row spread"><button onClick={() => changeAngle(defaultAngle)}>Reset angle</button><button onClick={() => setAngleOpen(false)}>Done</button></div>
          </div>}
        </div>}
        <div className="viewSwitch" aria-label="Board view">
          <button
            onClick={() => view(false)}
            aria-pressed={!flat}
            className={!flat ? "on" : ""}
          >
            <Box size={14} />
            3D
          </button>
          <button
            onClick={() => view(true)}
            aria-pressed={flat}
            className={flat ? "on" : ""}
          >
            <Grid2X2 size={13} />
            2D
          </button>
        </div>
      </div>
      </div>
      <div className="matchStrip">
        <span className="materialReadout" aria-live="polite" title="Material from your side. Pawn 1, knight or bishop 3, rook 5, queen 9.">
          <Scale size={14} />{score ? <><b>{score > 0 ? "+" : "−"}{Math.abs(score)}</b> material · You’re {score > 0 ? "up" : "down"} {Math.abs(score)} {Math.abs(score) === 1 ? "point" : "points"}</> : "Material even"}
        </span>
      </div>
      <div className={"boardStage " + (flat ? "flat" : "")}>
        <span className="stageTicks tl" />
        <span className="stageTicks tr" />
        <span className="stageTicks bl" />
        <span className="stageTicks br" />
        <Board
          game={game}
          selected={active ? null : selected}
          targets={active ? [] : targets}
          flat={flat}
          flipped={(orientation === "b") !== flip}
          onPick={onPick}
          disabled={disabled || !!active}
          replay={active}
          angle={angle}
          onAngle={changeAngle}
          last={last ? last.from + last.to : null}
        />
      </div>
      {outcome && !active && <div className={"matchResult " + outcome.kind} role="status">
        <ResultIcon size={21} /><strong>{outcome.text}</strong>
      </div>}
      <div className="boardFooter">
        <span
          className={"boardMessage " + (accent ? "accent" : "")}
          aria-live="polite"
        >
          {accent ? <CircleCheck size={14} /> : <Crosshair size={14} />}{" "}
          {active ? active.description : message}
        </span>
        <div className="boardTools">
          <button className="replayButton" aria-label="Replay last move" title="Replay last move" disabled={!last || replayBlocked} onClick={() => {
            if (last) { onReplay?.(); startMotion(last, true); }
          }}><StepBack size={15} /><span>Replay<span className="longLabel"> last move</span></span></button>
          <span className="vline" />
          <button
            onClick={() => setFlip((f) => !f)}
            title="Flip board"
            aria-label="Flip board"
          >
            <Rotate3D size={16} />
            <span>Flip</span>
          </button>
          <span className="vline" />
          <button
            onClick={reset}
            title="Reset position"
            aria-label="Reset position"
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </section>
  );
}
export function SectionHead({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="sectionHead">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function LibraryButton({ go }: { go: () => void }) {
  return (
    <button className="outlineBtn libraryBtn" onClick={go}>
      <Layers3 size={16} />
      Lesson library
      <ChevronRight size={14} />
    </button>
  );
}
