import { Chess, type Move, type PieceSymbol } from "chess.js";

const value: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 335,
  r: 505,
  q: 910,
  k: 18000,
};
const levels = [
  { depth: 1, time: 240, noise: 170 },
  { depth: 2, time: 430, noise: 65 },
  { depth: 3, time: 850, noise: 22 },
  { depth: 4, time: 1450, noise: 7 },
  { depth: 5, time: 2400, noise: 0 },
];
function evaluate(g: Chess) {
  let score = 0,
    phase = 0,
    whiteB = 0,
    blackB = 0;
  const board = g.board();
  for (const rank of board)
    for (const p of rank)
      if (p && "qrbn".includes(p.type)) phase += value[p.type];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      const p = board[y][x];
      if (!p) continue;
      const advance = p.color === "w" ? 6 - y : y - 1;
      const center = 3.5 - (Math.abs(3.5 - x) + Math.abs(3.5 - y)) / 2;
      let bonus = 0;
      if (p.type === "p")
        bonus = advance * 7 + Math.max(0, advance - 3) * 14 + center * 4;
      if (p.type === "n") bonus = center * 20 - (advance < 0 ? 15 : 0);
      if (p.type === "b") {
        bonus = center * 10 + (advance >= 0 ? 12 : 0);
        if (p.color === "w") whiteB++;
        else blackB++;
      }
      if (p.type === "r") bonus = advance * 2 + (advance === 5 ? 18 : 0);
      if (p.type === "q") bonus = center * 4;
      if (p.type === "k")
        bonus =
          phase < 1900
            ? center * 17
            : (advance === -1 && [1, 2, 6].includes(x) ? 32 : 0) -
              Math.max(0, advance) * 12;
      score += (p.color === "w" ? 1 : -1) * (value[p.type] + bonus);
    }
  score += (whiteB >= 2 ? 22 : 0) - (blackB >= 2 ? 22 : 0);
  return (g.turn() === "w" ? 1 : -1) * score;
}
const ordered = (moves: string[], first?: string) =>
  moves.sort((a, b) => priority(b, first) - priority(a, first));
const priority = (m: string, first?: string) =>
  m === first
    ? 1000
    : (m.includes("#") ? 500 : 0) +
      (m.includes("=") ? 70 : 0) +
      (m.includes("x") ? 40 : 0) +
      (m.includes("+") ? 30 : 0) +
      (m.startsWith("O-O") ? 10 : 0);
export function choose(history: string[], level: number): string | null {
  const game = new Chess();
  for (const m of history) game.move(m);
  if (game.isGameOver()) return null;
  const settings = levels[Math.max(0, Math.min(4, level - 1))],
    due = performance.now() + settings.time;
  const stop = Symbol("time");
  let nodes = 0;
  const search = (
    depth: number,
    alpha: number,
    beta: number,
    ply: number,
  ): number => {
    if ((++nodes & 15) === 0 && performance.now() > due) throw stop;
    const inCheck = game.isCheck();
    if (
      game.isInsufficientMaterial() ||
      game.isDrawByFiftyMoves() ||
      game.isThreefoldRepetition()
    )
      return 0;
    if (depth === 0 && !inCheck) return evaluate(game);
    const legal = game.moves();
    if (!legal.length) return inCheck ? -100000 + ply : 0;
    if (depth === 0) return evaluate(game) - 35;
    let high = -Infinity;
    for (const move of ordered(legal)) {
      game.move(move);
      let v: number;
      try {
        v = -search(depth - 1, -beta, -alpha, ply + 1);
      } finally {
        game.undo();
      }
      high = Math.max(high, v);
      alpha = Math.max(alpha, v);
      if (alpha >= beta) break;
    }
    return high;
  };
  let root = ordered(game.moves()),
    best = root[0];
  for (let depth = 1; depth <= settings.depth; depth++) {
    const scored: { move: string; value: number }[] = [];
    let alpha = -Infinity;
    try {
      for (const m of root) {
        if (scored.length > 0 && performance.now() > due) throw stop;
        let v: number;
        game.move(m);
        try {
          v = -search(depth - 1, -Infinity, -alpha, 1);
        } finally {
          game.undo();
        }
        const adjusted = v + (Math.random() - 0.5) * settings.noise;
        scored.push({ move: m, value: adjusted });
        alpha = Math.max(alpha, v - settings.noise);
      }
    } catch (e) {
      if (e !== stop) throw e;
      if (depth === 1 && scored.length)
        best = scored.sort((a, b) => b.value - a.value)[0].move;
      break;
    }
    scored.sort((a, b) => b.value - a.value);
    best = scored[0].move;
    root = scored.map((s) => s.move);
    if (scored[0].value > 99000 || performance.now() >= due) break;
  }
  const result: Move = game.move(best);
  return result.from + result.to + (result.promotion || "");
}
if (typeof self !== "undefined")
  self.onmessage = (
    event: MessageEvent<{ moves: string[]; level: number }>,
  ) => {
    try {
      self.postMessage({ move: choose(event.data.moves, event.data.level) });
    } catch {
      self.postMessage({ error: "Could not calculate the reply." });
    }
  };
