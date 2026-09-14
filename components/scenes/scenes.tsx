/**
 * Drawn scenes — one per area of a life, plus the room the home page opens
 * on. Each is a small, specific picture of what that area *is*: an album
 * under a lamp for Memories, two cups on a table for People, a jar of coins
 * for Money. They stand in the image slot a photograph will fill once a
 * theme supplies one (docs/SPEC.md §14): `Plate` renders a scene only when
 * it has no `image.src`, so a licensed photograph replaces a drawing with no
 * other change.
 *
 * Every colour comes from the scene tokens in tokens.css, never from a hex
 * value in this file. That is what lets the same drawing read as a sunlit
 * afternoon in the light theme and a lamplit evening in the dark one: the
 * dark theme redraws the sky, the glow and the stars, it does not invert.
 *
 * Deliberately flat, hand-cut shapes rather than photographic detail, so a
 * scene never passes for a photograph.
 */
import type { ReactNode } from "react";

export const SCENE_NAMES = [
  "room",
  "memories",
  "people",
  "money",
  "body",
  "work",
  "decisions",
  "papers",
  "someday",
  "tending",
] as const;
export type SceneName = (typeof SCENE_NAMES)[number];

/** What each scene draws, in words — the image slot's alt text. */
export const SCENE_DESCRIPTION: Record<SceneName, string> = {
  room:
    "A drawn scene of a quiet room at dusk: a lamp glowing beside an armchair, " +
    "a tall curtained window with a plant on the sill, and a shelf of books.",
  memories:
    "A drawn scene of an open photo album on a wooden table under the warm light " +
    "of a reading lamp, with a cup of tea beside it and photographs strung above.",
  people:
    "A drawn scene of two cups of tea steaming on a small round table by a window, " +
    "a teapot between them and two chairs pulled up close.",
  money:
    "A drawn scene of a glass jar filling with coins on a wooden shelf, beside a " +
    "small notebook and a few neat stacks of coins.",
  body:
    "A drawn scene of a sunlit window with a tall plant on the sill, a glass of " +
    "water and a small round clock beside it.",
  work:
    "A drawn scene of a wooden desk under a window: an open notebook, a cup of " +
    "pencils, a desk lamp and notes pinned to a corkboard.",
  decisions:
    "A drawn scene of a path that forks in two across green hills, with a wooden " +
    "signpost at the fork and the sun low in the sky.",
  papers:
    "A drawn scene of a wooden filing drawer pulled open with coloured folders " +
    "inside, and a passport, an envelope and a tied bundle of letters on top.",
  someday:
    "A drawn scene from a balcony over a wide river, a small sailboat on the " +
    "water and a potted plant on the railing.",
  tending:
    "A drawn scene of a potting bench in warm window light, with a watering can " +
    "and three potted plants.",
};

const SCENE_FOR_AREA: Record<string, SceneName> = {
  memories: "memories",
  people: "people",
  money: "money",
  body: "body",
  papers: "papers",
  decisions: "decisions",
  someday: "someday",
  tasks: "work",
  projects: "work",
  goals: "work",
  habits: "body",
  areas: "room",
};

/** The scene that stands for an area. Any area without its own drawing gets the room. */
export function sceneForArea(area: string): SceneName {
  return SCENE_FOR_AREA[area] ?? "room";
}

/** Rounds a computed coordinate so the markup stays readable. */
function r(value: number): number {
  return Math.round(value);
}

/** Shared gradients: the wall, the sky through a window, and lamplight. */
function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" className="sc-stop-wall-top" />
        <stop offset="1" className="sc-stop-wall-low" />
      </linearGradient>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" className="sc-stop-sky-top" />
        <stop offset="1" className="sc-stop-sky-low" />
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" className="sc-stop-glow" />
        <stop offset="1" className="sc-stop-glow-fade" />
      </radialGradient>
    </defs>
  );
}

/** A few stars, visible only when the theme draws a night sky. */
function Stars({ points }: { points: [number, number][] }) {
  return (
    <g className="sc-stars">
      {points.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.5" className="sc-star" />
      ))}
    </g>
  );
}

