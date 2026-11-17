import { build } from "esbuild";
await build({
  entryPoints: ["lib/engine.ts"],
  bundle: true,
  minify: true,
  format: "iife",
  outfile: "public/engine.js",
  legalComments: "eof",
});
