"use client";
import { useEffect, useRef, useState } from "react";
import {
  Box,
  Check,
  ChevronRight,
  CircleCheck,
  Crosshair,
  Grid2X2,
  Layers3,
  Rotate3D,
  RotateCcw,
  Shield,
  Swords,
  X,
} from "lucide-react";
import type { Chess, Square } from "chess.js";
import type { Lesson } from "../lib/lessons";
import Board from "./board";

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
  last: string | null;
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
  last,
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
    <section className="boardPanel" aria-label="Chessboard">
      <div className="boardToolbar">
        <div className="turnGroup">
          <span
            className={"turnDot " + (game.turn() === "w" ? "white" : "black")}
          />
          <strong>{label}</strong>
          {check && <span className="checkTag">Check</span>}
        </div>
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
      <div className={"boardStage " + (flat ? "flat" : "")}>
        <span className="stageTicks tl" />
        <span className="stageTicks tr" />
        <span className="stageTicks bl" />
        <span className="stageTicks br" />
        <Board
          game={game}
          selected={selected}
          targets={targets}
          flat={flat}
          flipped={(orientation === "b") !== flip}
          onPick={onPick}
          disabled={disabled}
          last={last}
        />
      </div>
      <div className="boardFooter">
        <span
          className={"boardMessage " + (accent ? "accent" : "")}
          aria-live="polite"
        >
          {accent ? <CircleCheck size={14} /> : <Crosshair size={14} />}{" "}
          {message}
        </span>
        <div className="boardTools">
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
