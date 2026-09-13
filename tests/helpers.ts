// Shared test scaffolding — not a test file itself (vitest only collects
// `tests/**/*.test.ts`).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** A fresh temp directory, removed automatically by the caller's `onCleanup`. */
export function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `ohmylife-${prefix}-`));
}

export function cleanupDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

export const EXAMPLE_LIFE_ROOT = path.resolve(here, "..", "examples", "sample-life");
