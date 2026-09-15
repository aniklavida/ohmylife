/**
 * Theme manifest validation schemas.
 *
 * Enforces the constraints defined in docs/SPEC.md §14 and AGENTS.md:
 * - An image must carry a licence line. No image enters without one.
 * - Light and dark are both designed. A theme that silently ships only light
 *   and has not declared that it commits to one mode must fail validation.
 * - Spacing and layout belong to the product, not the theme.
 */
import { z } from "zod";
import type { ThemeManifest } from "./types";

/** Forbidden spacing/layout properties that a theme is not allowed to dictate. */
const FORBIDDEN_LAYOUT_KEYS = [
  "spacing",
  "space",
  "margin",
  "padding",
  "gap",
  "layout",
  "width",
  "height",
  "scale",
];

function isAlertRed(hex: string): boolean {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r > 190 && g < 90 && b < 90;
}

export const imageSlotSchema = z.object({
  src: z.string().trim().min(1, "Image source path cannot be empty"),
  alt: z.string().trim().min(1, "Image alt text cannot be empty"),
  license: z
    .string({ error: "Licence line is required for every image shipped in a theme" })
    .trim()
    .min(1, "Licence line is required for every image shipped in a theme"),
});

export const themeTypographySchema = z.object({
  sans: z.string().trim().min(1, "Typography sans stack is required"),
  serif: z.string().trim().min(1).optional(),
  script: z.string().trim().min(1).optional(),
  mono: z.string().trim().min(1).optional(),
});

export const themeColorPaletteSchema = z
  .record(z.string(), z.union([z.string(), z.number()]))
  .superRefine((colors, ctx) => {
    for (const [key, value] of Object.entries(colors)) {
      const lowerKey = key.toLowerCase();
      for (const forbidden of FORBIDDEN_LAYOUT_KEYS) {
        if (lowerKey === forbidden || lowerKey.startsWith(`${forbidden}-`) || lowerKey.startsWith(`--${forbidden}`)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Theme cannot specify layout or spacing token "${key}". Spacing stays the product's.`,
          });
        }
      }

      if (typeof value === "string") {
        const hexMatches = value.match(/#[0-9a-fA-F]{6}\b/g) ?? [];
        for (const hex of hexMatches) {
          if (isAlertRed(hex)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Colour "${hex}" for "${key}" reads as an alert red, which is forbidden in the design system.`,
            });
          }
        }
      }
    }
  });

export const themeImagesSchema = z.object({
  hero: z.array(imageSlotSchema).optional(),
  areas: z.record(z.string(), imageSlotSchema).optional(),
});

export const themeManifestSchema = z
  .object({
    name: z.string().trim().min(1, "Theme name is required"),
    id: z.string().trim().min(1, "Theme id is required"),
    description: z.string().trim().optional(),
    mode: z.enum(["both", "light-only", "dark-only"]).optional(),
    colors: z.object({
      light: themeColorPaletteSchema.optional(),
      dark: themeColorPaletteSchema.optional(),
    }),
    typography: themeTypographySchema,
    images: themeImagesSchema.optional(),
  })
  .superRefine((manifest, ctx) => {
    const hasLight = manifest.colors.light !== undefined && Object.keys(manifest.colors.light).length > 0;
    const hasDark = manifest.colors.dark !== undefined && Object.keys(manifest.colors.dark).length > 0;

    if (!hasLight && !hasDark) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Theme must declare at least one colour palette (light or dark).",
      });
      return;
    }

    if (hasLight && !hasDark) {
      if (manifest.mode !== "light-only") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Theme silently ships only light mode without declaring commitment to a single mode ('light-only').",
        });
      }
    }

    if (hasDark && !hasLight) {
      if (manifest.mode !== "dark-only") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Theme silently ships only dark mode without declaring commitment to a single mode ('dark-only').",
        });
      }
    }
  });

/**
 * Validates a theme manifest object. Throws a descriptive Error if invalid.
 */
export function validateThemeManifest(raw: unknown): ThemeManifest {
  const result = themeManifestSchema.safeParse(raw);
  if (!result.success) {
    const errorMessages = result.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid theme manifest: ${errorMessages}`);
  }
  return result.data as ThemeManifest;
}