/** A window with sky, a sun (a moon at night), far hills and a sill. */
function Window({ id, x, y, w, h }: { id: string; x: number; y: number; w: number; h: number }) {
  const inset = 16;
  const ix = x + inset;
  const iy = y + inset;
  const iw = w - inset * 2;
  const ih = h - inset * 2;
  const hill = iy + ih * 0.74;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="6" className="sc-wood" />
      <rect x={ix} y={iy} width={iw} height={ih} fill={`url(#${id}-sky)`} />
      <Stars
        points={[
          [r(ix + iw * 0.14), r(iy + ih * 0.16)],
          [r(ix + iw * 0.34), r(iy + ih * 0.3)],
          [r(ix + iw * 0.86), r(iy + ih * 0.12)],
          [r(ix + iw * 0.22), r(iy + ih * 0.46)],
        ]}
      />
      <circle cx={r(ix + iw * 0.68)} cy={r(iy + ih * 0.28)} r={r(Math.min(iw, ih) * 0.09)} className="sc-sun" />
      <path
        d={`M${ix} ${r(hill)} C${r(ix + iw * 0.25)} ${r(hill - ih * 0.14)} ${r(ix + iw * 0.5)} ${r(hill - ih * 0.02)} ${r(ix + iw * 0.72)} ${r(hill - ih * 0.12)} C${r(ix + iw * 0.86)} ${r(hill - ih * 0.18)} ${r(ix + iw * 0.95)} ${r(hill - ih * 0.1)} ${ix + iw} ${r(hill - ih * 0.08)} V${iy + ih} H${ix} Z`}
        className="sc-far"
      />
      <path
        d={`M${ix} ${r(hill + ih * 0.1)} C${r(ix + iw * 0.3)} ${r(hill + ih * 0.02)} ${r(ix + iw * 0.6)} ${r(hill + ih * 0.12)} ${ix + iw} ${r(hill + ih * 0.04)} V${iy + ih} H${ix} Z`}
        className="sc-near"
      />
      <rect x={r(ix + iw / 2 - 5)} y={iy} width="10" height={ih} className="sc-wood" />
      <rect x={ix} y={r(iy + ih / 2 - 5)} width={iw} height="10" className="sc-wood" />
      <rect x={x - 18} y={y + h - 4} width={w + 36} height="20" rx="4" className="sc-wood-dark" />
    </g>
  );
}

/** A leafy plant in a terracotta pot, drawn from the rim's centre. */
function PottedPlant({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 0 C-14 -60 -74 -112 -116 -122 C-86 -80 -44 -36 0 0 Z" className="sc-leaf-deep" />
      <path d="M0 0 C-22 -84 -10 -164 22 -206 C34 -142 22 -62 0 0 Z" className="sc-leaf" />
      <path d="M0 0 C32 -52 92 -92 134 -98 C102 -60 52 -20 0 0 Z" className="sc-leaf" />
      <path d="M0 0 C12 -72 62 -132 94 -152 C82 -92 42 -40 0 0 Z" className="sc-leaf-deep" />
      <path d="M0 0 C-32 -40 -92 -52 -124 -42 C-84 -20 -42 -4 0 0 Z" className="sc-leaf" />
      <path d="M-44 -6 H44 L34 70 H-34 Z" className="sc-terracotta" />
      <rect x="-50" y="-14" width="100" height="18" rx="5" className="sc-terracotta-deep" />
    </g>
  );
}

/** A cup on a saucer, with steam curling up from it. */
function Cup({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const handle = flip ? "M-44 -38 C-74 -38 -74 -8 -44 -10" : "M44 -38 C74 -38 74 -8 44 -10";
  const steam = flip
    ? "M-6 -70 C-30 -100 18 -120 -8 -154 C-26 -176 4 -196 -10 -218"
    : "M6 -70 C30 -100 -18 -120 8 -154 C26 -176 -4 -196 10 -218";
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="6" rx="86" ry="18" className="sc-paper-shade" />
      <path d="M-48 -62 H48 C48 -18 30 4 0 4 C-30 4 -48 -18 -48 -62 Z" className="sc-cup" />
      <ellipse cx="0" cy="-62" rx="48" ry="10" className="sc-tea" />
      <path d={handle} className="sc-line sc-line--cup" />
      <path d={steam} className="sc-steam" />
    </g>
  );
}

