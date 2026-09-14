// The OhMyLife -> WeAllHateLife rename (CHANGELOG.md) kept the old env var
// names and the old `.ohmylife/` state folder working, with a one-time
// deprecation notice, even though nobody had released data under them yet.
// This proves the fallback in lib/index/runtime.ts rather than only
// describing it.
//
// lib/index/runtime.ts is re-imported fresh (vi.resetModules) for every case
// so the one-time notice can be asserted per case, not only once ever across
// the whole test run. `fs.existsSync` is mocked rather than the process
// actually changing directory, so this never touches the real filesystem and
// never mutates global process state other test files could be relying on.
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ENV_KEYS = ["WEALLHATELIFE_LIFE", "WEALLHATELIFE_DB", "OHMYLIFE_LIFE", "OHMYLIFE_DB"] as const;
let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  vi.resetModules();
  savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  vi.restoreAllMocks();
});

describe("backward compatibility after the OhMyLife -> WeAllHateLife rename", () => {
  it("prefers the new WEALLHATELIFE_LIFE / WEALLHATELIFE_DB env vars when both old and new are set", async () => {
    process.env.WEALLHATELIFE_LIFE = "/new/life";
    process.env.OHMYLIFE_LIFE = "/old/life";
    process.env.WEALLHATELIFE_DB = "/new/index.db";
    process.env.OHMYLIFE_DB = "/old/index.db";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { resolveLifeRoot, resolveDbPath } = await import("../lib/index/runtime");

    expect(resolveLifeRoot()).toBe(path.resolve("/new/life"));
    expect(resolveDbPath()).toBe(path.resolve("/new/index.db"));
    expect(warn).not.toHaveBeenCalled();
  });

  it("falls back to the legacy OHMYLIFE_LIFE / OHMYLIFE_DB env vars, warning once each", async () => {
    process.env.OHMYLIFE_LIFE = "/old/life";
    process.env.OHMYLIFE_DB = "/old/index.db";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { resolveLifeRoot, resolveDbPath } = await import("../lib/index/runtime");

    expect(resolveLifeRoot()).toBe(path.resolve("/old/life"));
    expect(resolveLifeRoot()).toBe(path.resolve("/old/life"));
    expect(resolveDbPath()).toBe(path.resolve("/old/index.db"));

    const lifeWarnings = warn.mock.calls.filter((call) => String(call[0]).includes("OHMYLIFE_LIFE"));
    const dbWarnings = warn.mock.calls.filter((call) => String(call[0]).includes("OHMYLIFE_DB"));
    expect(lifeWarnings).toHaveLength(1);
    expect(dbWarnings).toHaveLength(1);
  });

  it("reads a pre-rename ./.ohmylife state folder when no env var is set and ./.weallhatelife doesn't exist yet", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(fs, "existsSync").mockImplementation((target) => target === "./.ohmylife");
    const { resolveDbPath } = await import("../lib/index/runtime");

    expect(resolveDbPath()).toBe(path.resolve("./.ohmylife/index.db"));
    expect(resolveDbPath()).toBe(path.resolve("./.ohmylife/index.db"));

    const folderWarnings = warn.mock.calls.filter((call) => String(call[0]).includes(".ohmylife"));
    expect(folderWarnings).toHaveLength(1);
  });

  it("prefers the new ./.weallhatelife folder once it exists, even if ./.ohmylife is still there", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(fs, "existsSync").mockImplementation(
      (target) => target === "./.weallhatelife" || target === "./.ohmylife",
    );
    const { resolveDbPath } = await import("../lib/index/runtime");

    expect(resolveDbPath()).toBe(path.resolve("./.weallhatelife/index.db"));
    expect(warn).not.toHaveBeenCalled();
  });

  it("defaults to ./.weallhatelife when neither folder exists and no env var is set", async () => {
    vi.spyOn(fs, "existsSync").mockImplementation(() => false);
    const { resolveDbPath } = await import("../lib/index/runtime");

    expect(resolveDbPath()).toBe(path.resolve("./.weallhatelife/index.db"));
  });
});
