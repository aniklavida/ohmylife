// One envelope, many kinds — see docs/SPEC.md §6.
//
// Every entry in a life shares this envelope and adds typed fields per kind.
// Three product decisions are enforced here, by the type, not by convention:
//
//   - `someday` cannot carry `occurred_at` at all, so it structurally cannot
//     hold a due date. The field is omitted from its shape, and the object is
//     `.strict()`, so an attempt to smuggle a date in fails validation instead
//     of being silently accepted.
//   - `habit` has only an `occurrences` list. There is no `streak` field to
//     compute from it, because a strict schema rejects unknown keys.
//   - `source` is required on every kind. A write with no source is refused,
//     so provenance is never inferred after the fact.
//
// This file is imported by the file writer/reader (lib/entry/read.ts,
// lib/entry/write.ts) and will be imported by the MCP tool layer later. It is
// the one place the format is defined — see docs/STRUCTURE.md, "One schema
// definition, three consumers."
import { z } from "zod";

export const AREAS = [
  "memories",
  "people",
  "money",
  "body",
  "papers",
  "decisions",
  "someday",
  "tasks",
  "projects",
  "goals",
  "habits",
  "areas",
] as const;
export type Area = (typeof AREAS)[number];

export const KINDS = [
  "memory",
  "person",
  "account",
  "obligation",
  "saving_goal",
  "appointment",
  "measurement",
  "document",
  "decision",
  "someday",
  "task",
  "project",
  "goal",
  "habit",
  "area",
] as const;
export type Kind = (typeof KINDS)[number];

/**
 * Which area each kind belongs to, so `area` and `kind` cannot drift apart.
 *
 * Declared with `as const satisfies` rather than `: Record<Kind, Area>` so
 * that indexing it with a generic `K extends Kind` (in `kind()` below) still
 * yields the specific literal area for that kind, not the widened `Area`
 * union — otherwise every kind's schema would accept any of the twelve areas.
 */
export const AREA_FOR_KIND = {
  memory: "memories",
  person: "people",
  account: "money",
  obligation: "money",
  saving_goal: "money",
  appointment: "body",
  measurement: "body",
  document: "papers",
  decision: "decisions",
  someday: "someday",
  task: "tasks",
  project: "projects",
  goal: "goals",
  habit: "habits",
  area: "areas",
} as const satisfies Record<Kind, Area>;

// "user", "agent:claude", "import:google-photos" — provenance is a closed shape,
// not free text, so it can be rendered and filtered rather than merely stored.
const SOURCE_PATTERN = /^(user|agent:[a-z0-9][a-z0-9._-]*|import:[a-z0-9][a-z0-9._-]*)$/i;

export const sourceSchema = z
  .string()
  .min(1, "source is required")
  .regex(SOURCE_PATTERN, 'source must be "user", "agent:<name>", or "import:<what>"');

/** Stable, human-readable, never reused — see docs/SPEC.md §6. */
export const idSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id must be a lowercase, hyphen-separated slug");

// Deliberately loose: a memory is often "summer 2019", not a calendar date.
// Accepts an ISO date/month/year/datetime, or a fuzzy phrase ending in a year.
const occurredAtSchema = z
  .string()
  .min(1)
  .regex(
    /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})?)?)?)?$|^[A-Za-z][A-Za-z0-9 .'-]*\d{4}$/,
    "occurred_at must be an ISO-style date/month/year/datetime, or a fuzzy phrase ending in a year",
  );

// Set by the write layer (lib/entry/write.ts), never hand-authored — but still
// validated as a real ISO 8601 timestamp so a corrupted file is caught on read.
const timestampSchema = z.iso.datetime({ offset: true });

const linkTypeSchema = z.string().min(1).max(60);

const linkSchema = z.object({
  type: linkTypeSchema,
  target: idSchema,
});
export type EntryLink = z.infer<typeof linkSchema>;

const attachmentSchema = z.string().min(1);
const titleSchema = z
  .string()
  .min(1)
  .max(200)
  .refine((value) => !value.includes("\n"), "title must be one line");

