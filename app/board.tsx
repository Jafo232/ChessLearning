"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";

import { limitAngle, type BoardAngle } from "../lib/board-angle";
import { pieceNames, replayFraction, type MoveReplay } from "../lib/move-replay";

type Point = { x: number; y: number };
type Props = {
  game: Chess;
  selected: Square | null;
  targets: Square[];
  last: string | null;
  replay: MoveReplay | null;
  angle: BoardAngle;
  onAngle: (angle: BoardAngle) => void;
  flat: boolean;
  flipped: boolean;
  onPick: (s: Square) => void;
  disabled: boolean;
};
const FILES = "abcdefgh";
type RenderPiece = { sq: Square; piece: NonNullable<ReturnType<Chess["get"]>>; center: Point; opacity: number };
type Scene = {
  draw: (w: number, h: number, vw: number, vh: number, flat: boolean, pieces: RenderPiece[], angle: BoardAngle) => void;
  hit: (x: number, y: number) => Square | undefined;
  dispose: () => void;
};
const flatSize = 512;
const tileSize = 58;
const imgCache: Record<string, HTMLImageElement> = {};
function getSprite(key: string) {
  if (!imgCache[key]) {
    const im = new Image();
    im.src = "/pieces/" + key + ".webp";
    imgCache[key] = im;
  }
  return imgCache[key];
}
function project(x: number, y: number, flip: boolean, flat: boolean, angle: BoardAngle, height: number): Point {
  x -= 4;
  y -= 4;
  if (flip) {
    x = -x;
    y = -y;
  }
  if (flat) return { x: flatSize / 2 + x * tileSize, y: flatSize / 2 + y * tileSize };
  const radians = angle.rotation * Math.PI / 180, cos = Math.cos(radians), sin = Math.sin(radians);
  const rotatedX = x * cos - y * sin,
    depth = x * sin + y * cos;
  return { x: 420 + rotatedX * 60, y: height / 2 + 18 + depth * 60 * Math.sin(angle.tilt * Math.PI / 180) };
}
function inside(p: Point, poly: Point[]) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    )
      hit = !hit;
  }
  return hit;
}
export default function Board({
  game,
  selected,
  targets,
  last,
  replay,
  angle, onAngle,
  flat,
  flipped,
  onPick,
  disabled,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null), overlay = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Scene | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const gesture = useRef<{ id: number; x: number; y: number; initial: BoardAngle; moved: boolean } | null>(null);
  const ignoreClick = useRef(false);
  const checkClock = useRef({ fen: "", when: 0 });
  const [focus, setFocus] = useState(false),
    [cursor, setCursor] = useState<Square>("e4");
  const aid = useId(),
    [size, resized] = useState(0);
  const fen = game.fen();
  const yaw = angle.rotation * Math.PI / 180, pitch = angle.tilt * Math.PI / 180;
  const viewWidth = flat ? flatSize : 840;
  const viewHeight = flat ? flatSize : Math.max(475, 2 * (4.36 * 60 * Math.sin(pitch) * (Math.abs(Math.sin(yaw)) + Math.cos(yaw)) + 42));
  const coord = useMemo(() => (x: number, y: number, flip: boolean, isFlat: boolean) =>
    project(x, y, flip, isFlat, angle, viewHeight), [angle, viewHeight]);
  const shapes = useMemo(() => {
    const result: {
      sq: Square;
      poly: Point[];
      center: Point;
      file: number;
      rank: number;
    }[] = [];
    for (let rank = 0; rank < 8; rank++)
      for (let file = 0; file < 8; file++) {
        const y = 7 - rank;
        result.push({
          sq: (FILES[file] + (rank + 1)) as Square,
          file,
          rank,
          center: coord(file + .5, 7 - rank + .5, flipped, flat),
          poly: [
            [file, y],
            [file + 1, y],
            [file + 1, y + 1],
            [file, y + 1],
          ].map(([x, y]) => coord(x, y, flipped, flat)),
        });
      }
    return result.sort((a, b) => a.center.y - b.center.y);
  }, [flipped, flat, coord]);
  useEffect(() => {
    const canvas = overlay.current;
    if (!canvas) return;
    let mounted = true;
    function lost(event: Event) {
      event.preventDefault();
      if (mounted) setEngineReady(false);
    }
    canvas.addEventListener("webglcontextlost", lost);
    import("../lib/chess-scene.js").then(module => mounted ? module.createScene(canvas) : null).then((scene: Scene | null) => {
      if (!scene) return;
      if (!mounted) { scene.dispose(); return; }
      engine.current = scene;
      setEngineReady(true);
    }).catch((err) => {
      if (mounted) {
        console.warn("Using the illustrated chessboard:", err instanceof Error ? err.message : err);
        setEngineReady(false);
      }
    });
    return () => {
      mounted = false;
      canvas.removeEventListener("webglcontextlost", lost);
      engine.current?.dispose();
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(() => resized((v) => v + 1));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const box = cv.getBoundingClientRect(),
      ratio = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = Math.max(1, Math.round(box.width * ratio));
    cv.height = Math.max(1, Math.round(box.height * ratio));
    const factor = Math.min(cv.width / viewWidth, cv.height / viewHeight);
    const ox = (cv.width - viewWidth * factor) / 2,
      oy = (cv.height - viewHeight * factor) / 2;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const checked = game.isCheck();
    if (checkClock.current.fen !== fen) checkClock.current = { fen, when: performance.now() };
    if (checked && replay) checkClock.current.when = replay.startedAt + (replay.slow ? 1950 : 810);
    let frame = 0,
      active = true;
    const loading = new Set<HTMLImageElement>();
    function scheduleDraw() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    }
    function draw() {
      if (!active || !ctx || !cv) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(factor, 0, 0, factor, ox, oy);
      const c = ctx;
      const elapsed = replay ? performance.now() - replay.startedAt : 0;
      const travel = replay ? replayFraction(elapsed, replay.reducedMotion, replay.slow) : 1;
      const position = replay && travel < 1 ? replay.before : game;
      const inCheck = position === game ? checked : position.isCheck();
      const checkAge = replay && travel === 1 ? elapsed - (replay.slow ? 1950 : 810) : performance.now() - checkClock.current.when;
      const shake = inCheck && !reduced && checkAge >= 0 && checkAge < 950 ?
        4 * Math.sin(checkAge * .048) * (1 - checkAge / 950) : 0;
      const face = (
        pts: Point[],
        color: string,
        stroke?: string,
        width = 1,
      ) => {
        c.beginPath();
        pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
        c.closePath();
        c.fillStyle = color;
        c.fill();
        if (stroke) {
          c.strokeStyle = stroke;
          c.lineWidth = width;
          c.stroke();
        }
      };
      const corners = (offset: number) =>
        [
          [-offset, -offset],
          [8 + offset, -offset],
          [8 + offset, 8 + offset],
          [-offset, 8 + offset],
        ].map(([x, y]) => coord(x, y, flipped, flat));
      const shift = (p: Point, h: number) => ({ x: p.x, y: p.y + h });
      const rim = corners(flat ? 0.32 : 0.34),
        thick = flat ? 3 : 12;
      c.save();
      c.shadowColor = "rgba(4,3,10,.82)";
      c.shadowBlur = 30 * factor;
      c.shadowOffsetY = 18 * factor;
      face(
        rim.map((p) => shift(p, thick)),
        "#191226",
      );
      c.restore();
      const ordered = [0, 1, 2, 3].sort(
        (i, j) =>
          rim[i].y + rim[(i + 1) % 4].y - (rim[j].y + rim[(j + 1) % 4].y),
      );
      for (const i of ordered) {
        const p = rim[i],
          q = rim[(i + 1) % 4];
        face(
          [p, q, shift(q, thick), shift(p, thick)],
          p.x < q.x ? "#3e354f" : "#30283e",
          "#241f30",
          0.6,
        );
      }
      face(rim, flat ? "#413846" : "#443b55", flat ? "#a393a1" : "#71647e", 0.8);
      if (flat) face(corners(0.275), "#332d39", "#645764", 0.8);
      face(corners(flat ? 0.05 : 0.095), "#292333", "#82738d", 0.7);
      for (const s of shapes) {
        const dark = (s.file + s.rank) % 2 === 0;
        const normal = flat ? (dark ? "#927b96" : "#dfd3c8") : dark
          ? s.file % 3
            ? "#806995"
            : "#826d97"
          : s.file % 3
            ? "#d5c4df"
            : "#d4c2df";
        const highlight =
          s.sq === selected
            ? "#ac92e4"
            : last?.includes(s.sq)
              ? dark
                ? "#aa96b2"
                : "#dacdec"
              : normal;
        face(s.poly, highlight, highlight, 0.7);
        if (flat) {
          const x = s.center.x - tileSize / 2, y = s.center.y - tileSize / 2;
          const glaze = c.createLinearGradient(x, y, x + tileSize * 0.6, y + tileSize);
          glaze.addColorStop(0, "#fff6e915");
          glaze.addColorStop(1, "#33243809");
          c.fillStyle = glaze;
          c.fillRect(x, y, tileSize, tileSize);
        }
        const occupant = position.get(s.sq);
        if (inCheck && occupant?.type === "k" && occupant.color === position.turn()) {
          face(s.poly, "rgba(174,43,51,.67)", "#ffb2a0", 2.3);
        }
        if (s.sq === selected || (focus && s.sq === cursor)) {
          const inner = s.poly.map((p) => ({
            x: s.center.x + (p.x - s.center.x) * 0.91,
            y: s.center.y + (p.y - s.center.y) * 0.91,
          }));
          face(inner, "rgba(166,136,255,.20)", "#efe4ff", 2);
        }
      }
      c.fillStyle = "#e2d6ec";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.font = (flat ? "10.5" : "8.5") + "px KMono,monospace";
      for (let i = 0; i < 8; i++) {
        const a = coord(i + 0.5, flipped ? -0.18 : 8.18, flipped, flat),
          b = coord(flipped ? 8.18 : -0.18, i + 0.5, flipped, flat);
        c.fillText(FILES[i].toUpperCase(), a.x, a.y);
        c.fillText(String(8 - i), b.x, b.y);
      }
      if (replay?.slow) {
        const start = shapes.find((s) => s.sq === replay.move.from)!;
        const end = shapes.find((s) => s.sq === replay.move.to)!;
        for (const tile of [start, end]) {
          const inset = tile.poly.map((p) => ({
            x: tile.center.x + (p.x - tile.center.x) * 0.90,
            y: tile.center.y + (p.y - tile.center.y) * 0.90,
          }));
          face(inset, "#ffce6b35", "#ffdc97", 2.3);
        }
        const a = start.center, b = end.center;
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        const head = { x: b.x - 9 * Math.cos(ang), y: b.y - 9 * Math.sin(ang) };
        c.save();
        c.strokeStyle = "#5c3b30";
        c.lineWidth = 5;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(head.x, head.y);
        c.stroke();
        c.lineWidth = 2.4;
        c.strokeStyle = "#ffdb96";
        c.stroke();
        face([head, ...[-0.55, 0.55].map((offset) => ({
          x: head.x - 10 * Math.cos(ang + offset),
          y: head.y - 10 * Math.sin(ang + offset),
        }))], "#ffdb96", "#5c3b30", 1);
        c.restore();
      }
      const shadow = (
        x: number,
        y: number,
        w: number,
        h: number,
        alpha: number,
      ) => {
        c.save();
        c.translate(x, y);
        c.scale(w, h);
        const gr = c.createRadialGradient(0, 0, 0, 0, 0, 1);
        gr.addColorStop(0, "rgba(21,12,32," + alpha + ")");
        gr.addColorStop(0.56, "rgba(21,12,32," + alpha * 0.64 + ")");
        gr.addColorStop(1, "rgba(21,12,32,0)");
        c.fillStyle = gr;
        c.beginPath();
        c.arc(0, 0, 1, 0, Math.PI * 2);
        c.fill();
        c.restore();
      };
      const pieces = shapes.flatMap((s) => {
        const piece = position.get(s.sq);
        if (!piece) return [];
        const to = replay && travel < 1 ?
          (s.sq === replay.move.from ? replay.move.to : s.sq === replay.rookFrom ? replay.rookTo : null) : null;
        const dest = to ? shapes.find((tile) => tile.sq === to) : null;
        const center = dest ? {
          x: s.center.x + (dest.center.x - s.center.x) * travel,
          y: s.center.y + (dest.center.y - s.center.y) * travel,
        } : s.center;
        const opacity = replay && travel < 1 && s.sq === replay.captured ?
          Math.min(1, (1 - travel) * 4) : 1;
        const drawCenter = shake && piece.type === "k" && piece.color === position.turn() ?
          { x: center.x + shake, y: center.y } : center;
        return [{ sq: s.sq, piece, center: drawCenter, opacity, moving: !!dest }];
      }).sort((a, b) => flat ? Number(a.moving) - Number(b.moving) : a.center.y - b.center.y);
      for (const { center, piece, opacity } of pieces) {
        if (flat) {
          const base = { p: 16, r: 19, n: 20.5, b: 21.5, q: 22.5, k: 24 }[piece.type];
          shadow(center.x + 1.2, center.y + base, piece.type === "p" ? 13 : 16, 3, .45 * opacity);
        } else {
          shadow(center.x + 7, center.y + 1, 24, 12, .48 * opacity);
          shadow(center.x + 2, center.y, 18, 8, .65 * opacity);
        }
      }
      for (const s of shapes) {
        if (targets.includes(s.sq)) {
          c.fillStyle = "#4e337c99";
          c.beginPath();
          c.ellipse(
            s.center.x,
            s.center.y,
            game.get(s.sq) ? 21 : 6,
            flat ? 6 : 4.2,
            0,
            0,
            Math.PI * 2,
          );
          c.fill();
          if (game.get(s.sq)) {
            c.strokeStyle = "#9b69ed";
            c.lineWidth = 3;
            c.beginPath();
            c.ellipse(
              s.center.x,
              s.center.y,
              22,
              flat ? 22 : 13,
              0,
              0,
              Math.PI * 2,
            );
            c.stroke();
          }
        }
      }
      if (engineReady && engine.current) {
        engine.current.draw(cv.width, cv.height, viewWidth, viewHeight, flat, pieces, angle);
      } else for (const { piece: p, center, opacity } of pieces) {
        c.globalAlpha = opacity;
        const key = (flat ? "flat/" : "") + p.color + p.type;
        const im = getSprite(key);
        if (!im.complete && !loading.has(im)) {
          loading.add(im);
          im.addEventListener("load", scheduleDraw, { once: true });
        }
        if (im.complete && im.naturalWidth) {
          if (flat) {
            c.drawImage(im, center.x - tileSize / 2, center.y - tileSize / 2, tileSize, tileSize);
          } else {
            const w = 75, h = 90;
            c.drawImage(im, center.x - w / 2, center.y - h * (291 / 384), w, h);
          }
          continue;
        }
      }
      c.globalAlpha = 1;
      if ((replay && travel < 1) || (inCheck && !reduced && checkAge < 950)) scheduleDraw();
    }
    draw();
    return () => {
      active = false;
      for (const im of loading) im.removeEventListener("load", scheduleDraw);
      cancelAnimationFrame(frame);
    };
  }, [
    viewWidth, viewHeight, replay, engineReady, angle, coord,
    fen,
    game,
    shapes,
    selected,
    targets,
    last,
    flat,
    flipped,
    focus,
    cursor,
    size,
  ]);
  function at(x: number, y: number) {
    const el = ref.current;
    if (!el) return;
    const b = el.getBoundingClientRect(),
      k = Math.min(b.width / viewWidth, b.height / viewHeight);
    const p = {
      x: (x - b.left - (b.width - viewWidth * k) / 2) / k,
      y: (y - b.top - (b.height - viewHeight * k) / 2) / k,
    };
    // Silhouettes extend above their tiles. Test opaque sprite pixels front to back.
    if (!flat && engineReady && engine.current) {
      const tile = shapes.find((s) => inside(p, s.poly));
      if (tile && targets.includes(tile.sq)) return tile.sq;
      return engine.current.hit((x - b.left) / b.width, (y - b.top) / b.height) || tile?.sq;
    }
    if (!flat) {
      for (const s of [...shapes].reverse()) {
        const pc = game.get(s.sq);
        if (!pc) continue;
        if (targets.includes(s.sq) && inside(p, s.poly)) return s.sq;
        const im = imgCache[pc.color + pc.type];
        if (!im?.complete || !im.naturalWidth) continue;
        const tx = (p.x - s.center.x + 37.5) / 75,
          ty = (p.y - s.center.y + 90 * (291 / 384)) / 90;
        if (tx < 0 || tx >= 1 || ty < 0 || ty >= 1) continue;
        const key = pc.color + pc.type;
        if (!alphaCache[key]) {
          const tmp = document.createElement("canvas");
          tmp.width = 80;
          tmp.height = 96;
          const c = tmp.getContext("2d");
          if (c) {
            c.drawImage(im, 0, 0, 80, 96);
            alphaCache[key] = c.getImageData(0, 0, 80, 96).data;
          }
        }
        if (
          (alphaCache[key]?.[
            4 * (Math.floor(ty * 96) * 80 + Math.floor(tx * 80)) + 3
          ] || 0) > 100
        )
          return s.sq;
      }
    }
    return shapes.find((s) => inside(p, s.poly))?.sq;
  }
  return (
    <>
      <div className={"chessCanvas surface" + (flat ? " flatCanvas" : "")} data-renderer={engineReady ? "three" : "canvas"}>
      <canvas
        ref={ref}
        tabIndex={0}
        role="group"
        aria-label="Interactive chessboard"
        aria-describedby={aid}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onPointerDown={(e) => {
          setFocus(false);
          ignoreClick.current = false;
          if (flat || e.button !== 0 || !e.isPrimary) return;
          gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, initial: angle, moved: false };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const drag = gesture.current;
          if (!drag || drag.id !== e.pointerId) return;
          const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
          if (!drag.moved && Math.hypot(dx, dy) < 6) return;
          drag.moved = true;
          ignoreClick.current = true;
          onAngle(limitAngle(drag.initial.rotation + dx * .26, drag.initial.tilt + dy * .19));
        }}
        onLostPointerCapture={() => { gesture.current = null; }}
        onPointerCancel={() => { gesture.current = null; ignoreClick.current = true; }}
        onClick={(e) => {
          if (disabled || ignoreClick.current) return;
          const sq = at(e.clientX, e.clientY);
          if (sq) {
            setFocus(false);
            setCursor(sq);
            onPick(sq);
          }
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          const dirs: Record<string, [number, number]> = {
            ArrowRight: [1, 0],
            ArrowLeft: [-1, 0],
            ArrowUp: [0, 1],
            ArrowDown: [0, -1],
          };
          if (dirs[e.key]) {
            e.preventDefault();
            setFocus(true);
            const [x, y] = dirs[e.key],
              m = flipped ? -1 : 1;
            setCursor(
              (FILES[
                Math.max(0, Math.min(7, FILES.indexOf(cursor[0]) + x * m))
              ] +
                Math.max(1, Math.min(8, Number(cursor[1]) + y * m))) as Square,
            );
          }
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setFocus(true);
            onPick(cursor);
          }
        }}
      />
      <canvas className="sceneLayer" aria-hidden="true" ref={overlay} style={{visibility: engineReady ? "visible" : "hidden"}} />
      </div>
      <span className="sr" id={aid}>
        Use arrow keys to choose a square. Press Enter to select a piece or move
        it.
      </span>
      {focus && (
        <span className="sr" aria-live="polite">
          {cursor},{" "}
          {game.get(cursor)
            ? (game.get(cursor)!.color === "w" ? "white " : "black ") +
              pieceNames[game.get(cursor)!.type]
            : "empty"}
        </span>
      )}
    </>
  );
}
const alphaCache: Record<string, Uint8ClampedArray> = {};
