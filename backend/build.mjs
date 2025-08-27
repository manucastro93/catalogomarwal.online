// backend/build.mjs
import { build } from "esbuild";
import { rmSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const outdir = "dist";

// limpiar y crear dist
rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

// Compilar SOLO la entrada, sin bundle (dejamos imports tal cual)
await build({
  entryPoints: ["server.js"],
  outfile: "dist/server.js",  // <= NO pongas outdir junto con outfile
  platform: "node",
  target: "node22",
  format: "esm",
  bundle: false,
  sourcemap: false,
  minify: false,
});

// Copiar archivos sueltos necesarios
const files = ["package.json"];
for (const f of files) {
  if (existsSync(f)) cpSync(f, join(outdir, f), { recursive: true });
}

// Copiar directorios que se usan en runtime
const dirs = [
  "config",
  "controllers",
  "routes",
  "models",
  "middlewares",
  "utils",
  "sockets",
  "cronjobs",
  "constants",
  "public",
];
for (const d of dirs) {
  if (existsSync(d)) cpSync(d, join(outdir, d), { recursive: true });
}

console.log("✅ Backend build listo en dist/");
