// Type stack — design brief: "serif display · handwritten script for
// accents · clean sans for UI labels." Loaded through `next/font/google`,
// which downloads and self-hosts the font files at build time: the running
// server serves them from itself and makes no request to Google at runtime,
// which is what keeps this consistent with docs/SPEC.md §17's "no outbound
// call of any kind from the server."
import { Caveat, Fraunces, Inter } from "next/font/google";

/** Serif display and body — the warm, retro voice of headlines and prose. */
export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

/** Handwritten script — margin annotations only. They carry the voice; they
 * are never the only place a piece of information appears (see
 * components/primitives/script.tsx). */
export const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

/** Clean sans — UI labels, nav, captions. Never body prose. */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
