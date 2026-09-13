/**
 * A drawn stand-in for a photograph — not a photograph itself, and
 * therefore not something that needs a licence. The design calls for real
 * photography here (a lamplit reading corner, a sunlit desk), but
 * docs/SPEC.md §14 is explicit that an image is not covered by this
 * repository's MIT licence and that no image ships without its own licence
 * line. Until a photograph is chosen and licensed, the honest default is
 * drawn shapes — never a downloaded or generated image that could be
 * mistaken for a licensed one.
 *
 * It is deliberately flat vector art, not photographic detail, so it reads
 * unambiguously as a placeholder rather than as a real (if low-quality)
 * photograph. `Plate` (./plate.tsx) renders this whenever it is not given
 * a real `image.src`; once a licensed photograph is chosen, passing
 * `image={{ src, alt }}` replaces this with no other code change — that
 * swap is the whole point of keeping imagery in its own slot.
 */
export function PlaceholderScene({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="omlPlaceholderSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a2a1c" />
          <stop offset="55%" stopColor="#7a4b32" />
          <stop offset="100%" stopColor="#c98c5a" />
        </linearGradient>
        <radialGradient id="omlPlaceholderGlow" cx="72%" cy="30%" r="48%">
          <stop offset="0%" stopColor="#ffdca8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffdca8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#omlPlaceholderSky)" />
      <rect width="1200" height="800" fill="url(#omlPlaceholderGlow)" />
      {/* A plant silhouette. Lamplight, plants, books and handwriting are
          what calm is made of in this product — not empty space. */}
      <g fill="#1e140c" opacity="0.85">
        <path d="M40 800 C40 620 130 520 108 372 C176 500 198 628 164 800 Z" />
        <path d="M130 800 C142 636 228 552 206 420 C270 536 268 664 236 800 Z" />
      </g>
      {/* A window frame suggestion, catching the lamp glow. */}
      <rect
        x="800"
        y="110"
        width="330"
        height="460"
        rx="18"
        fill="none"
        stroke="#f4e3c8"
        strokeOpacity="0.32"
        strokeWidth="6"
      />
    </svg>
  );
}