function RoomScene({ id }: { id: string }) {
  return (
    <>
      <rect width="1200" height="800" fill={`url(#${id}-wall)`} />
      <rect y="640" width="1200" height="160" className="sc-floor" />
      <rect y="630" width="1200" height="14" className="sc-wood-dark" />
      <ellipse cx="760" cy="724" rx="420" ry="50" className="sc-rug" />

      <circle cx="1010" cy="300" r="360" fill={`url(#${id}-glow)`} />

      <g>
        <rect x="80" y="236" width="380" height="14" rx="3" className="sc-wood-dark" />
        <rect x="104" y="150" width="30" height="86" rx="3" className="sc-plum" />
        <rect x="138" y="164" width="24" height="72" rx="3" className="sc-sage" />
        <rect x="166" y="138" width="34" height="98" rx="3" className="sc-terracotta" />
        <rect x="204" y="172" width="22" height="64" rx="3" className="sc-paper-shade" />
        <rect x="236" y="160" width="28" height="80" rx="3" transform="rotate(14 250 236)" className="sc-rose" />
        <PottedPlant x={380} y={196} scale={0.34} />
        <rect x="130" y="290" width="130" height="160" rx="4" className="sc-wood" />
        <rect x="144" y="304" width="102" height="132" className="sc-paper" />
        <path d="M144 436 L184 370 L212 404 L230 382 L246 404 V436 Z" className="sc-sage" />
        <circle cx="220" cy="336" r="12" className="sc-sun" />
      </g>

      <Window id={id} x={520} y={96} w={340} h={424} />
      <rect x="486" y="84" width="408" height="10" rx="5" className="sc-brass" />
      <path d="M494 92 C470 250 508 430 474 628 H530 C540 430 512 250 540 92 Z" className="sc-rose" />
      <path d="M886 92 C910 250 872 430 906 628 H850 C840 430 868 250 840 92 Z" className="sc-rose" />
      <PottedPlant x={610} y={500} scale={0.44} />

      <g>
        <line x1="1030" y1="250" x2="1030" y2="630" className="sc-line sc-line--brass" />
        <ellipse cx="1030" cy="634" rx="54" ry="12" className="sc-brass" />
        <path d="M960 262 H1100 L1068 170 H992 Z" className="sc-shade" />
      </g>
      <g>
        <path d="M842 470 C842 430 870 410 910 410 H1060 C1100 410 1126 430 1126 470 V640 H842 Z" className="sc-plum" />
        <rect x="812" y="520" width="60" height="130" rx="26" className="sc-plum-deep" />
        <rect x="1096" y="520" width="60" height="130" rx="26" className="sc-plum-deep" />
        <rect x="866" y="540" width="236" height="70" rx="18" className="sc-rose" />
        <rect x="850" y="646" width="16" height="36" className="sc-wood-dark" />
        <rect x="1104" y="646" width="16" height="36" className="sc-wood-dark" />
      </g>

      <PottedPlant x={150} y={600} scale={1.1} />
    </>
  );
}

function MemoriesScene({ id }: { id: string }) {
  return (
    <>
      <rect width="1200" height="800" fill={`url(#${id}-wall)`} />
      <path d="M120 96 C360 150 820 150 1080 96" className="sc-line sc-line--string" />
      {[
        { x: 300, y: 120, rot: -6 },
        { x: 560, y: 138, rot: 4 },
        { x: 820, y: 126, rot: -3 },
      ].map((photo) => (
        <g key={photo.x} transform={`rotate(${photo.rot} ${photo.x + 55} ${photo.y})`}>
          <rect x={photo.x} y={photo.y} width="110" height="124" className="sc-paper" />
          <rect x={photo.x + 10} y={photo.y + 10} width="90" height="84" fill={`url(#${id}-sky)`} />
          <path
            d={`M${photo.x + 10} ${photo.y + 94} L${photo.x + 42} ${photo.y + 54} L${photo.x + 64} ${photo.y + 76} L${photo.x + 80} ${photo.y + 62} L${photo.x + 100} ${photo.y + 94} Z`}
            className="sc-sage"
          />
          <rect x={photo.x + 48} y={photo.y - 8} width="14" height="20" rx="2" className="sc-brass" />
        </g>
      ))}

      <circle cx="250" cy="330" r="380" fill={`url(#${id}-glow)`} />

      <rect y="470" width="1200" height="330" className="sc-wood" />
      <rect y="462" width="1200" height="16" className="sc-wood-dark" />

      <g>
        <rect x="230" y="286" width="20" height="184" className="sc-wood-dark" />
        <ellipse cx="240" cy="472" rx="74" ry="16" className="sc-wood-dark" />
        <path d="M130 292 H350 L306 178 H174 Z" className="sc-shade" />
      </g>

      <g>
        <path d="M394 524 L650 500 L912 524 L924 740 L650 716 L382 740 Z" className="sc-plum" />
        <path d="M420 520 L646 504 L650 704 L410 724 Z" className="sc-paper" />
        <path d="M654 504 L884 520 L894 724 L654 704 Z" className="sc-paper" />
        <path d="M650 504 V706" className="sc-line sc-line--spine" />
        <g transform="rotate(-4 520 590)">
          <rect x="452" y="540" width="136" height="104" className="sc-paper-shade" />
          <rect x="462" y="550" width="116" height="74" fill={`url(#${id}-sky)`} />
          <path d="M462 624 L500 584 L528 606 L548 590 L578 624 Z" className="sc-leaf" />
        </g>
        <g transform="rotate(3 770 600)">
          <rect x="700" y="546" width="140" height="112" className="sc-paper-shade" />
          <rect x="710" y="556" width="120" height="80" className="sc-rose" />
          <circle cx="770" cy="590" r="20" className="sc-sun" />
          <path d="M710 636 C750 610 790 624 830 606 V636 Z" className="sc-terracotta" />
        </g>
      </g>

      <g transform="rotate(14 250 650)">
        <rect x="190" y="596" width="120" height="136" className="sc-paper" />
        <rect x="202" y="608" width="96" height="90" className="sc-sage" />
        <circle cx="250" cy="642" r="16" className="sc-sun" />
      </g>

      <Cup x={1030} y={640} />
    </>
  );
}

