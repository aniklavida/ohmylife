import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

interface ProseProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  id?: string;
}

function classes(base: string, className?: string): string {
  return [base, className].filter(Boolean).join(" ");
}

type Rest = Omit<ComponentPropsWithoutRef<"p">, "className" | "children">;

// Serif display and body, sans labels. Body copy is serif, not sans: it is
// prose, not chrome. `Label` is the one place sans is reached for outside
// nav/UI chrome itself. Handwritten script lives in `Script`, for accents
// only.

/** A large serif headline — "Nothing needs you today," an area title. */
export function Display({ children, as: As = "h1", className, ...rest }: ProseProps & Rest) {
  return (
    <As className={classes("prose-display", className)} {...rest}>
      {children}
    </As>
  );
}

/** A smaller serif heading, one step below `Display`. */
export function Heading({ children, as: As = "h2", className, ...rest }: ProseProps & Rest) {
  return (
    <As className={classes("prose-heading", className)} {...rest}>
      {children}
    </As>
  );
}

/** Serif body prose. */
export function Body({ children, as: As = "p", className, ...rest }: ProseProps & Rest) {
  return (
    <As className={classes("prose-body", className)} {...rest}>
      {children}
    </As>
  );
}

/** A small sans, uppercase UI label — an eyebrow, a nav item, a caption. */
export function Label({ children, as: As = "span", className, ...rest }: ProseProps & Rest) {
  return (
    <As className={classes("prose-label", className)} {...rest}>
      {children}
    </As>
  );
}
