// Shared test scaffolding — not a test file itself (vitest only collects
// `tests/**/*.test.ts`).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** A fresh temp directory, removed automatically by the caller's `onCleanup`. */
export function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `weallhatelife-${prefix}-`));
}

export function cleanupDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

export const EXAMPLE_LIFE_ROOT = path.resolve(here, "..", "examples", "sample-life");

/**
 * Removes comments while leaving string and template literals intact, so a
 * rule written *about* in a comment is never mistaken for one broken in
 * code. A regex over raw source reports the prose at the top of a test file
 * that explains what the test forbids.
 *
 * Shared by the two structural tests that read source rather than run it —
 * tests/layer-boundaries.test.ts and tests/no-egress.test.ts — because a
 * hand-written lexer copied into both is a lexer that gets fixed in one.
 */
export function stripComments(source: string): string {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const two = source.slice(i, i + 2);
    if (two === "//") {
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }
    if (two === "/*") {
      i += 2;
      while (i < source.length && source.slice(i, i + 2) !== "*/") i += 1;
      i += 2;
      continue;
    }
    const char = source[i] as string;
    if (char === '"' || char === "'" || char === "`") {
      out += char;
      i += 1;
      while (i < source.length) {
        const inner = source[i] as string;
        out += inner;
        i += 1;
        if (inner === "\\") {
          out += source[i] ?? "";
          i += 1;
          continue;
        }
        if (inner === char) break;
      }
      continue;
    }
    out += char;
    i += 1;
  }
  return out;
}
