import type { ReactNode } from "react";
import { Scene, type SceneName } from "../scenes/scenes";

export interface PlateImage {
  /** Path to a photograph for this slot — the person's own photo, or the
   * default image for it. Omit to show the drawn scene instead
   * (../scenes/scenes.tsx). */
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
 * swappable slot, never hard-coded markup. What fills it, in order: the
 * person's own photograph, else the default image for that slot, else the
 * drawn scene. Resolving which of those exists happens before this
 * component; it only ever draws the scene when it is handed no `src`.
 *
 * Every layout built on a plate is meant to hold a real photograph — very
 * dark, very light or busy — without any change: a `print` keeps its words
 * on paper beside the picture, and a `hero` keeps them on a scrim shaped for
 * the lightest picture it could be given.
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
