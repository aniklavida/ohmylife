import type { ReactNode } from "react";
import { Scene, type SceneName } from "../scenes/scenes";

export interface PlateImage {
  /** Path or URL to a real, licensed photograph. Omit to show the drawn
   * scene instead (../scenes/scenes.tsx). */
  src?: string;
  /** Required either way — the photograph's description, or the drawn
   * scene's. Read by a screen reader even though the drawing itself is
   * hidden from one. */
  alt: string;
}

export interface PlateProps {
  image: PlateImage;
  /** Which drawing fills the slot while no photograph is supplied. */
  scene?: SceneName;
  /** `hero` carries text over the picture behind a scrim. `print` is the
   * picture alone, like a photograph pinned to the page — its caption sits
   * outside it, on paper. */
  variant?: "hero" | "print";
  children?: ReactNode;
  className?: string;
}

/**
 * A picture surface — the hero, and each area's print. Imagery is a
 * swappable slot, never hard-coded markup: pass `image.src` for a real
 * photograph, or omit it and the drawn scene for this slot is shown.
 *
 * The drawing is not a stub. docs/SPEC.md §14 requires every photograph to
 * carry its own licence line, since an image is not covered by this
 * repository's MIT licence — so no photograph ships here until a theme
 * supplies one with its licence, and drawn shapes need no such line.
 */
export function Plate({ image, scene = "room", variant = "hero", children, className }: PlateProps) {
  return (
    <div className={["plate", `plate--${variant}`, className].filter(Boolean).join(" ")}>
      {image.src ? (
        // A themeable, user-supplied photograph (docs/ROADMAP.md step 6) —
        // not an asset Next can optimise ahead of time, so a plain <img>.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="plate__image" src={image.src} alt={image.alt} />
      ) : (
        <>
          <Scene name={scene} className="plate__scene" />
          <span className="sr-only">{image.alt}</span>
        </>
      )}
      {variant === "print" ? null : <div className="plate__scrim" aria-hidden="true" />}
      {children ? <div className="plate__content">{children}</div> : null}
    </div>
  );
}
