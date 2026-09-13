"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { Script } from "../primitives/script";
import {
  BodyIcon,
  DecisionsIcon,
  MemoriesIcon,
  MoneyIcon,
  PapersIcon,
  PeopleIcon,
  SomedayIcon,
  SunriseMarkIcon,
  TendedIcon,
} from "./icons";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

// The seven areas that make this a life rather than a task list
// (docs/SPEC.md §5), plus Today and the tending record. The ordinary five
// (Tasks · Projects · Goals · Habits · Areas) live inside "the place"
// (docs/ROADMAP.md step 5) once it exists, not duplicated into the rail.
const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Today", icon: SunriseMarkIcon },
  { href: "/areas/memories", label: "Memories", icon: MemoriesIcon },
  { href: "/areas/people", label: "People", icon: PeopleIcon },
  { href: "/areas/money", label: "Money", icon: MoneyIcon },
  { href: "/areas/body", label: "Body", icon: BodyIcon },
  { href: "/areas/papers", label: "Papers", icon: PapersIcon },
  { href: "/areas/decisions", label: "Decisions", icon: DecisionsIcon },
  { href: "/areas/someday", label: "Someday", icon: SomedayIcon },
  { href: "/tended", label: "Tended", icon: TendedIcon },
];

/**
 * The full-height sidebar: deep forest-green, full height, a serif wordmark
 * with a small sunrise mark and a tagline beneath it, fine-line icons, and
 * a handwritten note at the foot of the nav.
 *
 * Every route beyond "/" is built in docs/ROADMAP.md step 5 onward. Linking
 * to them now renders the navigation the product is meant to have, and is
 * not a claim that they exist yet — visiting one before then reaches Next's
 * own 404, the same as any other unbuilt route in an in-progress app.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="sidebar" aria-label="Areas of your life">
      <div className="sidebar__brand">
        <SunriseMarkIcon className="sidebar__mark" width={26} height={26} />
        <div>
          <p className="sidebar__wordmark">OhMyLife</p>
          <p className="sidebar__tagline">a life, kept while you&apos;re away</p>
        </div>
      </div>

      <ul className="sidebar__nav">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={active ? "sidebar__link sidebar__link--active" : "sidebar__link"}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="sidebar__icon" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="sidebar__foot">
        <Script rotate={-1.5} tone="cream" className="sidebar__note">
          Still here when you&apos;re ready.
        </Script>
      </div>
    </nav>
  );
}