function PeopleScene({ id }: { id: string }) {
  return (
    <>
      <rect width="1200" height="800" fill={`url(#${id}-wall)`} />
      <circle cx="600" cy="250" r="400" fill={`url(#${id}-glow)`} />
      <Window id={id} x={400} y={70} w={400} h={340} />
      <PottedPlant x={720} y={396} scale={0.36} />

      <g>
        <path d="M120 420 C130 380 250 380 260 420 V800 H232 V470 H148 V800 H120 Z" className="sc-wood-dark" />
        <rect x="160" y="440" width="12" height="220" className="sc-wood-dark" />
        <rect x="208" y="440" width="12" height="220" className="sc-wood-dark" />
        <path d="M1080 420 C1070 380 950 380 940 420 V800 H968 V470 H1052 V800 H1080 Z" className="sc-wood-dark" />
        <rect x="1028" y="440" width="12" height="220" className="sc-wood-dark" />
        <rect x="980" y="440" width="12" height="220" className="sc-wood-dark" />
      </g>

      <g>
        <rect x="582" y="590" width="36" height="170" className="sc-wood-dark" />
        <ellipse cx="600" cy="770" rx="130" ry="20" className="sc-wood-dark" />
        <ellipse cx="600" cy="592" rx="360" ry="78" className="sc-wood-dark" />
        <ellipse cx="600" cy="578" rx="360" ry="78" className="sc-wood" />
      </g>

      <g>
        <ellipse cx="600" cy="540" rx="84" ry="68" className="sc-terracotta" />
        <path d="M680 526 C730 500 744 470 760 450" className="sc-line sc-line--pot" />
        <path d="M522 512 C480 500 480 560 526 566" className="sc-line sc-line--pot" />
        <ellipse cx="600" cy="476" rx="46" ry="12" className="sc-terracotta-deep" />
        <circle cx="600" cy="460" r="12" className="sc-terracotta-deep" />
        <path d="M540 540 C570 556 630 556 660 540" className="sc-line sc-line--pattern" />
      </g>

      <Cup x={420} y={600} flip />
      <Cup x={780} y={600} />
    </>
  );
}

