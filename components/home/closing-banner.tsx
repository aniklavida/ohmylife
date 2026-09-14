import { Script } from "../primitives/script";

/**
 * The foot of the home page — a warm plum banner that says, in the
 * product's own voice, what this place is and whose it is.
 */
export function ClosingBanner() {
  return (
    <aside className="closing-banner" aria-labelledby="closing-banner-heading">
      <svg className="closing-banner__sprig" viewBox="0 0 160 160" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <path className="closing-banner__stem" d="M26 150 C60 118 92 78 132 20" />
        <path className="closing-banner__leaf" d="M58 116 C40 100 38 80 50 70 C62 84 66 102 58 116 Z" />
        <path className="closing-banner__leaf" d="M72 98 C92 96 106 84 108 70 C90 70 78 82 72 98 Z" />
        <path className="closing-banner__leaf" d="M90 72 C74 58 74 40 86 30 C96 44 98 60 90 72 Z" />
        <path className="closing-banner__leaf" d="M106 50 C124 50 136 40 140 26 C122 26 110 36 106 50 Z" />
      </svg>
      <div className="closing-banner__words">
        <h2 id="closing-banner-heading" className="closing-banner__title">
          Self-hosted. Your life. Always yours.
        </h2>
        <p className="closing-banner__body">
          Kept current while you&apos;re away by whichever AI you already run, in
          plain files on your own machine that open without this app.
        </p>
      </div>
      <Script rotate={-3} tone="cream" className="closing-banner__sign">
        Live gently.
      </Script>
    </aside>
  );
}
