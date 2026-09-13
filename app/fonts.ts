// Type stack — a serif for display and prose, a handwritten script for
// accents, and a clean sans for UI labels. Loaded through `next/font/google`,
// which downloads and self-hosts the font files at build time: the running
// server serves them from itself and makes no request to Google at runtime.
// That is what keeps the fonts consistent with docs/SPEC.md §16, where the
// server "makes no outbound call of its own — except to the provider whose
// key the user configured in-site (§10), and to nothing else." A font
// fetched per page view would be a second destination, and would break it.
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
