#!/usr/bin/env -S npx tsx
// The one command the whole promise rests on: delete the index, rebuild it
// from the life directory, lose nothing. See docs/SPEC.md §7 and the test in
// tests/rebuild.test.ts, which runs exactly this operation and checks it.
//
// Usage:
//   npm run rebuild-index -- --life ./life --db ./.ohmylife/index.db
//
// Both flags fall back to OHMYLIFE_LIFE / OHMYLIFE_DB, then to ./life and
// ./.ohmylife/index.db.
import path from "node:path";
import { rebuildIndex } from "../lib/index/build";

function readArg(flag: string, envVar: string, fallback: string): string {
  const flagIndex = process.argv.indexOf(`--${flag}`);
  if (flagIndex !== -1 && process.argv[flagIndex + 1] !== undefined) {
    return process.argv[flagIndex + 1] as string;
  }
  return process.env[envVar] ?? fallback;
}

const lifeRoot = path.resolve(readArg("life", "OHMYLIFE_LIFE", "./life"));
const dbPath = path.resolve(readArg("db", "OHMYLIFE_DB", "./.ohmylife/index.db"));

const result = rebuildIndex(lifeRoot, dbPath);

console.log(`Life:  ${lifeRoot}`);
console.log(`Index: ${result.dbPath}`);
console.log(`  entries indexed: ${result.entryCount}`);
console.log(`  links indexed:   ${result.linkCount}`);

if (result.errors.length > 0) {
  console.warn(`  skipped ${result.errors.length} invalid file(s):`);
  for (const error of result.errors) {
    console.warn(`    ${error.filePath}`);
    console.warn(`      ${error.message}`);
  }
  process.exitCode = 1;
}
