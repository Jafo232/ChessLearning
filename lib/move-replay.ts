import { Chess, type Move, type PieceSymbol, type Square } from "chess.js";

export const pieceNames: Record<PieceSymbol, string> = {
  k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn",
};

export const replayDuration = 2750;

export function createReplay(move: Move, reducedMotion: boolean, slow = true) {
  const castle = move.isKingsideCastle() || move.isQueensideCastle();
  const rank = move.from[1];
  const rookFrom = castle ? ((move.isKingsideCastle() ? "h" : "a") + rank) as Square : null;
  const rookTo = castle ? ((move.isKingsideCastle() ? "f" : "d") + rank) as Square : null;
  const captured = move.isEnPassant() ? (move.to[0] + rank) as Square : move.captured ? move.to : null;
  const side = move.color === "w" ? "White" : "Black";
  const action = castle ? "castles" : pieceNames[move.piece];
  const ending = move.promotion ? ", promotes to " + pieceNames[move.promotion] :
    move.isEnPassant() ? ", en passant" : "";
  return {
    before: new Chess(move.before), move, rookFrom, rookTo, captured,
    description: side + " " + action + " · " + move.from + " → " + move.to + ending,
    startedAt: performance.now(), reducedMotion, slow,
  };
}

export type MoveReplay = ReturnType<typeof createReplay>;

export function replayFraction(elapsed: number, reducedMotion: boolean, slow = true) {
  if (reducedMotion) return elapsed < (slow ? 1200 : 160) ? 0 : 1;
  const t = Math.max(0, Math.min(1, (elapsed - (slow ? 600 : 70)) / (slow ? 1350 : 740)));
  return t * t * (3 - 2 * t);
}