function MoneyScene({ id }: { id: string }) {
  const coins: [number, number][] = [
    [520, 540], [566, 544], [612, 540], [658, 546], [700, 538],
    [540, 516], [588, 520], [634, 514], [680, 520],
    [516, 492], [562, 496], [610, 490], [656, 496], [702, 490],
    [540, 468], [590, 470], [636, 464], [682, 472],
    [566, 444], [614, 440], [660, 446],
  ];
  return (
    <>
      <rect width="1200" height="800" fill={`url(#${id}-wall)`} />
      <circle cx="610" cy="380" r="380" fill={`url(#${id}-glow)`} />

      <g>
        <rect x="920" y="120" width="170" height="210" rx="4" className="sc-wood" />
        <rect x="934" y="134" width="142" height="182" className="sc-paper" />
        <path d="M934 316 L990 240 L1026 280 L1048 254 L1076 316 Z" className="sc-sage" />
        <circle cx="1030" cy="190" r="20" className="sc-sun" />
      </g>

      <rect y="566" width="1200" height="30" className="sc-wood" />
      <rect y="596" width="1200" height="204" className="sc-wall-low" />
      <path d="M180 596 L180 660 L240 596 Z" className="sc-wood-dark" />
      <path d="M1020 596 L1020 660 L960 596 Z" className="sc-wood-dark" />

      <g>
        <rect x="470" y="240" width="280" height="330" rx="44" className="sc-glass" />
        {coins.map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}>
            <ellipse cx={cx} cy={cy + 4} rx="26" ry="10" className="sc-brass-deep" />
            <ellipse cx={cx} cy={cy} rx="26" ry="10" className="sc-brass" />
          </g>
        ))}
        <rect x="470" y="240" width="280" height="330" rx="44" className="sc-glass-edge" />
        <rect x="496" y="208" width="228" height="42" rx="8" className="sc-brass-deep" />
        <rect x="508" y="318" width="204" height="84" rx="6" className="sc-paper" />
        <path d="M530 360 C560 346 590 372 620 356 C650 340 670 366 692 356" className="sc-line sc-line--ink" />
        <path d="M496 262 C496 300 496 420 504 520" className="sc-shine" />
      </g>

      <g>
        {[0, 1, 2, 3, 4].map((step) => (
          <ellipse key={`a-${step}`} cx="850" cy={556 - step * 14} rx="40" ry="12" className={step % 2 ? "sc-brass-deep" : "sc-brass"} />
        ))}
        {[0, 1, 2].map((step) => (
          <ellipse key={`b-${step}`} cx="940" cy={556 - step * 14} rx="40" ry="12" className={step % 2 ? "sc-brass-deep" : "sc-brass"} />
        ))}
      </g>

      <g transform="rotate(-6 300 520)">
        <rect x="200" y="470" width="220" height="90" rx="6" className="sc-sage" />
        <rect x="200" y="470" width="220" height="16" rx="6" className="sc-sage-deep" />
        <rect x="360" y="470" width="18" height="90" className="sc-terracotta" />
        <rect x="230" y="446" width="170" height="10" rx="5" transform="rotate(-8 315 451)" className="sc-brass" />
      </g>

      <PottedPlant x={120} y={560} scale={0.5} />
    </>
  );
}

function BodyScene({ id }: { id: string }) {
  return (
    <>
      <rect width="1200" height="800" fill={`url(#${id}-wall)`} />
      <path d="M340 560 L860 560 L1060 800 L150 800 Z" className="sc-beam" />
      <circle cx="600" cy="300" r="420" fill={`url(#${id}-glow)`} />
      <Window id={id} x={320} y={60} w={560} h={500} />
      <path d="M300 50 C280 220 320 420 290 700 H340 C350 420 320 220 346 50 Z" className="sc-rose sc-sheer" />
      <path d="M900 50 C920 220 880 420 910 700 H860 C850 420 880 220 854 50 Z" className="sc-rose sc-sheer" />

      <rect y="576" width="1200" height="224" className="sc-wall-low" />

      <g transform="translate(470 560)">
        <path d="M0 0 C-30 -120 -20 -250 -8 -330 C10 -250 18 -120 0 0 Z" className="sc-leaf" />
        <path d="M0 0 C-60 -90 -110 -200 -120 -270 C-80 -210 -30 -110 0 0 Z" className="sc-leaf-deep" />
        <path d="M0 0 C50 -100 80 -210 84 -290 C58 -210 26 -110 0 0 Z" className="sc-leaf-deep" />
        <path d="M0 0 C70 -60 140 -140 164 -200 C120 -150 60 -80 0 0 Z" className="sc-leaf" />
        <path d="M0 0 C-80 -40 -150 -100 -176 -150 C-130 -110 -60 -60 0 0 Z" className="sc-leaf" />
        <path d="M-70 -10 H70 L56 110 H-56 Z" className="sc-terracotta" />
        <rect x="-78" y="-22" width="156" height="26" rx="6" className="sc-terracotta-deep" />
      </g>

      <g>
        <rect x="690" y="470" width="64" height="96" rx="8" className="sc-glass" />
        <rect x="694" y="506" width="56" height="56" rx="6" className="sc-water" />
        <rect x="690" y="470" width="64" height="96" rx="8" className="sc-glass-edge" />
      </g>

      <g>
        <rect x="826" y="540" width="16" height="22" className="sc-wood-dark" />
        <rect x="898" y="540" width="16" height="22" className="sc-wood-dark" />
        <circle cx="870" cy="486" r="62" className="sc-sage" />
        <circle cx="870" cy="486" r="48" className="sc-paper" />
        <path d="M870 486 V452 M870 486 L894 498" className="sc-line sc-line--ink" />
        <circle cx="830" cy="428" r="16" className="sc-sage-deep" />
        <circle cx="910" cy="428" r="16" className="sc-sage-deep" />
      </g>
    </>
  );
}

