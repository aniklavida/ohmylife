/**
 * Theme slot image resolution and CSS token serialization.
 *
 * Resolves images in order:
 * 1. User's own photograph (from lifeRoot or user configuration)
 * 2. Theme's default image for the slot (from active theme manifest)
 * 3. Graceful degradation to drawn scenes (returns undefined src)
 *
 * Adheres strictly to layer boundaries: lib/ imports only lib/.
 */
import fs from "node:fs";
import path from "node:path";
import type { ImageSlotDefinition, ThemeColorPalette, ThemeManifest, ThemeTypography } from "./types";

export interface ResolvedImageSlot {
  src?: string;
  alt: string;
  license?: string;
}

const SUPPORTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"];

function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Normalizes a theme color token name to a CSS custom property name.
 */
export function tokenToCssVarName(key: string): string {
  if (key.startsWith("--")) return key;
  const kebab = camelToKebab(key);
  if (kebab.startsWith("scene-")) {
    return `--${kebab}`;
  }
  return `--color-${kebab}`;
}

/**
 * Checks for a user-supplied photograph file in the life root directory.
 */
function findUserPhotoFile(lifeRoot: string, subPath: string): string | undefined {
  for (const ext of SUPPORTED_IMAGE_EXTENSIONS) {
    const candidate = path.join(lifeRoot, `${subPath}${ext}`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

/**
 * Resolves user overrides from <lifeRoot>/theme.json if present.
 */
function readLifeThemeOverrides(lifeRoot?: string): {
  areas?: Record<string, { src: string; alt?: string; license?: string }>;
  hero?: Array<{ src: string; alt?: string; license?: string }>;
} | null {
  if (!lifeRoot || !fs.existsSync(lifeRoot)) return null;
  const configPath = path.join(lifeRoot, "theme.json");
  if (!fs.existsSync(configPath)) return null;

  try {
    const content = JSON.parse(fs.readFileSync(configPath, "utf8")) as Record<string, unknown>;
    const images = content.images as {
      areas?: Record<string, { src: string; alt?: string; license?: string }>;
      hero?: Array<{ src: string; alt?: string; license?: string }>;
    };
    return images || null;
  } catch {
    return null;
  }
}

/**
 * Resolves a photograph for an area slot.
 * Order: User photograph -> Theme default image -> undefined (fallback to scene)
 */
export function resolveAreaPhoto(
  theme: ThemeManifest,
  area: string,
  lifeRoot?: string,
): ResolvedImageSlot | undefined {
  // 1. User life configuration override
  const lifeOverrides = readLifeThemeOverrides(lifeRoot);
  const userAreaOverride = lifeOverrides?.areas?.[area];
  if (userAreaOverride && userAreaOverride.src) {
    return {
      src: userAreaOverride.src,
      alt: userAreaOverride.alt ?? `Photograph for ${area}`,
      license: userAreaOverride.license,
    };
  }

  // 2. User life folder file convention (e.g. life/photos/areas/<area>.jpg)
  if (lifeRoot && fs.existsSync(lifeRoot)) {
    const photoPath =
      findUserPhotoFile(lifeRoot, path.join("photos", "areas", area)) ||
      findUserPhotoFile(lifeRoot, path.join("images", "areas", area));
    if (photoPath) {
      return {
        src: photoPath,
        alt: `Personal photograph for ${area}`,
      };
    }
  }

  // 3. Active theme image definition
  const themeImage: ImageSlotDefinition | undefined = theme.images?.areas?.[area];
  if (themeImage && themeImage.src) {
    // If it's a relative path on disk, verify existence; if web path or exists, use it
    const isAbsoluteOrUrl = themeImage.src.startsWith("/") || themeImage.src.startsWith("data:");
    if (isAbsoluteOrUrl || fs.existsSync(themeImage.src)) {
      return {
        src: themeImage.src,
        alt: themeImage.alt,
        license: themeImage.license,
      };
    }
  }

  // 4. Graceful degradation: no photograph found, return undefined so caller uses scene
  return undefined;
}

/**
 * Resolves a photograph for the hero slot.
 */
export function resolveHeroPhoto(
  theme: ThemeManifest,
  lifeRoot?: string,
  index = 0,
): ResolvedImageSlot | undefined {
  // 1. User life configuration override
  const lifeOverrides = readLifeThemeOverrides(lifeRoot);
  const userHeroOverride = lifeOverrides?.hero?.[index];
  if (userHeroOverride && userHeroOverride.src) {
    return {
      src: userHeroOverride.src,
      alt: userHeroOverride.alt ?? "Hero photograph",
      license: userHeroOverride.license,
    };
  }

  // 2. User life folder file convention (e.g. life/photos/hero/hero-1.jpg or hero.jpg)
  if (lifeRoot && fs.existsSync(lifeRoot)) {
    const photoPath =
      findUserPhotoFile(lifeRoot, path.join("photos", "hero", `hero-${index + 1}`)) ||
      findUserPhotoFile(lifeRoot, path.join("photos", "hero", "hero")) ||
      findUserPhotoFile(lifeRoot, path.join("images", "hero", "hero"));
    if (photoPath) {
      return {
        src: photoPath,
        alt: "Personal hero photograph",
      };
    }
  }

  // 3. Active theme hero rotation
  const themeHeroes = theme.images?.hero;
  if (Array.isArray(themeHeroes) && themeHeroes.length > 0) {
    const heroImage = themeHeroes[index % themeHeroes.length];
    if (heroImage && heroImage.src) {
      const isAbsoluteOrUrl = heroImage.src.startsWith("/") || heroImage.src.startsWith("data:");
      if (isAbsoluteOrUrl || fs.existsSync(heroImage.src)) {
        return {
          src: heroImage.src,
          alt: heroImage.alt,
          license: heroImage.license,
        };
      }
    }
  }

  // 4. Graceful degradation
  return undefined;
}

/**
 * Resolves photos for all areas defined in a theme.
 */
export function resolveAreaPhotos(
  theme: ThemeManifest,
  areas: readonly string[],
  lifeRoot?: string,
): Record<string, ResolvedImageSlot | undefined> {
  const result: Record<string, ResolvedImageSlot | undefined> = {};
  for (const area of areas) {
    result[area] = resolveAreaPhoto(theme, area, lifeRoot);
  }
  return result;
}

function serializePalette(palette: ThemeColorPalette): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(palette)) {
    if (value !== undefined && value !== null) {
      lines.push(`  ${tokenToCssVarName(key)}: ${value};`);
    }
  }
  return lines.join("\n");
}

function serializeTypography(typography: ThemeTypography): string {
  const lines: string[] = [];
  if (typography.sans) lines.push(`  --font-sans: ${typography.sans};`);
  if (typography.serif) lines.push(`  --font-serif: ${typography.serif};`);
  if (typography.script) lines.push(`  --font-script: ${typography.script};`);
  if (typography.mono) lines.push(`  --font-mono: ${typography.mono};`);
  return lines.join("\n");
}

/**
 * Serializes a theme manifest into CSS custom properties.
 * Designed light and dark palettes are written to :root and prefers-color-scheme.
 */
export function serializeThemeCss(theme: ThemeManifest): string {
  const chunks: string[] = [];

  const typeRules = serializeTypography(theme.typography);

  if (theme.mode === "light-only" && theme.colors.light) {
    chunks.push(`:root {\n${typeRules}\n${serializePalette(theme.colors.light)}\n}`);
    return chunks.join("\n\n");
  }

  if (theme.mode === "dark-only" && theme.colors.dark) {
    chunks.push(`:root {\n${typeRules}\n${serializePalette(theme.colors.dark)}\n}`);
    return chunks.join("\n\n");
  }

  // Default: both light and dark
  if (theme.colors.light) {
    chunks.push(`:root {\n${typeRules}\n${serializePalette(theme.colors.light)}\n}`);
  }

  if (theme.colors.dark) {
    chunks.push(`@media (prefers-color-scheme: dark) {\n  :root {\n${serializePalette(theme.colors.dark)}\n  }\n}`);
  }

  return chunks.join("\n\n");
}
