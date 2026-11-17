export type Mode = "Attack" | "Defense";
export type Trap = {
  name: string;
  length: number;
  target: string;
  question: string;
  recognition: string;
  line: string[];
  setup: string[];
};
export type Lesson = {
  trap?: Trap;
  id: string;
  title: string;
  mode: Mode;
  level: string;
  motif: string;
  art: string;
  tone: string;
  fen: string;
  paths: string[][];
  intro: string;
  tasks: string[];
  hints: string[][];
  takeaway: string;
};
const tactics: Lesson[] = [
  {
    id: "royal-fork",
    title: "The royal fork",
    mode: "Attack",
    level: "Beginner",
    motif: "Double attack",
    art: "wn",
    tone: "lilac",
    fen: "rn1q3k/pp2bppp/2p5/4p1N1/2B1P3/2NP4/PPP2PPP/R1BQ1RK1 w - - 0 1",
    paths: [["g5f7", "h8g8", "f7d8"]],
    intro:
      "A knight can attack two pieces at once. Fork the king and queen to win material.",
    tasks: [
      "Find the knight move that checks the king and attacks the queen.",
      "The king has moved. Capture the queen with your knight.",
    ],
    hints: [
      [
        "Start with the knight on g5. Look for a checking capture.",
        "The pawn on f7 stands on a square one knight move from both targets.",
      ],
      ["Your knight on f7 still attacks d8.", "Capture the queen on d8."],
    ],
    takeaway:
      "The king had to answer the check, leaving the queen on d8 for your knight.",
  },
  {
    id: "scholars-mate",
    title: "Stop Scholar’s Mate",
    mode: "Defense",
    level: "Beginner",
    motif: "Opening trap",
    art: "bp",
    tone: "mint",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3",
    paths: [["g7g6", "h5f3", "g8f6"]],
    intro:
      "White’s queen and bishop both target f7. Interrupt their attack and develop a piece.",
    tasks: [
      "Block the queen’s diagonal to f7 with a pawn and attack her at the same time.",
      "The queen is aiming at f7 again. Develop a knight to block the file.",
    ],
    hints: [
      [
        "Trace the diagonal from h5 through g6 to f7.",
        "Push the g7 pawn one square.",
      ],
      [
        "Your knight on g8 can block the queen’s line from f3.",
        "Play the knight to f6.",
      ],
    ],
    takeaway:
      "The g-pawn chased the queen off the diagonal. Your knight then blocked the attack along the f-file.",
  },
  {
    id: "back-rank",
    title: "Back-rank mate",
    mode: "Attack",
    level: "Beginner",
    motif: "Checkmate",
    art: "wr",
    tone: "peach",
    fen: "6k1/pp3ppp/2p5/8/8/2P5/Pr3PPP/4R1K1 w - - 0 1",
    paths: [["e1e8"]],
    intro:
      "Three pawns have boxed in the king. Use the open file to deliver checkmate.",
    tasks: ["Find a rook move that gives the black king no escape."],
    hints: [
      [
        "The king’s own pawns occupy all three escape squares in front of it.",
        "Send your rook from e1 to the eighth rank.",
      ],
    ],
    takeaway:
      "The rook covered the eighth rank while Black’s pawns blocked the king’s escape.",
  },
  {
    id: "absolute-pin",
    title: "The absolute pin",
    mode: "Attack",
    level: "Beginner",
    motif: "Pin",
    art: "wb",
    tone: "mint",
    fen: "r1bqkb1r/ppp2ppp/2n1pn2/3p4/3PP3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 5",
    paths: [["f1b5"]],
    intro:
      "A piece shielding its king cannot leave the line of attack. Pin Black’s knight to the king.",
    tasks: ["Develop your light-squared bishop to pin the knight on c6."],
    hints: [
      [
        "The diagonal from c6 to e8 goes through an empty d7.",
        "Move the bishop from f1 to b5.",
      ],
    ],
    takeaway:
      "Moving the c6 knight would expose its own king to the bishop on b5.",
  },
  {
    id: "block-check",
    title: "Block the check",
    mode: "Defense",
    level: "Beginner",
    motif: "Interposition",
    art: "bb",
    tone: "lilac",
    fen: "4r1k1/pp3ppp/2p5/8/8/2P5/PP3PPP/R3KB1R w KQ - 0 1",
    paths: [["f1e2"]],
    intro:
      "A rook is checking down the e-file. Shield the king while bringing a bishop into play.",
    tasks: ["Place your bishop between the checking rook and your king."],
    hints: [
      [
        "Trace the line between the rook on e8 and your king on e1.",
        "The bishop on f1 can block on e2, where your king protects it.",
      ],
    ],
    takeaway:
      "Be2 blocked the rook’s line. The king protects e2, so capturing your bishop would cost Black a rook.",
  },
  {
    id: "rook-skewer",
    title: "Skewer the queen",
    mode: "Attack",
    level: "Intermediate",
    motif: "Skewer",
    art: "br",
    tone: "peach",
    fen: "8/6pp/8/q3k3/8/2P5/PP4K1/7R w - - 0 1",
    paths: [["h1h5", "e5f6", "h5a5"]],
    intro:
      "The black king and queen share a rank. Check the king to uncover the queen behind it.",
    tasks: [
      "Use your rook to attack the king along the queen’s rank.",
      "The king has stepped aside. Take the exposed queen.",
    ],
    hints: [
      [
        "The king on e5 stands between the h-file and the queen on a5.",
        "Play Rh5+.",
      ],
      [
        "Follow the fifth rank all the way to the a-file.",
        "Capture the queen on a5.",
      ],
    ],
    takeaway:
      "The check forced the king off the fifth rank, exposing the more valuable piece behind it.",
  },
  {
    id: "escape-square",
    title: "Make an escape square",
    mode: "Defense",
    level: "Intermediate",
    motif: "Back-rank defense",
    art: "wp",
    tone: "mint",
    fen: "4r1k1/pR3ppp/2p5/8/8/2P5/PP3PPP/6K1 w - - 0 1",
    paths: ["h2h3", "h2h4", "g2g3", "g2g4", "f2f3", "f2f4"].map((m) => [
      m,
      "e8e1",
      "g1" + m[0] + "2",
    ]),
    intro:
      "Black threatens mate on e1. Give your king room to escape before the rook arrives.",
    tasks: [
      "Move a kingside pawn to create a flight square.",
      "Black has checked on e1. Move your king to the square you cleared.",
    ],
    hints: [
      [
        "Any of your three pawns in front of the king can make room.",
        "Try h3 to make h2 available.",
      ],
      [
        "Find the empty square on the second rank beside your king.",
        "Step off the back rank into the space left by your pawn.",
      ],
    ],
    takeaway:
      "Moving a pawn gave the king a flight square. The back-rank check was no longer mate.",
  },
  {
    id: "remove-attacker",
    title: "Capture the attacker",
    mode: "Defense",
    level: "Intermediate",
    motif: "Mate threat",
    art: "bn",
    tone: "lilac",
    fen: "r5k1/pp3ppp/2pb4/8/7q/3Q1N2/PPP2PPP/5RK1 w - - 0 1",
    paths: [["f3h4"]],
    intro:
      "Black threatens to take h2 with the queen, supported by the bishop on d6. Look for a forcing defense.",
    tasks: ["Stop the threatened checkmate by capturing the attacking queen."],
    hints: [
      [
        "Which white piece already attacks h4?",
        "The knight on f3 can capture the queen on h4.",
      ],
    ],
    takeaway: "Capturing the queen removed the mating threat in a single move.",
  },
];