/**
 * Fields every entry carries. `occurred_at` is included here and removed
 * explicitly for `someday` — see `withoutOccurredAt` below — rather than made
 * optional-and-ignored, so the ban is structural rather than a convention.
 *
 * There is deliberately no `sensitivity` field: docs/SPEC.md §9 settles that
 * there are "no `open` / `private` / `sealed` per-entry visibility tiers",
 * because neither a tier nor encryption stops a hosted model retaining what
 * it was already shown. Anyone who wants nothing to leave their machine
 * points WeAllHateLife at a local model instead.
 */
const envelopeShape = {
  id: idSchema,
  title: titleSchema,
  body: z.string().optional(),
  occurred_at: occurredAtSchema.optional(),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
  source: sourceSchema,
  confidence: z.number().min(0).max(1).optional(),
  links: z.array(linkSchema).default([]),
  attachments: z.array(attachmentSchema).default([]),
  // There is no delete tool anywhere in this product (docs/SPEC.md §8). The
  // only removal is archiving, and archiving is only ever this timestamp
  // being set or cleared — see lib/entry/archive.ts.
  archived_at: timestampSchema.optional(),
};

function withoutOccurredAt<T extends Record<string, unknown>>(
  shape: T,
): Omit<T, "occurred_at"> {
  const { occurred_at: _occurredAt, ...rest } = shape;
  return rest;
}

// `Extra` is its own type parameter (rather than the wider `z.ZodRawShape`
// annotation on the parameter) so that TypeScript infers each call's actual
// field names from the argument, instead of erasing them to a generic index
// signature that would make every per-kind field invisible to callers.
function kind<K extends Kind, Extra extends z.ZodRawShape>(name: K, extra: Extra) {
  return z
    .object({
      ...envelopeShape,
      area: z.literal(AREA_FOR_KIND[name]),
      kind: z.literal(name),
      ...extra,
    })
    .strict();
}

// `someday` never receives `occurred_at` in its shape at all — see the module
// comment. Every other kind is free to record when it happened or applies.
function kindWithoutDueDate<K extends Kind, Extra extends z.ZodRawShape>(name: K, extra: Extra) {
  return z
    .object({
      ...withoutOccurredAt(envelopeShape),
      area: z.literal(AREA_FOR_KIND[name]),
      kind: z.literal(name),
      ...extra,
    })
    .strict();
}

export const memorySchema = kind("memory", {
  place: z.string().min(1).optional(),
  people: z.array(idSchema).default([]),
  media: z.array(attachmentSchema).default([]),
  mood: z.string().min(1).optional(),
});

export const personSchema = kind("person", {
  relationship: z.string().min(1).optional(),
  last_contact_at: occurredAtSchema.optional(),
  // A gentle wish, never a rule — see docs/SPEC.md §6.
  contact_intent: z.string().min(1).optional(),
  open_threads: z.array(z.string().min(1)).default([]),
});

export const accountSchema = kind("account", {
  institution: z.string().min(1),
  // Named `account_type` rather than the spec table's bare `kind` — that name
  // collides with the entry's own `kind` discriminator ("account"). The
  // rename is deliberate and lives here, so the divergence from the table in
  // docs/SPEC.md §6 is visible at the field rather than left to be guessed.
  account_type: z.string().min(1),
  // A balance is always a reading with a date, never a live figure — the two
  // fields are required together so one cannot be recorded without the other.
  balance: z.number(),
  balance_as_of: occurredAtSchema,
});

export const obligationSchema = kind("obligation", {
  amount: z.number(),
  cadence: z.string().min(1),
  next_due: occurredAtSchema.optional(),
  counterparty: z.string().min(1),
});

export const savingGoalSchema = kind("saving_goal", {
  target: z.number(),
  saved: z.number(),
  // Its absence is not a failure — see docs/SPEC.md §6.
  target_date: occurredAtSchema.optional(),
});

