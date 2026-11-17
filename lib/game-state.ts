import { Chess } from "chess.js";

export type GameState = {
  moves: string[];
  side: "w" | "b";
  level: number;
  updatedAt: number;
};
export function freshGame(): GameState {
  return { moves: [], side: "w", level: 3, updatedAt: 0 };
}
export function validateGame(input: unknown): input is GameState {
  if (!input || typeof input !== "object") return false;
  const s = input as GameState;
  if (
    !["w", "b"].includes(s.side) ||
    !Number.isInteger(s.level) ||
    s.level < 1 ||
    s.level > 5 ||
    !Array.isArray(s.moves) ||
    s.moves.length > 2000 ||
    !Number.isSafeInteger(s.updatedAt) ||
    s.updatedAt < 0
  )
    return false;
  try {
    const g = new Chess();
    for (const m of s.moves) {
      if (
        typeof m !== "string" ||
        !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m) ||
        g.isGameOver()
      )
        return false;
      g.move(m);
    }
    return true;
  } catch {
    return false;
  }
}
export function position(s: GameState) {
  const g = new Chess();
  for (const m of s.moves) g.move(m);
  return g;
}
