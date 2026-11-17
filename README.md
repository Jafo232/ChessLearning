# Knightfall

An interactive chess tactics studio for learning attacks and defenses. Solve guided positions on the 3D board or switch to a flat board. Lessons include legal move checks, hints, explanations, and automatic opponent replies.

## Development

Use Node 22.13 or newer. Run `npm ci`, then `npm run dev`. Build with `npm run build`.

The app is hosted on ChatGPT Sites. Signed-in players save progress to the site's D1 database. The browser keeps a local copy for interrupted connections and local previews.
