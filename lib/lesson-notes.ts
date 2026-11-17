export type LessonNotes = {
  heading: string;
  history: string;
  source: { title: string; url: string };
  position: string;
  continuation: string;
};

const beale = {
  title: "Francis Beale’s 1656 edition, page 17",
  url: "https://books.google.com/books?id=cPxYAAAAYAAJ&pg=PA17",
};

export const lessonNotes = {
  "scholars-mate": {
    heading: "Two threats, one target",
    history: "In 2005 Hikaru Nakamura brought his queen to h5 on move two against Krishnan Sasikiran. His bishop soon joined the attack from c4. Sasikiran answered with the same two defensive moves you can play here. The four-move mate turned into an 87-move game, which Sasikiran won.",
    source: { title: "Nakamura vs. Sasikiran, 2005 · game score", url: "https://www.chessbox.in/chessgame/nakamurah-sasikirank-2/" },
    position: "Follow both white pieces to f7. Your king guards the pawn, but the bishop would protect a white queen landing there. The tempting knight move attacks the queen on h5 and gives her exactly the capture she wants. Look for a way to cut her line to f7 while chasing her away.",
    continuation: "After 3...g6 4.Qf3, the queen is aiming at the same pawn from a new direction. Now 4...Nf6 works. The knight blocks the f-file and Black brings another piece into play.",
  },
  "fools-mate": {
    heading: "The pawn move that changes a mate into a check",
    history: "On a single page of his 1656 English edition of Gioachino Greco’s chess book, Francis Beale printed both Fool’s Mate and Scholar’s Mate. In his Fool’s Mate example Black makes the first move and White delivers mate. Swap the colors and the exposed diagonal is the one you see here.",
    source: beale,
    position: "In the familiar two-move loss, White plays f3 and g4. The f-pawn clears the diagonal to e1, and the g-pawn goes a square too far to close it. Here White played Nc3 in place of g4. That difference matters more than the presence of the extra knight.",
    continuation: "After 1.f3 e5 2.Nc3 Qh4+, play 3.g3. The pawn steps between queen and king. It also attacks h4, so Black has to decide what to do with the queen.",
  },
  "legals-mate": {
    heading: "Why Légal could leave his queen behind",
    history: "The trap takes its name from a Paris game attributed to Légal against Saint Brie, usually dated 1750. Later writers give different opening moves. Their accounts agree on the finish. Black takes the queen, a bishop draws the king forward, and a knight delivers mate.",
    source: { title: "Edward Winter · Chess Note 5720 on Légal’s Mate", url: "https://www.chesshistory.com/winter/winter49.html" },
    position: "Black’s bishop on g4 had pinned the f3 knight to the white queen. A player can legally give up a queen, and White has just done exactly that by taking on e5. Before collecting on d1, look at White’s next check and count the knights covering your king’s escape squares.",
    continuation: "After 5...Bxd1? 6.Bxf7+ Ke7 7.Nd5#, the knight from c3 ends the game. Play 5...dxe5 instead. Removing the other knight takes away its protection of f7.",
  },
  "shilling-trap": {
    heading: "What did Blackburne win for a shilling?",
    history: "The story says English master Joseph Henry Blackburne used this trap to win shillings from amateurs. The moves are better documented than the wager. Wilhelm Steinitz discussed the opening without attributing it to Blackburne, and researchers tracing the story struggled to find a game in which Blackburne actually played it.",
    source: { title: "Edward Winter · Blackburne and the shilling story", url: "https://www.chesshistory.com/winter/extra/blackburne.html" },
    position: "Black’s last knight move seems to abandon e5. Before accepting a free pawn, give Black one move in your head. A queen on g5 would attack both your knight on e5 and the pawn on g2 beside your rook. The knight on d4 is the other capture available to you now.",
    continuation: "After 4.Nxe5? Qg5, taking another pawn on f7 allows the queen into g2. Try 4.Nxd4 exd4 5.O-O. The advanced knight is gone and your king is castled.",
  },
  "play-scholars-mate": {
    heading: "Who protects the queen on f7?",
    history: "The Scholar’s Mate that Francis Beale printed in 1656 reaches f7 with a queen and a bishop. His queen comes out first. In the opening that leads to this lesson, the bishop comes out first. Both move orders work because the two pieces arrive in time to attack the same square.",
    source: beale,
    position: "Black’s knight on f6 attacks your queen on h5. Before moving her to safety, look for a check. Trace the bishop’s diagonal from c4 through d5 and e6. The bishop can help deliver mate without moving again if your queen lands at the far end of that line.",
    continuation: "Play 4.Qxf7#. Black’s king cannot capture the queen because the bishop guards f7. The queen covers e8 and the nearby flight squares while Black’s own pieces occupy the rest. There is no square between queen and king where Black can block.",
  },
  "royal-fork": {
    heading: "One knight move, two targets",
    history: "In April 1882, Brentano’s Chess Monthly published a game between Gustavus Reichhelm and W. W. Biddle in which a white knight used a series of forks to win both black rooks. Historian Edward Winter notes that the date and occasion of the game itself are unknown. Here the knight forks the king and queen.",
    source: { title: "Edward Winter · Reichhelm vs. Biddle", url: "https://www.chesshistory.com/winter/extra/instructive.html" },
    position: "The black king on h8 and the queen on d8 are four files apart. Work backward from both pieces. Which square could a knight attack them both from? Then check whether your knight on g5 can reach it in one move. Giving check is what buys you time for the second capture.",
    continuation: "1.Nxf7+ Kg8 2.Nxd8+ wins the queen. The second check comes from a different piece. As your knight leaves f7, it opens the diagonal from the bishop on c4 to the king on g8.",
  },
  "back-rank": {
    heading: "When the king’s shelter becomes a cage",
    history: "In Moscow in 1914, José Raúl Capablanca offered his queen to Ossip Bernstein with ...Qb2. Bernstein resigned. Had he taken the queen with his own, Capablanca’s rook could have gone to d1 for back-rank mate. The famous mating move was a variation the players saw, rather than a move played on the board.",
    source: { title: "Edward Winter for ChessBase · Bernstein vs. Capablanca", url: "https://en.chessbase.com/newsroom/post/edward-winter-s-che-explorations-3--1?page=0" },
    position: "Start with the black king. The pawns on f7, g7 and h7 occupy all three squares in front of it. A rook landing on the eighth rank would cover every sideways escape. Now trace the e-file from your rook to the back rank and check whether Black can put anything in its path.",
    continuation: "1.Re8# ends the game. Black’s rook on b2 is active in White’s position, but it can neither take your rook nor block between e8 and g8. There is no reason to spend a move chasing it.",
  },
  "absolute-pin": {
    heading: "The difference an empty d7 makes",
    history: "The Spanish priest Ruy López de Segura analyzed the bishop move to b5 in his 1561 book. That opening still bears his name. In its usual starting position Black’s pawn still stands on d7, behind the c6 knight. This lesson shows what changes once that pawn has moved.",
    source: { title: "Chess.com · History of the Ruy López", url: "https://www.chess.com/openings/Ruy-Lopez-Opening" },
    position: "Trace the diagonal backward from the king on e8. The first square, d7, is empty. The next one, c6, contains a knight. A bishop reaching b5 would put the knight between itself and the king. Moving a knight always takes it off that diagonal, so it would expose its own king to check.",
    continuation: "5.Bb5 pins the knight. You can leave the bishop there while deciding how to use the pressure. Recheck the diagonal after each reply. If Black interposes a piece on d7, the knight may be free to move again.",
  },
  "block-check": {
    heading: "Putting a piece in the line of fire",
    history: "In Paul Morphy’s 1858 Opera Game in Paris, Morphy played 11.Bxb5+. Black blocked with the knight from b8 to d7. That answered the immediate check, but left the knight pinned. Morphy castled queenside on his next move and brought a rook onto the same file as the pinned knight.",
    source: { title: "The Opera Game · annotated game score", url: "https://chesszz.com/games/opera.html" },
    position: "Here the black rook checks down the e-file. Look at the empty squares between e8 and e1 before moving your king. Your bishop can reach one of them, and the king can guard the bishop there. Blocking works against a distant rook, bishop or queen. A knight’s check has no line you can interrupt.",
    continuation: "1.Be2 puts the bishop on a protected square. If Black plays 1...Rxe2+, White replies 2.Kxe2, winning a rook for a bishop. Check what protects the blocking piece before using this defense in another position.",
  },
  "rook-skewer": {
    heading: "How the skewer got its name",
    history: "When pupils of Liverpool chess teacher Edgar Pennell used the word “skewer” at the 1937 British Chess Federation congress in Blackpool, the term caught other players’ attention. In 1939 the magazine CHESS credited Pennell with the name. The name stuck because one attack goes through two pieces. When the front piece moves, the one behind it is exposed.",
    source: { title: "Edward Winter · Early uses of chess terms", url: "https://www.chesshistory.com/winter/extra/earliest.html" },
    position: "Look across the fifth rank from the h-file. First comes the black king on e5, then the queen on a5. Approach from the king’s side so Black has to answer a check before the queen can escape.",
    continuation: "1.Rh5+ Kf6 2.Rxa5 wins the queen. Picture the same rook facing the queen first and the king behind her. That would be a pin because moving the front piece would expose its own king.",
  },
  "escape-square": {
    heading: "A little air for the king",
    history: "Chess players borrowed the German word Luft, meaning “air,” for room a king can escape into. You may hear a player say they should have “made luft” a move earlier. The timing is the point. Once a rook checks along the back rank, a pawn move that merely opens a future escape can come one move too late.",
    source: { title: "Scouting America · Chess glossary, “Luft”", url: "https://filestore.scouting.org/filestore/Merit_Badge_ReqandRes/Pamphlets/Chess_2025.pdf" },
    position: "Your rook is deep in Black’s position, but look at your own king before taking another pawn. Black’s rook has a clear run to e1. Pick a pawn in front of your king, imagine moving it, and check that the square it leaves is somewhere your king could legally step.",
    continuation: "One answer is 1.h3 Re1+ 2.Kh2. Moving the f- or g-pawn also works in this position, as does pushing the h-pawn two squares. The destination that matters is the square your pawn vacates on the second rank.",
  },
  "remove-attacker": {
    heading: "Can you take the attacking queen?",
    history: "At Breslau in 1912, Frank Marshall played ...Qg3 against Stepan Levitsky. White could take the queen three different ways, yet each capture lost. Levitsky resigned. Ask the same question here. After you take the queen, what is Black’s strongest reply?",
    source: { title: "Levitsky vs. Marshall · game and capture variations", url: "https://en.wikipedia.org/wiki/Levitsky_versus_Marshall" },
    position: "Black’s bishop on d6 and queen on h4 both attack h2. Follow the bishop’s diagonal carefully. It protects h2, but it does not protect the queen on h4. Now look at what the knight on f3 attacks. You can deal with the queen while your king stays where it is.",
    continuation: "1.Nxh4 wins the queen immediately. Imagine Black had the move in the original diagram and played ...Qxh2+. The same knight could answer Nxh2. Taking the queen now also saves the h-pawn.",
  },
} satisfies Record<string, LessonNotes>;
