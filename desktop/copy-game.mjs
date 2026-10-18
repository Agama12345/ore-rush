// Copies the single-file web build of the game into ./game so Electron can load it.
// Run `npm run build` in the game project first (it creates dist/index.html).
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "..", "dist", "index.html");
const targetDir = join(here, "game");

if (!existsSync(source)) {
  console.error(`Nie znaleziono ${source}. Najpierw uruchom "npm run build" w projekcie gry.`);
  process.exit(1);
}
mkdirSync(targetDir, { recursive: true });
copyFileSync(source, join(targetDir, "index.html"));
console.log("Skopiowano gre do ./game/index.html");
