#!/usr/bin/env -S npx tsx
// The one command the whole promise rests on: delete the index, rebuild it
// from the life directory, lose nothing. See docs/SPEC.md §7 and the test in
// tests/rebuild.test.ts, which runs exactly this operation and checks it.
//
// Usage:
//   npm run rebuild-index -- --life ./life --db ./.weallhatelife/index.db
//
// Both flags fall back to lib/index/runtime.ts's own resolution: the
// WEALLHATELIFE_LIFE / WEALLHATELIFE_DB env vars, then ./life and
// ./.weallhatelife/index.db. That is also where the OHMYLIFE_LIFE /
// OHMYLIFE_DB names and the ./.ohmylife directory from before the
// WeAllHateLife rename still work, with a one-time deprecation notice —
// resolved there, not duplicated here, so this script and the MCP server
// never disagree about where a life lives (see lib/index/runtime.ts).
import path from "node:path";
import { rebuildIndex } from "../lib/index/build";
import { resolveDbPath, resolveLifeRoot } from "../lib/index/runtime";

function flagValue(flag: string): string | undefined {
  const flagIndex = process.argv.indexOf(`--${flag}`);
  if (flagIndex !== -1 && process.argv[flagIndex + 1] !== undefined) {
    return process.argv[flagIndex + 1];
  }
  return undefined;
}

const lifeFlag = flagValue("life");
const dbFlag = flagValue("db");

const lifeRoot = lifeFlag !== undefined ? path.resolve(lifeFlag) : resolveLifeRoot();
const dbPath = dbFlag !== undefined ? path.resolve(dbFlag) : resolveDbPath();

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