function WorkScene({ id }: { id: string }) {
  return (
    <>
      <rect width="1200" height="800" fill={`url(#${id}-wall)`} />
      <circle cx="930" cy="300" r="380" fill={`url(#${id}-glow)`} />
      <Window id={id} x={150} y={70} w={320} h={330} />

      <g>
        <rect x="560" y="90" width="360" height="260" rx="8" className="sc-wood" />
        <rect x="576" y="106" width="328" height="228" className="sc-cork" />
        <g transform="rotate(-5 650 170)">
          <rect x="596" y="126" width="110" height="96" className="sc-paper" />
          <path d="M610 160 H690 M610 180 H676 M610 200 H684" className="sc-line sc-line--ink" />
        </g>
        <g transform="rotate(6 790 190)">
          <rect x="730" y="130" width="120" height="110" className="sc-rose" />
          <path d="M746 168 H834 M746 190 H812" className="sc-line sc-line--ink" />
        </g>
        <g transform="rotate(-3 700 280)">
          <rect x="640" y="236" width="140" height="84" className="sc-sage" />
          <path d="M656 266 H760 M656 288 H736" className="sc-line sc-line--ink" />
        </g>
        <circle cx="651" cy="134" r="7" className="sc-terracotta" />
        <circle cx="790" cy="138" r="7" className="sc-plum" />
        <circle cx="710" cy="244" r="7" className="sc-terracotta" />
      </g>

      <rect y="500" width="1200" height="300" className="sc-wood" />
      <rect y="492" width="1200" height="16" className="sc-wood-dark" />

      <g transform="rotate(-4 520 590)">
        <path d="M340 540 L520 528 L700 540 L710 660 L520 648 L330 660 Z" className="sc-paper-shade" />
        <path d="M352 544 L516 534 L516 644 L344 654 Z" className="sc-paper" />
        <path d="M524 534 L690 544 L698 654 L524 644 Z" className="sc-paper" />
        <path d="M378 574 H490 M378 598 H480 M378 622 H470 M550 578 H660 M550 602 H640" className="sc-line sc-line--ink" />
        <rect x="560" y="610" width="150" height="10" rx="5" transform="rotate(-18 635 615)" className="sc-terracotta" />
      </g>

      <g>
        <rect x="212" y="468" width="16" height="80" rx="4" transform="rotate(-10 220 508)" className="sc-terracotta" />
        <rect x="236" y="458" width="16" height="90" rx="4" className="sc-sage-deep" />
        <rect x="258" y="470" width="16" height="80" rx="4" transform="rotate(12 266 510)" className="sc-brass" />
        <path d="M196 510 H290 L280 590 H206 Z" className="sc-plum" />
      </g>

      <g>
        <ellipse cx="960" cy="560" rx="80" ry="16" className="sc-wood-dark" />
        <path d="M960 552 L900 400 L1010 300" className="sc-line sc-line--arm" />
        <circle cx="900" cy="400" r="12" className="sc-brass-deep" />
        <path d="M1010 300 L1100 344 L1060 400 L974 360 Z" className="sc-shade" />
      </g>

      <Cup x={1080} y={660} />
    </>
  );
}

