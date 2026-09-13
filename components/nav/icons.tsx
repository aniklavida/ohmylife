import type { SVGProps } from "react";

// Fine-line nav icons — design brief: "fine-line icons." Hand-drawn as plain
// stroked SVG rather than pulled from an icon library, so the set matches
// the product's own hand rather than a generic one. Every icon shares the
// same 24x24 grid, 1.5px stroke and rounded caps/joins.

function base(props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return {
    viewBox: "0 0 24 24",
    width: 20,
    height: 20,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

/** The sunrise mark — beside the wordmark, and doubling as "Today" in the nav. */
export function SunriseMarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M4 16.5h16" />
      <path d="M7 16.5a5 5 0 0 1 10 0" />
      <path d="M12 6.5v2.2M6.6 10l1.6 1.5M17.4 10l-1.6 1.5" />
    </svg>
  );
}

export function MemoriesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M4 15.5l4.5-4 3 2.5 3.5-4L20 14" />
      <circle cx="9" cy="9" r="1.4" />
    </svg>
  );
}

export function PeopleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8.5" r="2.6" />
      <path d="M4 19c0-2.9 2.2-5 5-5s5 2.1 5 5" />
      <circle cx="17" cy="9" r="2" />
      <path d="M15.5 14.2c2.3.3 3.9 2.1 3.9 4.8" />
    </svg>
  );
}

export function MoneyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M4 8.5c2 1.4 4.6 1.4 8 0s6-1.4 8 0" />
      <path d="M4 15.5c2 1.4 4.6 1.4 8 0s6-1.4 8 0" />
      <path d="M4 8.5v7M20 8.5v7" />
    </svg>
  );
}

export function BodyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M12 19.2S4.8 14.6 4.8 9.4A3.6 3.6 0 0 1 12 8a3.6 3.6 0 0 1 7.2 1.4c0 5.2-7.2 9.8-7.2 9.8Z" />
    </svg>
  );
}

export function PapersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M7 3.5h7l3.5 3.5V20.5h-10.5Z" />
      <path d="M14 3.5v3.5h3.5" />
      <path d="M9 13h6M9 16.3h6" />
    </svg>
  );
}

export function DecisionsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="12" r="2" />
      <path d="M6 8v3.5c0 2 1.6 2.6 3.4 2.6H16M6 16v-3" />
    </svg>
  );
}

export function SomedayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M7.5 16A4 4 0 0 1 7 8a5 5 0 0 1 9.7-1.6A3.7 3.7 0 0 1 17 16H7.5Z" />
    </svg>
  );
}

export function TendedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M12 4.5c3.6 1.5 6 2 6 2 0 7.8-3.4 11-6 13-2.6-2-6-5.2-6-13 0 0 2.4-.5 6-2Z" />
      <path d="M9.3 12.2l1.9 1.9 3.5-3.9" />
    </svg>
  );
}
