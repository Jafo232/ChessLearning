"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Crosshair,
  Eye,
  Gamepad2,
  Layers3,
  Lightbulb,
  Pause,
  Play as PlayIcon,
  ScanEye,
  Shield,
  Swords,
  Target,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { lessons, isSolved, matchingPaths, type Lesson } from "../lib/lessons";
import {
  mergeRecords,
  readLocal,
  type Records,
  type RecordEntry,
} from "../lib/progress";
import {
  BoardPanel,
  LibraryButton,
  Mark,
  Modal,
  ModeChip,
  SectionHead,
  Tile,
} from "./ui";
import Play from "./play";
import { playCue, type SoundCue } from "../lib/chess-sound";
type Tab = "train" | "library" | "play" | "progress";
type Filter = "All" | "Opening traps" | "Attack" | "Defense";
const emptyPath: string[] = [];
const tabs: { id: Tab; name: string; icon: typeof Target }[] = [
  { id: "train", name: "Trainer", icon: Crosshair },
  { id: "play", name: "Play chess", icon: Gamepad2 },
  { id: "library", name: "Library", icon: BookOpen },
  { id: "progress", name: "Progress", icon: BarChart3 },
];
const num = (i: number) => String(i).padStart(2, "0");
const reviewNote: Record<string, Record<number, string>> = {
  "scholars-mate": {
    3: "The bishop on c4 points at f7.",
    5: "The queen joins the bishop’s attack on f7.",
    6: "Black attacks the queen with a knight and leaves f7 exposed.",
    7: "The bishop protects the queen on f7. The black king has no escape.",
  },
  "fools-mate": {
    1: "Moving the f-pawn exposes the diagonal to the king.",
    3: "The g-pawn has advanced too far to block a queen check on h4.",
    4: "The queen checks along h4–e1. White cannot interpose or escape.",
  },
  "legals-mate": {
    9: "White offers the queen as bait.",
    10: "Black takes the queen and leaves the king vulnerable.",
    11: "The bishop takes f7 with check, drawing the king out.",
    13: "The knights and bishop cover every escape.",
  },
  "shilling-trap": {
    6: "Black offers the e5 pawn as bait.",
    7: "White takes the pawn and leaves the knight on d4.",
    8: "The queen attacks both e5 and g2.",
    10: "The queen invades g2.",
    14: "The knight mates on f3. White’s bishop is pinned to its king.",
  },
};
function filtered(l: Lesson, f: Filter) {
  return f === "All" || (f === "Opening traps" ? !!l.trap : l.mode === f);
}
const freshFeedback = { text: "", success: false };
export default function Trainer({ player }: { player: string }) {
  const key = "knightfall:progress:" + player;
  const [tab, setTab] = useState<Tab>("train"),
    [index, setIndex] = useState(0),
    [records, setRecords] = useState<Records>({}),
    [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<Filter>("All"),
    [sound, setSound] = useState(true),
    [help, setHelp] = useState(false);
  const [sel, setSel] = useState<Square | null>(null),
    [hint, setHint] = useState(0),
    [fb, setFb] = useState(freshFeedback);
  const [study, setStudy] = useState<"trap" | "solution" | null>(null),
    [ply, setPly] = useState(0),
    [auto, setAuto] = useState(false),
    [quiz, setQuiz] = useState<"off" | "ask" | "solved">("off");
  const [replyView, setReplyView] = useState<string[] | null>(null),
    [sync, setSync] = useState(""),
    [localFailed, setLocalFailed] = useState(false);
  const dataRef = useRef<Records>({}),
    known = useRef<Records>({}),
    soundFlag = useRef(true),
    replyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    boot = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const tone = useCallback((cue: SoundCue = "move") => {
    if (!soundFlag.current) return;
    try {
      const ctx = audio.current || (audio.current = new AudioContext());
      void ctx.resume().then(() => { if (soundFlag.current) playCue(ctx, cue); }).catch(() => {});
    } catch {}
  }, []);
  useEffect(() => {
    const unlock = () => {
      if (!soundFlag.current) return;
      try {
        const ctx = audio.current || (audio.current = new AudioContext());
        if (ctx.state === "suspended") void ctx.resume().catch(() => {});
      } catch {}
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
  function persist(next: Records) {
    dataRef.current = next;
    setRecords(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setLocalFailed(false);
    } catch {
      setLocalFailed(true);
    }
  }
  const flush = useCallback(async () => {
    if (!boot.current || player === "local") return;
    const pending = Object.values(dataRef.current).filter((r) => {
      const old = known.current[r.lesson];
      return (
        !old || r.updatedAt > old.updatedAt || (r.completed && !old.completed)
      );
    });
    if (!pending.length) return;
    setSync("Saving…");
    const result = await Promise.allSettled(
      pending.map(async (r) => {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(r),
        });
        if (!res.ok) throw Error();
        known.current = mergeRecords(known.current, [r]);
      }),
    );
    setSync(
      result.some((x) => x.status === "rejected")
        ? "Device saved · sync pending"
        : "Progress saved",
    );
  }, [player]);
  useEffect(() => {
    let ignore = false;
    boot.current = false;
    const local = readLocal(key);
    dataRef.current = local;
    setRecords(local);
    let last = Object.values(local).sort(
      (a, b) => b.updatedAt - a.updatedAt,
    )[0];
    if (last) setIndex(lessons.findIndex((l) => l.id === last.lesson));
    try {
      const on = localStorage.getItem("knightfall:sound") !== "off";
      soundFlag.current = on;
      setSound(on);
    } catch {}
    const route = () => {
      const target = window.location.hash.slice(1) as Tab;
      if (tabs.some((t) => t.id === target)) setTab(target);
      else setTab("train");
    };
    route();
    window.addEventListener("hashchange", route);
    fetch("/api/progress", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json() as Promise<{ records?: unknown[]; local?: boolean }>;
      })
      .then((data) => {
        if (ignore) return;
        known.current = mergeRecords({}, data.records || []);
        const merged = mergeRecords(
          dataRef.current,
          Object.values(known.current),
        );
        persist(merged);
        last = Object.values(merged).sort(
          (a, b) => b.updatedAt - a.updatedAt,
        )[0];
        if (last) setIndex(lessons.findIndex((l) => l.id === last.lesson));
        setSync(data.local ? "Saved on this device" : "Progress saved");
      })
      .catch(() => {
        if (!ignore) setSync("Device saved · sync pending");
      })
      .finally(() => {
        if (!ignore) {
          boot.current = true;
          setReady(true);
          void flush();
        }
      });
    window.addEventListener("online", flush);
    const t = setInterval(flush, 20000);
    return () => {
      ignore = true;
      clearInterval(t);
      window.removeEventListener("online", flush);
      window.removeEventListener("hashchange", route);
      clearTimeout(replyTimer.current);
    };
  }, [key, flush]);
  const lesson = lessons[index],
    record = records[lesson.id],
    path = record?.path || emptyPath,
    solved = isSolved(lesson, path),
    totalDone = Object.values(records).filter((r) => r.completed).length;
  const step = Math.min(lesson.tasks.length - 1, Math.floor(path.length / 2)),
    side = lesson.fen.split(" ")[1] as "w" | "b";
  const studyLine =
    (study === "trap" ? lesson.trap?.line : lesson.paths[0]) || emptyPath;
  const boardPath = replyView ?? path;
  const game = useMemo(() => {
    const g = study === "trap" ? new Chess() : new Chess(lesson.fen);
    for (const m of study ? studyLine.slice(0, ply) : boardPath) g.move(m);
    return g;
  }, [study, studyLine, ply, boardPath, lesson]);
  const targets = useMemo(
    () =>
      sel ? game.moves({ square: sel, verbose: true }).map((m) => m.to) : [],
    [sel, game],
  );
  const last = useMemo(() => game.history({ verbose: true }).at(-1) || null, [game]);
  useEffect(() => {
    if (!auto || !study) return;
    if (ply >= studyLine.length) {
      setAuto(false);
      return;
    }
    const timer = setTimeout(() => {
      setPly((p) => p + 1);
      tone();
    }, 2050);
    return () => clearTimeout(timer);
  }, [auto, study, ply, studyLine, tone]);
  function save(i: number, moves: string[], complete = false) {
    const l = lessons[i],
      prev = dataRef.current[l.id];
    const r: RecordEntry = {
      lesson: l.id,
      path: moves,
      completed: complete || prev?.completed || false,
      updatedAt: Math.max(Date.now(), (prev?.updatedAt || 0) + 1),
    };
    persist({ ...dataRef.current, [l.id]: r });
    void flush();
  }
  function clear() {
    clearTimeout(replyTimer.current);
    setReplyView(null);
    setSel(null);
    setHint(0);
    setFb(freshFeedback);
    setStudy(null);
    setAuto(false);
    setPly(0);
    setQuiz("off");
  }
  function nav(t: Tab) {
    clear();
    setTab(t);
    if (typeof window !== "undefined") {
      window.location.hash = t;
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }
  function open(i: number) {
    clear();
    setIndex(i);
    nav("train");
    save(i, dataRef.current[lessons[i].id]?.path || []);
  }
  function reset() {
    clear();
    save(index, []);
  }
  function toggleSound() {
    const on = !sound;
    soundFlag.current = on;
    setSound(on);
    try {
      localStorage.setItem("knightfall:sound", on ? "on" : "off");
    } catch {}
    if (on) tone();
  }
  function replay(kind: "trap" | "solution") {
    clear();
    setStudy(kind);
    setPly(0);
  }
  function pick(square: Square) {
    if (study || replyView || !ready) return;
    if (quiz === "ask") {
      const correct = square === lesson.trap?.target;
      setFb({
        text: correct
          ? "Threat identified on " + square + "."
          : "Look again. Trace the attacking pieces’ lines.",
        success: correct,
      });
      if (correct) {
        setQuiz("solved");
        tone();
      }
      return;
    }
    if (solved) return;
    if (sel === square) {
      setSel(null);
      return;
    }
    if (game.get(square)?.color === game.turn()) {
      setSel(square);
      setFb(freshFeedback);
      return;
    }
    if (!sel) {
      setFb({ text: "Select one of your pieces first.", success: false });
      return;
    }
    if (!targets.includes(square)) {
      setFb({
        text: "That move isn’t legal. Choose a highlighted square.",
        success: false,
      });
      return;
    }
    const move = sel + square,
      line = matchingPaths(lesson, path).find((l) => l[path.length] === move);
    if (!line) {
      setFb({
        text: "Legal move, but it misses this objective. Try again.",
        success: false,
      });
      setSel(null);
      return;
    }
    const half = [...path, move];
    setSel(null);
    setHint(0);
    setQuiz("off");
    const reply = line[half.length];
    if (reply) {
      tone();
      const end = [...half, reply];
      save(index, end);
      setReplyView(half);
      setFb({ text: "Good move. Watch the reply.", success: true });
      replyTimer.current = setTimeout(() => {
        setReplyView(null);
        setFb({ text: "Your turn. Find the follow-up.", success: true });
        tone();
      }, 1400);
    } else {
      tone("win");
      save(index, half, true);
      setFb({ text: "Lesson complete", success: true });
    }
  }
  const renderTile = (l: Lesson, showCurrent = true) => {
    const i = lessons.indexOf(l);
    return (
      <Tile
        key={l.id}
        lesson={l}
        n={i}
        done={!!records[l.id]?.completed}
        current={showCurrent && i === index}
        onClick={() => open(i)}
      />
    );
  };
  const notation =
    study && last
      ? (last.color === "w"
          ? Math.ceil(ply / 2) + ". "
          : Math.ceil(ply / 2) + "… ") + last.san
      : "Starting position";
  const review =
    study === "trap"
      ? reviewNote[
          lesson.id === "play-scholars-mate" ? "scholars-mate" : lesson.id
        ]?.[ply] ||
        (ply === 0
          ? "Step through the opening to see how the trap develops."
          : last?.color === "w"
            ? "White has moved. Follow the pressure around the king."
            : "Black has moved. Check which lines have opened.")
      : ply === studyLine.length
        ? lesson.takeaway
        : ply === 0
          ? "Step through the solution, then return to practice."
          : "Follow the line on the board.";
  const defaultMessage =
    quiz === "ask"
      ? "Click the square named by the clue"
      : quiz === "solved"
        ? "Threat identified on " + lesson.trap?.target
        : sel
          ? "Choose a highlighted square"
          : "Select a piece to see its moves";
  return (
    <>
      <header className="siteHeader">
        <div className="headerWrap">
          <a
            className="brand"
            href="#train"
            onClick={(e) => {
              e.preventDefault();
              nav("train");
            }}
          >
            <Mark />
            <span>Knightfall</span>
          </a>
          <nav aria-label="Main navigation">
            {tabs.map((t) => (
              <button
                key={t.id}
                aria-current={tab === t.id ? "page" : undefined}
                className={tab === t.id ? "active" : ""}
                onClick={() => nav(t.id)}
              >
                <t.icon size={16} />
                <span>{t.name}</span>
              </button>
            ))}
          </nav>
          <div className="headerEnd">
            <button
              onClick={toggleSound}
              className="iconBtn"
              aria-label={sound ? "Mute sound" : "Enable sound"}
              aria-pressed={sound}
              title={sound ? "Mute sound" : "Enable sound"}
            >
              {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
            </button>
            <span className="vline" />
            <button
              className="helpBtn"
              onClick={() => setHelp(true)}
              aria-label="How to play"
            >
              <CircleHelp size={18} />
            </button>
          </div>
        </div>
      </header>
      <main>
        {tab === "train" && (
          <>
            <SectionHead
              title="Tactics trainer"
              description="Recognize opening traps and learn the moves that stop them."
            >
              <LibraryButton go={() => nav("library")} />
            </SectionHead>
            <div className="workspace">
              <BoardPanel
                game={game}
                selected={sel}
                targets={targets}
                last={last}
                replayBlocked={!ready || !!replyView}
                onReplay={() => setAuto(false)}
                onPick={pick}
                disabled={
                  !!study || !ready || !!replyView || (solved && quiz !== "ask")
                }
                orientation={side}
                label={
                  study
                    ? "Replay · " +
                      (game.turn() === "w" ? "White" : "Black") +
                      " to move"
                    : solved
                      ? "Position solved"
                      : (game.turn() === "w" ? "White" : "Black") + " to move"
                }
                viewKey={lesson.id}
                check={!study && !solved && game.isCheck()}
                reset={reset}
                message={
                  study
                    ? ply
                      ? notation
                      : "Replay from the starting position"
                    : fb.text || defaultMessage
                }
                accent={!study && fb.success}
              />
              <aside className="brief">
                <div className="row spread briefTop">
                  <span className="eyebrow">
                    <span className="tinyDash" />
                    LESSON {num(index + 1)} <em>/ {num(lessons.length)}</em>
                  </span>
                  <div className="lessonArrows">
                    <button
                      onClick={() =>
                        open((index + lessons.length - 1) % lessons.length)
                      }
                      aria-label="Previous lesson"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <button
                      onClick={() => open((index + 1) % lessons.length)}
                      aria-label="Next lesson"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
                <div className="chips">
                  <ModeChip lesson={lesson} />
                  <span className="levelChip">
                    <i className="bars">
                      <b />
                      <b />
                      <b />
                    </i>
                    {lesson.level}
                  </span>
                </div>
                <h2>{lesson.title}</h2>
                <p className="briefIntro">{lesson.intro}</p>
                {study ? (
                  <>
                    <div className="objective">
                      <span className="eyebrow">
                        <PlayIcon size={14} />
                        {study === "trap" ? "TRAP REPLAY" : "SOLUTION"}
                      </span>
                      <strong>{notation}</strong>
                      <p>{review}</p>
                    </div>
                    <div className="transport">
                      <button
                        aria-label="Previous replay move"
                        disabled={!ply}
                        onClick={() => {
                          setAuto(false);
                          setPly((p) => p - 1);
                        }}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() =>
                          setAuto((v) => {
                            if (ply === studyLine.length) setPly(0);
                            return !v;
                          })
                        }
                      >
                        {auto ? <Pause size={15} /> : <PlayIcon size={15} />}{" "}
                        {auto ? "Pause" : "Play"}
                      </button>
                      <button
                        aria-label="Next replay move"
                        disabled={ply >= studyLine.length}
                        onClick={() => {
                          setAuto(false);
                          setPly((p) => p + 1);
                        }}
                      >
                        <ChevronRight size={18} />
                      </button>
                      <span>
                        {ply} / {studyLine.length}
                      </span>
                    </div>
                    <button className="primaryBtn" onClick={() => clear()}>
                      <ArrowLeft size={16} />
                      Return to practice
                    </button>
                  </>
                ) : solved ? (
                  <>
                    <div className="objective success">
                      <span className="eyebrow">
                        <Trophy size={15} />
                        LESSON COMPLETE
                      </span>
                      <p>{lesson.takeaway}</p>
                    </div>
                    <button
                      className="primaryBtn"
                      onClick={() => open((index + 1) % lessons.length)}
                    >
                      Next lesson
                      <ArrowRight size={16} />
                    </button>
                    <button className="outlineBtn full" onClick={reset}>
                      Practice again
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      className={
                        "objective " + (quiz !== "off" ? "recognition" : "")
                      }
                    >
                      <span className="eyebrow">
                        {quiz === "off" ? (
                          <Crosshair size={14} />
                        ) : (
                          <ScanEye size={15} />
                        )}{" "}
                        {quiz === "ask"
                          ? "SPOT THE THREAT"
                          : quiz === "solved"
                            ? "THREAT IDENTIFIED"
                            : "YOUR OBJECTIVE"}
                      </span>
                      <p aria-live="polite">
                        {quiz === "ask"
                          ? lesson.trap?.question
                          : quiz === "solved"
                            ? lesson.trap?.recognition
                            : lesson.tasks[step]}
                      </p>
                      {quiz !== "off" ? (
                        <button
                          className="textBtn"
                          onClick={() => {
                            setQuiz("off");
                            setFb(freshFeedback);
                          }}
                        >
                          {lesson.mode === "Defense"
                            ? "Play the defense"
                            : "Play the attack"}{" "}
                          <ArrowRight size={12} />
                        </button>
                      ) : (
                        lesson.trap &&
                        path.length === 0 && (
                          <button
                            className="textBtn"
                            onClick={() => {
                              setQuiz("ask");
                              setFb(freshFeedback);
                              setSel(null);
                            }}
                          >
                            Spot the threat <ChevronRight size={12} />
                          </button>
                        )
                      )}
                    </div>
                    {hint > 0 && (
                      <div className="hintText" aria-live="polite">
                        <Lightbulb size={15} />
                        <span>{lesson.hints[step][hint - 1]}</span>
                      </div>
                    )}
                    <div className="briefActions">
                      <button
                        className="primaryBtn"
                        disabled={!!replyView}
                        onClick={() => {
                          if (hint >= lesson.hints[step].length)
                            replay("solution");
                          else {
                            setQuiz("off");
                            setHint((h) => h + 1);
                            setFb(freshFeedback);
                          }
                        }}
                      >
                        {hint >= lesson.hints[step].length ? (
                          <Eye size={16} />
                        ) : (
                          <Lightbulb size={16} />
                        )}{" "}
                        {hint >= lesson.hints[step].length
                          ? "View solution"
                          : hint
                            ? "Next hint"
                            : "Show hint"}
                      </button>
                      <button
                        className="outlineBtn full"
                        onClick={() =>
                          replay(lesson.trap ? "trap" : "solution")
                        }
                      >
                        <PlayIcon size={15} />
                        {lesson.trap ? "Watch the trap" : "Watch solution"}
                      </button>
                    </div>
                  </>
                )}
                <div className="lessonFoot">
                  <div className="row spread">
                    <span>Lesson progress</span>
                    <span className="mono">
                      {solved ? lesson.tasks.length : step} /{" "}
                      {lesson.tasks.length} moves
                    </span>
                  </div>
                  <div className="stepsBar">
                    {lesson.tasks.map((_, i) => (
                      <i
                        key={i}
                        className={solved || i < step ? "filled" : ""}
                      />
                    ))}
                  </div>
                </div>
              </aside>
            </div>
            <section className="shelf">
              <div className="shelfHead">
                <div className="row">
                  <span className="sectionIcon">
                    <Layers3 size={18} />
                  </span>
                  <h2>Opening traps</h2>
                </div>
                <button
                  className="viewAll"
                  onClick={() => {
                    setFilter("Opening traps");
                    nav("library");
                  }}
                >
                  View all <ArrowRight size={14} />
                </button>
              </div>
              <div className="tileGrid">
                {lessons.slice(0, 3).map((l) => renderTile(l))}
              </div>
            </section>
          </>
        )}
        {tab === "library" && (
          <>
            <SectionHead
              title="Lesson library"
              description="Choose an opening trap or a tactical pattern to practice."
            />
            <div className="filters">
              {(["All", "Opening traps", "Attack", "Defense"] as Filter[]).map(
                (f) => (
                  <button
                    key={f}
                    className={filter === f ? "active" : ""}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                    <span>{lessons.filter((l) => filtered(l, f)).length}</span>
                  </button>
                ),
              )}
            </div>
            <div className="tileGrid fullLibrary">
              {lessons
                .filter((l) => filtered(l, filter))
                .map((l) => renderTile(l, false))}
            </div>
          </>
        )}
        {tab === "progress" && (
          <>
            <SectionHead
              title="Your progress"
              description="Review completed lessons and pick up where you left off."
            />
            <div className="stats">
              {[
                {
                  label: "Lessons solved",
                  count: totalDone,
                  all: lessons.length,
                  icon: Trophy,
                },
                {
                  label: "Opening traps",
                  count: lessons.filter(
                    (l) => l.trap && records[l.id]?.completed,
                  ).length,
                  all: lessons.filter((l) => l.trap).length,
                  icon: Shield,
                },
                {
                  label: "Attacking tactics",
                  count: lessons.filter(
                    (l) => l.mode === "Attack" && records[l.id]?.completed,
                  ).length,
                  all: lessons.filter((l) => l.mode === "Attack").length,
                  icon: Swords,
                },
              ].map((k) => (
                <div key={k.label}>
                  <k.icon size={20} />
                  <strong>
                    {k.count}
                    <em> / {k.all}</em>
                  </strong>
                  <span>{k.label}</span>
                </div>
              ))}
            </div>
            <div className="shelfHead">
              <h2>Lesson progress</h2>
              <span className="savedText">
                <CheckCheck size={14} />
                {localFailed
                  ? "Device storage unavailable"
                  : sync || "Loading progress…"}
              </span>
            </div>
            <div className="progressList">
              {lessons.map((l, i) => (
                <button key={l.id} onClick={() => open(i)}>
                  <span className="progressNumber">{num(i + 1)}</span>
                  <strong>{l.title}</strong>
                  <ModeChip lesson={l} />
                  <span className="progStatus">
                    {records[l.id]?.completed
                      ? "Completed"
                      : records[l.id]?.path.length
                        ? "In progress"
                        : "Unsolved"}
                  </span>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          </>
        )}
        {tab === "play" && <Play player={player} tone={tone} />}
      </main>
      {help && (
        <Modal title="How to play" close={() => setHelp(false)}>
          <p>
            Choose a piece, then a highlighted square to move it. On a keyboard,
            focus the board, use the arrow keys to choose a square, and press
            Enter to select or move.
          </p>
          <h3>Practice a trap</h3>
          <p>
            Use <b>Watch the trap</b> to replay the mating line. Choose{" "}
            <b>Spot the threat</b> to identify its key square, then play the
            defense. Hints reveal one clue at a time.
          </p>
          <h3>Play a full game</h3>
          <p>
            Open <b>Play chess</b> and set the difficulty slider. Use{" "}
            <b>New game</b> to choose your color. Your current game and lesson
            progress save automatically.
          </p>
          <button className="primaryBtn" onClick={() => setHelp(false)}>
            Got it
            <Check size={16} />
          </button>
        </Modal>
      )}
    </>
  );
}
