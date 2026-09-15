/**
 * Theme loading from disk and active theme resolution.
 *
 * `lib/` is the only layer allowed to touch disk (docs/STRUCTURE.md).
 * Loads theme manifests, validates their constraints, and exposes them
 * to the application.
 */
import fs from "node:fs";
import path from "node:path";
import { validateThemeManifest } from "./schema";
import type { ThemeManifest } from "./types";

const DEFAULT_THEME_ID = "lamplight";

/** Resolves the directory where themes are stored. */
export function resolveThemesRoot(customThemesRoot?: string): string {
  if (customThemesRoot !== undefined) {
    return path.resolve(/* turbopackIgnore: true */ customThemesRoot);
  }
  const fromEnv = process.env.WEALLHATELIFE_THEMES_DIR || process.env.OHMYLIFE_THEMES_DIR;
  if (fromEnv) {
    return path.resolve(/* turbopackIgnore: true */ fromEnv);
  }
  return path.resolve(/* turbopackIgnore: true */ "./themes");
}

/**
 * Loads and validates a theme manifest from its folder on disk.
 */
export function loadThemeManifest(themeDir: string): ThemeManifest {
  const manifestPath = path.join(/* turbopackIgnore: true */ themeDir, "theme.json");
  if (!fs.existsSync(/* turbopackIgnore: true */ manifestPath)) {
    throw new Error(`Theme manifest not found at ${manifestPath}`);
  }

  const rawContent = fs.readFileSync(/* turbopackIgnore: true */ manifestPath, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch (err) {
    throw new Error(`Failed to parse theme.json at ${manifestPath}: ${String(err)}`);
  }

  return validateThemeManifest(parsed);
}

/**
 * Lists the IDs of all available themes in the themes root directory.
 */
export function listAvailableThemes(customThemesRoot?: string): string[] {
  const root = resolveThemesRoot(customThemesRoot);
  if (!fs.existsSync(/* turbopackIgnore: true */ root)) return [];

  const themes: string[] = [];
  const entries = fs.readdirSync(/* turbopackIgnore: true */ root, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const candidateManifest = path.join(/* turbopackIgnore: true */ root, entry.name, "theme.json");
      if (fs.existsSync(/* turbopackIgnore: true */ candidateManifest)) {
        themes.push(entry.name);
      }
    }
  }
  return themes.sort();
}

/**
 * Resolves the active theme ID from environment variables or life configuration.
 */
export function resolveActiveThemeId(lifeRoot?: string): string {
  const envTheme = process.env.WEALLHATELIFE_THEME || process.env.OHMYLIFE_THEME;
  if (envTheme && envTheme.trim().length > 0) {
    return envTheme.trim();
  }

  if (lifeRoot && fs.existsSync(/* turbopackIgnore: true */ lifeRoot)) {
    const lifeThemeFile = path.join(/* turbopackIgnore: true */ lifeRoot, "theme.json");
    if (fs.existsSync(/* turbopackIgnore: true */ lifeThemeFile)) {
      try {
        const content = JSON.parse(
          fs.readFileSync(/* turbopackIgnore: true */ lifeThemeFile, "utf8"),
        ) as Record<string, unknown>;
        if (typeof content.theme === "string" && content.theme.trim().length > 0) {
          return content.theme.trim();
        }
        if (typeof content.activeTheme === "string" && content.activeTheme.trim().length > 0) {
          return content.activeTheme.trim();
        }
      } catch {
        // Fall through on unparseable life config
      }
    }
  }

  return DEFAULT_THEME_ID;
}

/**
 * A theme ID names one directory inside the themes root. It is never a path.
 *
 * Today the ID only ever comes from an environment variable or the owner's own
 * life configuration, so a traversal would read a file the operator can already
 * read. That stops being true the moment a theme becomes selectable from the
 * interface, which is where this is going. Constraining the shape now is free;
 * discovering later that `path.join` accepted `../../.ssh/id_rsa` is not.
 */
const THEME_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

/**
 * Loads a theme by ID.
 */
export function loadTheme(themeId: string, customThemesRoot?: string): ThemeManifest {
  if (!THEME_ID_PATTERN.test(themeId)) {
    throw new Error(
      `Invalid theme id ${JSON.stringify(themeId)}: a theme id names a directory in the themes root, ` +
        "and must match /^[a-z0-9][a-z0-9_-]*$/",
    );
  }
  const root = resolveThemesRoot(customThemesRoot);
  const themeDir = path.join(/* turbopackIgnore: true */ root, themeId);
  return loadThemeManifest(themeDir);
}

/**
 * Retrieves the currently active theme. Falls back to DEFAULT_THEME_ID if the
 * requested theme fails to load.
 */
export function getActiveTheme(lifeRoot?: string, customThemesRoot?: string): ThemeManifest {
  const activeId = resolveActiveThemeId(lifeRoot);
  try {
    return loadTheme(activeId, customThemesRoot);
  } catch (err) {
    if (activeId !== DEFAULT_THEME_ID) {
      try {
        return loadTheme(DEFAULT_THEME_ID, customThemesRoot);
      } catch {
        // Fall through to re-throw original error
      }
    }
    throw err;
  }
}
