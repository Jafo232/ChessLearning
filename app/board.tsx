"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";

type Point = { x: number; y: number };
type Props = {
  game: Chess;
  selected: Square | null;
  targets: Square[];
  last: string | null;
  flat: boolean;
  flipped: boolean;
  onPick: (s: Square) => void;
  disabled: boolean;
};
const FILES = "abcdefgh";
const names: Record<string, string> = {
  k: "king",
  q: "queen",
  r: "rook",
  n: "knight",
  b: "bishop",
  p: "pawn",
};
const glyphs: Record<string, string> = {
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
  k: "♚",
};
const angle = (-20 * Math.PI) / 180;
const cos = Math.cos(angle),
  sin = Math.sin(angle);
const viewWidth = 840,
  viewHeight = 475;
const imgCache: Record<string, HTMLImageElement> = {};
function getSprite(key: string, refresh: () => void) {
  if (!imgCache[key]) {
    const im = new Image();
    im.src = "/pieces/" + key + ".webp";
    imgCache[key] = im;
  }
  const im = imgCache[key];
  if (!im.complete) im.addEventListener("load", refresh, { once: true });
  return im;
}
function coord(x: number, y: number, flip: boolean, flat: boolean): Point {
  x -= 4;
  y -= 4;
  if (flip) {
    x = -x;
    y = -y;
  }
  if (flat) return { x: viewWidth / 2 + x * 53, y: viewHeight / 2 + y * 53 };
  const rotatedX = x * cos - y * sin,
    depth = x * sin + y * cos;
  return { x: viewWidth / 2 + rotatedX * 60, y: 244 + depth * 38 };
}
function cellPoint(file: number, rank: number, flip: boolean, flat: boolean) {
  return coord(file + 0.5, 7 - rank + 0.5, flip, flat);
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
  flat,
  flipped,
  onPick,
  disabled,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [focus, setFocus] = useState(false),
    [cursor, setCursor] = useState<Square>("e4");
  const aid = useId(),
    [size, resized] = useState(0);
  const fen = game.fen();
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
          center: cellPoint(file, rank, flipped, flat),
          poly: [
            [file, y],
            [file + 1, y],
            [file + 1, y + 1],
            [file, y + 1],
          ].map(([x, y]) => coord(x, y, flipped, flat)),
        });
      }
    return result.sort((a, b) => a.center.y - b.center.y);
  }, [flipped, flat]);
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
    let frame = 0,
      active = true;
    function draw() {
      if (!active || !ctx || !cv) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(factor, 0, 0, factor, ox, oy);
      const c = ctx;
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
      const rim = corners(flat ? 0.19 : 0.34),
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
      face(rim, "#443b55", "#71647e", 0.8);
      face(corners(flat ? 0.05 : 0.095), "#292333", "#82738d", 0.7);
      for (const s of shapes) {
        const dark = (s.file + s.rank) % 2 === 0;
        const normal = dark
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
      c.font = (flat ? "7.5" : "8.5") + "px KMono,monospace";
      for (let i = 0; i < 8; i++) {
        const a = coord(i + 0.5, flipped ? -0.18 : 8.18, flipped, flat),
          b = coord(flipped ? 8.18 : -0.18, i + 0.5, flipped, flat);
        c.fillText(FILES[i].toUpperCase(), a.x, a.y);
        c.fillText(String(8 - i), b.x, b.y);
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
      if (!flat)
        for (const s of shapes)
          if (game.get(s.sq)) {
            shadow(s.center.x + 7, s.center.y + 1, 24, 12, 0.48);
            shadow(s.center.x + 2, s.center.y, 18, 8, 0.65);
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
        const p = game.get(s.sq);
        if (!p) continue;
        if (!flat) {
          const im = getSprite(p.color + p.type, () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(draw);
          });
          if (im.complete && im.naturalWidth) {
            const w = 60 * 1.25,
              h = (w * 384) / 320;
            c.drawImage(
              im,
              s.center.x - w * 0.5,
              s.center.y - h * (291 / 384),
              w,
              h,
            );
            continue;
          }
        }
        c.font = "47px DejaVu Sans, Arial Unicode MS, serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.lineWidth = p.color === "w" ? 1.75 : 1.3;
        c.strokeStyle = p.color === "w" ? "#625568" : "#b7a4c3";
        c.fillStyle = p.color === "w" ? "#fff5e3" : "#2b2635";
        c.strokeText(glyphs[p.type], s.center.x, s.center.y + 1);
        c.fillText(glyphs[p.type], s.center.x, s.center.y + 1);
      }
    }
    draw();
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [
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
      <canvas
        className="chessCanvas"
        ref={ref}
        tabIndex={0}
        role="group"
        aria-label="Interactive chessboard"
        aria-describedby={aid}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onPointerDown={() => setFocus(false)}
        onClick={(e) => {
          if (disabled) return;
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
      <span className="sr" id={aid}>
        Use arrow keys to choose a square. Press Enter to select a piece or move
        it.
      </span>
      {focus && (
        <span className="sr" aria-live="polite">
          {cursor},{" "}
          {game.get(cursor)
            ? (game.get(cursor)!.color === "w" ? "white " : "black ") +
              names[game.get(cursor)!.type]
            : "empty"}
        </span>
      )}
    </>
  );
}
const alphaCache: Record<string, Uint8ClampedArray> = {};
