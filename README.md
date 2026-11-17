# Knightfall

Knightfall has 12 interactive chess lessons and a full game mode. Opening lessons cover Scholar’s Mate, Fool’s Mate, Légal’s Mate, and the Blackburne Shilling Trap. Replay the mating line, identify the target square, then play the defense. Other lessons cover forks, pins, skewers, and back-rank tactics.

In **Play chess**, choose White or Black and adjust the computer on a five-level difficulty slider. Both modes support 3D and 2D boards, legal moves, and keyboard controls. The game uses chess.js for the rules and runs its computer opponent in a Web Worker.

## Development

Use Node 22.13 or newer. Install with `npm ci` and run `npm run dev`. Use `npm run build` to build for ChatGPT Sites. The current lesson catalog is in `lib/lessons.ts`. The 3D piece models are reproducible with `art/render-pieces.py`.

## Saved progress

The hosted app uses the signed-in player’s site-specific ID to save solved lessons, unfinished positions, and the current game in D1. The browser keeps a local copy between syncs. Anonymous previews store progress on the device.

D1 migrations are in `drizzle/`. To test signed-in storage locally, build the project, then apply the SQL migrations in order against the local `DB` binding using the generated Wrangler config at `dist/server/wrangler.json`.

The source repository and the ChatGPT Sites deployment are maintained separately. Deploying a new version requires publishing it to Sites.
