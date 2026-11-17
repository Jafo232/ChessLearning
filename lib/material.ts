import type { Chess, PieceSymbol } from "chess.js";
const values: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export function materialBalance(game: Chess, side: "w" | "b") {
  return game.board().flat().reduce((total, piece) =>
    total + (piece ? values[piece.type] * (piece.color === side ? 1 : -1) : 0), 0);
}
