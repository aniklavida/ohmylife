import type { ReactNode } from "react";

interface ScriptProps {
  children: ReactNode;
  /** A small hand-set tilt, in degrees, so it reads as a note in the
   * margin rather than a heading. */
  rotate?: number;
  /** `ink` (default) reads on the page's own cream/parchment ground.
   * `cream` reads on a dark ground — the forest sidebar, a plate's scrim. */
  tone?: "ink" | "cream";
  className?: string;
}

/**
 * A handwritten margin annotation. These carry the product's voice; they
 * are not decoration. Every place this is used, the same meaning
 * also appears in ordinary prose elsewhere on the screen (see
 * components/quiet/quiet-state.tsx) — the script is the voice, not the
 * only carrier of the information, for a reader whose setup renders it
 * plainly.
 */
export function Script({ children, rotate = -2, tone = "ink", className }: ScriptProps) {
  return (
    <p
      className={["script", `script--${tone}`, className].filter(Boolean).join(" ")}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </p>
  );
}