const scholarTrap: Trap = {
  name: "Scholar’s Mate",
  length: 4,
  target: "f7",
  question: "Which square do the white queen and bishop both attack?",
  recognition:
    "The queen on h5 and bishop on c4 converge on f7. Only the black king guards it.",
  setup: ["e4", "e5", "Bc4", "Nc6", "Qh5"],
  line: ["e4", "e5", "Bc4", "Nc6", "Qh5", "Nf6", "Qxf7#"],
};
const scholar = tactics.find((l) => l.id === "scholars-mate")!;
scholar.trap = scholarTrap;
scholar.intro =
  "White’s queen and bishop are lining up a four-move checkmate. Break their attack before it lands.";
const fools: Lesson = {
  id: "fools-mate",
  title: "Escape Fool’s Mate",
  mode: "Defense",
  level: "Beginner",
  motif: "Open diagonal",
  art: "bq",
  tone: "peach",
  fen: "rnb1kbnr/pppp1ppp/8/4p3/7q/2N2P2/PPPPP1PP/R1BQKBNR w KQkq - 2 3",
  paths: [["g2g3"]],
  intro:
    "Moving the f-pawn opened a diagonal to your king. Black has checked, but your g-pawn can still help.",
  tasks: ["Block the queen’s check with a pawn."],
  hints: [
    [
      "Follow the diagonal from h4 to e1.",
      "Move your g-pawn one square to g3.",
    ],
  ],
  takeaway:
    "The pawn on g3 blocks the diagonal and attacks the queen. In the two-move trap, pushing it to g4 too early takes away this defense.",
  trap: {
    name: "Fool’s Mate",
    length: 2,
    target: "e1",
    question:
      "Which square is exposed when White moves the f-pawn and advances the g-pawn too far?",
    recognition:
      "The h4–e1 diagonal leads straight to the white king. Keeping the g-pawn on g2 lets it block on g3.",
    setup: ["f3", "e5", "Nc3", "Qh4+"],
    line: ["f3", "e5", "g4", "Qh4#"],
  },
};
const legal: Lesson = {
  id: "legals-mate",
  title: "Avoid Légal’s Mate",
  mode: "Defense",
  level: "Intermediate",
  motif: "Queen sacrifice",
  art: "wn",
  tone: "lilac",
  fen: "rn1qkbnr/ppp2p1p/3p2p1/4N3/2B1P1b1/2N5/PPPP1PPP/R1BQK2R b KQkq - 0 5",
  paths: [["d6e5"]],
  intro:
    "White has offered a queen. Taking it lets two knights and a bishop build a mating net.",
  tasks: ["Ignore the queen and use a pawn to remove the attacking knight."],
  hints: [
    [
      "The knight on e5 supports an invasion on f7.",
      "Capture the e5 knight with your d6 pawn.",
    ],
  ],
  takeaway:
    "By taking the knight on e5, you dismantled the attack before the bishop could invade f7.",
  trap: {
    name: "Légal’s Mate",
    length: 7,
    target: "f7",
    question: "Where would White’s bishop give check if you took the queen?",
    recognition:
      "Bxf7+ drives the king toward e7, where the other white knight can deliver mate on d5.",
    setup: ["e4", "e5", "Nf3", "d6", "Bc4", "Bg4", "Nc3", "g6", "Nxe5"],
    line: [
      "e4",
      "e5",
      "Nf3",
      "d6",
      "Bc4",
      "Bg4",
      "Nc3",
      "g6",
      "Nxe5",
      "Bxd1",
      "Bxf7+",
      "Ke7",
      "Nd5#",
    ],
  },
};
const shilling: Lesson = {
  id: "shilling-trap",
  title: "The shilling trap",
  mode: "Defense",
  level: "Intermediate",
  motif: "Poisoned pawn",
  art: "bn",
  tone: "mint",
  fen: "r1bqkbnr/pppp1ppp/8/4p3/2BnP3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
  paths: [["f3d4", "e5d4", "e1g1"]],
  intro:
    "The e5 pawn looks free. Black is hoping you take it and walk into the Blackburne Shilling Trap.",
  tasks: [
    "Trade off Black’s advanced knight instead of grabbing a pawn.",
    "Black has recaptured. Castle to get your king out of the center.",
  ],
  hints: [
    [
      "Your f3 knight attacks both e5 and d4. Pick the piece.",
      "Capture the knight on d4.",
    ],
    [
      "The path between your king and kingside rook is clear.",
      "Move your king from e1 to g1.",
    ],
  ],
  takeaway:
    "Trading on d4 removed the knight that delivers the trap’s smothered mate. Castling finished your defense.",
  trap: {
    name: "Blackburne Shilling Trap",
    length: 7,
    target: "e5",
    question: "Which apparently loose pawn is the bait?",
    recognition:
      "Nxe5 invites ...Qg5. Grabbing the rook on h8 or the f7 pawn can leave your own king in danger.",
    setup: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nd4"],
    line: [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bc4",
      "Nd4",
      "Nxe5",
      "Qg5",
      "Nxf7",
      "Qxg2",
      "Rf1",
      "Qxe4+",
      "Be2",
      "Nf3#",
    ],
  },
};
const playScholar: Lesson = {
  id: "play-scholars-mate",
  title: "Deliver Scholar’s Mate",
  mode: "Attack",
  level: "Beginner",
  motif: "Opening trap",
  art: "wq",
  tone: "peach",
  fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
  paths: [["h5f7"]],
  intro:
    "Black has attacked your queen but left a mating square exposed. Finish the pattern from White’s side.",
  tasks: ["Find the queen capture that ends the game."],
  hints: [
    [
      "The bishop on c4 protects the queen’s landing square.",
      "Capture the pawn on f7 with your queen.",
    ],
  ],
  takeaway:
    "The bishop on c4 protects f7, so Black’s king cannot take your queen. The surrounding pieces block every escape.",
  trap: { ...scholarTrap, setup: [...scholarTrap.setup, "Nf6"] },
};
export const lessons: Lesson[] = [
  scholar,
  fools,
  legal,
  shilling,
  playScholar,
  ...tactics.filter((l) => l !== scholar),
];
export function matchingPaths(lesson: Lesson, path: string[]) {
  return lesson.paths.filter((line) =>
    path.every((move, i) => line[i] === move),
  );
}
export function validSavedPath(
  lesson: Lesson,
  path: unknown,
): path is string[] {
  return (
    Array.isArray(path) &&
    (path.length === 0 ||
      path.length % 2 === 0 ||
      lesson.paths.some((line) => line.length === path.length)) &&
    matchingPaths(lesson, path).length > 0
  );
}
export function isSolved(lesson: Lesson, path: string[]) {
  return matchingPaths(lesson, path).some(
    (line) => line.length === path.length,
  );
}