function DecisionsScene({ id }: { id: string }) {
  return (
    <>
      <rect width="1200" height="800" fill={`url(#${id}-sky)`} />
      <Stars points={[[160, 90], [340, 150], [880, 70], [1040, 160], [620, 110]]} />
      <circle cx="820" cy="330" r="420" fill={`url(#${id}-glow)`} />
      <circle cx="820" cy="330" r="64" className="sc-sun" />
      <path d="M760 160 l20 12 l20 -12 M840 120 l16 10 l16 -10 M300 200 l18 11 l18 -11" className="sc-line sc-line--bird" />

      <path d="M0 400 C200 330 380 380 600 350 C820 320 1000 360 1200 330 V800 H0 Z" className="sc-far" />
      <path d="M0 470 C240 420 420 470 640 440 C860 410 1020 450 1200 420 V800 H0 Z" className="sc-near" />
      <path d="M0 560 C260 520 480 560 700 530 C900 506 1060 540 1200 520 V800 H0 Z" className="sc-leaf" />

      <g>
        <path d="M150 470 C150 400 200 370 220 360 C240 370 290 400 290 470 C290 520 250 540 220 540 C190 540 150 520 150 470 Z" className="sc-leaf-deep" />
        <rect x="212" y="520" width="16" height="50" className="sc-wood-dark" />
        <path d="M980 430 C980 370 1020 344 1040 336 C1060 344 1100 370 1100 430 C1100 474 1066 490 1040 490 C1014 490 980 474 980 430 Z" className="sc-leaf-deep" />
        <rect x="1032" y="474" width="16" height="44" className="sc-wood-dark" />
      </g>

      <path d="M460 800 C520 720 560 660 590 600 C560 560 470 520 330 480 C470 500 570 530 606 566 C640 530 740 490 900 460 C760 510 670 560 630 600 C660 670 700 740 760 800 Z" className="sc-path" />

      <g>
        <rect x="598" y="440" width="18" height="170" className="sc-wood-dark" />
        <path d="M606 456 H500 L474 480 L500 504 H606 Z" className="sc-wood" />
        <path d="M612 508 H726 L752 532 L726 556 H612 Z" className="sc-wood" />
      </g>

      <path d="M0 800 V700 C40 690 70 720 100 700 C140 676 170 720 210 700 C250 680 280 720 320 706 V800 Z" className="sc-leaf-deep" />
      <path d="M880 800 V716 C920 700 960 730 1000 710 C1050 690 1090 726 1140 706 C1170 696 1190 704 1200 700 V800 Z" className="sc-leaf-deep" />
    </>
  );
}

function PapersScene({ id }: { id: string }) {
  const folders = ["sc-sage", "sc-rose", "sc-paper", "sc-terracotta", "sc-plum", "sc-sage-deep"];
  return (
    <>
      <rect width="1200" height="800" fill={`url(#${id}-wall)`} />
      <circle cx="600" cy="300" r="420" fill={`url(#${id}-glow)`} />

      <g>
        <line x1="960" y1="150" x2="960" y2="170" className="sc-line sc-line--brass" />
        <circle cx="960" cy="146" r="8" className="sc-brass-deep" />
        <circle cx="960" cy="196" r="24" className="sc-line sc-line--key" />
        <rect x="954" y="218" width="12" height="70" className="sc-brass" />
        <rect x="966" y="256" width="18" height="10" className="sc-brass" />
        <rect x="966" y="274" width="12" height="10" className="sc-brass" />
      </g>

      <rect x="310" y="370" width="580" height="430" rx="10" className="sc-wood" />
      <rect x="310" y="362" width="580" height="22" rx="6" className="sc-wood-dark" />

      <g>
        {folders.map((cls, index) => (
          <g key={cls}>
            <rect x={330 + index * 88} y={440 - (index % 2) * 18} width="100" height="120" rx="6" className={cls} />
            <rect x={346 + index * 88} y={424 - (index % 2) * 18} width="44" height="22" rx="4" className={cls} />
          </g>
        ))}
        <rect x="280" y="520" width="640" height="150" rx="10" className="sc-wood" />
        <rect x="280" y="520" width="640" height="14" rx="6" className="sc-wood-dark" />
        <rect x="540" y="588" width="120" height="22" rx="11" className="sc-brass" />
        <rect x="330" y="700" width="540" height="12" rx="6" className="sc-wood-dark" />
      </g>

      <g transform="rotate(-8 420 330)">
        <rect x="350" y="258" width="130" height="100" rx="6" className="sc-plum" />
        <circle cx="415" cy="300" r="22" className="sc-line sc-line--brass" />
        <rect x="380" y="336" width="70" height="6" rx="3" className="sc-brass" />
      </g>

      <g transform="rotate(5 610 320)">
        <rect x="520" y="270" width="190" height="110" rx="4" className="sc-paper" />
        <path d="M520 272 L615 334 L710 272" className="sc-line sc-line--envelope" />
        <circle cx="615" cy="334" r="12" className="sc-terracotta" />
      </g>

      <g transform="rotate(-3 800 330)">
        <rect x="730" y="300" width="150" height="62" rx="4" className="sc-paper-shade" />
        <rect x="736" y="290" width="150" height="62" rx="4" className="sc-paper" />
        <path d="M806 288 V354 M734 322 H888" className="sc-line sc-line--string" />
        <path d="M806 322 C790 300 770 306 780 322 C770 338 790 344 806 322 C822 300 842 306 832 322 C842 338 822 344 806 322" className="sc-line sc-line--string" />
      </g>
    </>
  );
}

