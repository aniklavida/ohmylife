import type { ReactNode } from "react";
import { PlaceholderScene } from "./placeholder-scene";

export interface PlateImage {
  /** Path or URL to a real, licensed photograph. Omit to fall back to the
   * built-in placeholder scene (./placeholder-scene.tsx). */
  src?: string;
  /** Required either way — either the real photograph's description, or a
   * plain statement that this is a placeholder. Read by a screen reader
   * even when the placeholder graphic itself is hidden from one. */
  alt: string;
}

export interface PlateProps {
  image: PlateImage;
  /** `card` is reserved for the area cards built in docs/ROADMAP.md step 5;
   * only `hero` is exercised by this card's quiet state. */
  variant?: "hero" | "card";
  children?: ReactNode;
  className?: string;
}

/**
 * A photographic surface with text over it — design brief: the hero, and
 * later the area cards. Imagery is a swappable slot, never hard-coded
 * markup: pass `image.src` for a real photograph, or omit it to use the
 * placeholder scene (see DECISIONS.md, "Photograph sourcing and licensing
 * for the default theme" — a v1 blocker this card does not resolve, and
 * does not pretend to).
 */
export function Plate({ image, variant = "hero", children, className }: PlateProps) {
  return (
    <div className={["plate", `plate--${variant}`, className].filter(Boolean).join(" ")}>
      {image.src ? (
        // A themeable, user-supplied photograph (docs/ROADMAP.md step 6) —
        // not an asset Next can optimise ahead of time, so a plain <img>.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="plate__image" src={image.src} alt={image.alt} />
      ) : (
        <>
          <PlaceholderScene className="plate__placeholder" />
          <span className="sr-only">{image.alt}</span>
        </>
      )}
      <div className="plate__scrim" aria-hidden="true" />
      {children ? <div className="plate__content">{children}</div> : null}
    </div>
  );
}