export const appointmentSchema = kind("appointment", {
  with: z.string().min(1),
  at: occurredAtSchema,
  location: z.string().min(1).optional(),
  // Held for a sentence to observe, never rendered as a number — see
  // docs/SPEC.md, "A fourth, quieter one."
  reschedule_count: z.number().int().min(0).default(0),
});

export const measurementSchema = kind("measurement", {
  metric: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  taken_at: occurredAtSchema,
});

export const documentSchema = kind("document", {
  doc_kind: z.string().min(1),
  issuer: z.string().min(1).optional(),
  identifier_last4: z
    .string()
    .regex(/^\d{4}$/, "identifier_last4 must be exactly four digits")
    .optional(),
  issued_at: occurredAtSchema.optional(),
  expires_at: occurredAtSchema.optional(),
  physical_location: z.string().min(1).optional(),
});

export const decisionSchema = kind("decision", {
  chose: z.string().min(1),
  rejected: z.array(z.string().min(1)).default([]),
  because: z.string().min(1),
  would_change_my_mind: z.string().min(1).optional(),
  revisit_after: occurredAtSchema.optional(),
});

export const somedaySchema = kindWithoutDueDate("someday", {
  note: z.string().min(1).optional(),
});

export const taskSchema = kind("task", {
  due: occurredAtSchema.optional(),
  state: z.enum(["open", "waiting", "done"]).default("open"),
  for_project: idSchema.optional(),
});

export const projectSchema = kind("project", {
  description: z.string().min(1).optional(),
  status: z.enum(["active", "paused", "done"]).default("active"),
  for_goal: idSchema.optional(),
});

export const goalSchema = kind("goal", {
  description: z.string().min(1).optional(),
  target_date: occurredAtSchema.optional(),
});

// `occurrences` holds timestamps only. There is no `streak` field, and none is
// computed from this list — a streak cannot be broken if it is never counted.
export const habitSchema = kind("habit", {
  occurrences: z.array(timestampSchema).default([]),
});

// A broad, ongoing area of responsibility — "Health", "Family", "Home" — not
// one of the twelve data areas, but a life-organising label a project, goal
// or task can eventually point at. Deliberately thin: it exists to be named
// and described, not to carry its own due dates or status.
export const areaSchema = kind("area", {
  description: z.string().min(1).optional(),
});

export const entrySchema = z.discriminatedUnion("kind", [
  memorySchema,
  personSchema,
  accountSchema,
  obligationSchema,
  savingGoalSchema,
  appointmentSchema,
  measurementSchema,
  documentSchema,
  decisionSchema,
  somedaySchema,
  taskSchema,
  projectSchema,
  goalSchema,
  habitSchema,
  areaSchema,
]);

export type Entry = z.infer<typeof entrySchema>;
export type EntryInput = z.input<typeof entrySchema>;

export function schemaForKind(k: Kind) {
  const schemas: Record<Kind, z.ZodTypeAny> = {
    memory: memorySchema,
    person: personSchema,
    account: accountSchema,
    obligation: obligationSchema,
    saving_goal: savingGoalSchema,
    appointment: appointmentSchema,
    measurement: measurementSchema,
    document: documentSchema,
    decision: decisionSchema,
    someday: somedaySchema,
    task: taskSchema,
    project: projectSchema,
    goal: goalSchema,
    habit: habitSchema,
    area: areaSchema,
  };
  return schemas[k];
}

/**
 * Every field name a given kind's schema accepts — envelope fields plus
 * that kind's own. Used by the MCP write tools (mcp/tools/create-entry.ts,
 * update-entry.ts) to keep only the fields relevant to a kind out of a
 * single, kind-agnostic tool call, without hand-duplicating the field list
 * anywhere else. Reads the shape directly off the same schema objects
 * `schemaForKind` returns, so this can never drift from what actually
 * validates.
 */
export function fieldsForKind(k: Kind): string[] {
  const shape = (schemaForKind(k) as z.ZodObject<z.ZodRawShape>).shape;
  return Object.keys(shape);
}