function SomedayScene({ id }: { id: string }) {
  return (
    <>
      <rect width="1200" height="800" fill={`url(#${id}-sky)`} />
      <Stars points={[[140, 80], [320, 140], [980, 60], [1100, 180], [700, 90], [480, 60]]} />
      <circle cx="380" cy="300" r="420" fill={`url(#${id}-glow)`} />
      <circle cx="380" cy="290" r="58" className="sc-sun" />
      <path d="M700 180 l20 12 l20 -12 M780 150 l14 9 l14 -9" className="sc-line sc-line--bird" />

      <path d="M0 390 C160 350 320 380 520 360 C720 340 900 370 1200 350 V440 H0 Z" className="sc-far" />
      <rect y="430" width="1200" height="370" className="sc-water" />
      <path d="M300 470 H460 M540 500 H700 M200 530 H300 M820 480 H960 M380 560 H520 M760 540 H860" className="sc-shimmer" />

      <g>
        <path d="M720 540 H880 L860 566 H742 Z" className="sc-wood-dark" />
        <rect x="796" y="370" width="6" height="170" className="sc-wood-dark" />
        <path d="M802 376 L802 530 L878 530 Z" className="sc-paper" />
        <path d="M796 396 L796 530 L736 530 Z" className="sc-rose" />
      </g>

      <rect y="600" width="1200" height="200" className="sc-wall-low" />
      <rect y="582" width="1200" height="26" rx="4" className="sc-wood" />
      {Array.from({ length: 12 }, (_, index) => (
        <rect key={index} x={40 + index * 100} y="608" width="16" height="192" className="sc-wood-dark" />
      ))}
      <rect y="760" width="1200" height="40" className="sc-wood-dark" />

      <PottedPlant x={170} y={540} scale={0.62} />
      <Cup x={1000} y={574} />
    </>
  );
}

function TendingScene({ id }: { id: string }) {
  return (
    <>
      <rect width="1200" height="800" fill={`url(#${id}-wall)`} />
      <path d="M760 90 L1000 90 L1160 560 L520 560 Z" className="sc-beam" />
      <circle cx="880" cy="260" r="400" fill={`url(#${id}-glow)`} />
      <Window id={id} x={740} y={70} w={280} h={300} />

      <rect y="560" width="1200" height="240" className="sc-wood" />
      <rect y="552" width="1200" height="16" className="sc-wood-dark" />

      <PottedPlant x={260} y={500} scale={0.7} />
      <PottedPlant x={500} y={510} scale={0.5} />
      <PottedPlant x={1040} y={520} scale={0.44} />

      <g>
        <path d="M660 430 C660 400 690 390 740 390 H840 C890 390 910 404 910 430 V560 H660 Z" className="sc-sage" />
        <path d="M680 400 C700 330 870 330 890 400" className="sc-line sc-line--handle" />
        <path d="M660 470 L540 380 L520 390 L640 500 Z" className="sc-sage-deep" />
        <ellipse cx="528" cy="382" rx="24" ry="12" transform="rotate(-36 528 382)" className="sc-brass" />
        <path d="M500 420 c-6 16 -6 24 0 28 c6 -4 6 -12 0 -28 Z M470 450 c-6 16 -6 24 0 28 c6 -4 6 -12 0 -28 Z M520 470 c-6 16 -6 24 0 28 c6 -4 6 -12 0 -28 Z" className="sc-water" />
      </g>

      <g transform="rotate(-10 380 640)">
        <rect x="300" y="620" width="120" height="16" rx="8" className="sc-wood-dark" />
        <path d="M420 628 L500 606 L520 628 L500 650 Z" className="sc-brass" />
      </g>
      <g transform="rotate(6 800 660)">
        <rect x="740" y="610" width="110" height="130" rx="4" className="sc-rose" />
        <circle cx="795" cy="660" r="26" className="sc-sun" />
      </g>
    </>
  );
}

const SCENES: Record<SceneName, (props: { id: string }) => ReactNode> = {
  room: RoomScene,
  memories: MemoriesScene,
  people: PeopleScene,
  money: MoneyScene,
  body: BodyScene,
  work: WorkScene,
  decisions: DecisionsScene,
  papers: PapersScene,
  someday: SomedayScene,
  tending: TendingScene,
};

/**
 * One drawn scene. Hidden from assistive technology: the image slot that
 * renders it (`Plate`) carries the description as text instead.
 */
export function Scene({ name, className }: { name: SceneName; className?: string }) {
  const id = `oml-scene-${name}`;
  const Drawing = SCENES[name];
  return (
    <svg
      className={["scene", `scene--${name}`, className].filter(Boolean).join(" ")}
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Defs id={id} />
      <Drawing id={id} />
    </svg>
  );
}
