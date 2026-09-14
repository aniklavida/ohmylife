// The three product decisions that must be enforced by the type, not by
// convention (docs/SPEC.md §6), plus the shared rules every kind inherits.
import { describe, expect, it } from "vitest";
import { entrySchema } from "../lib/entry/schema";

const base = {
  id: "test-entry",
  title: "A test entry",
  created_at: "2026-09-13T10:00:00Z",
  updated_at: "2026-09-13T10:00:00Z",
};

describe("someday cannot hold a due date", () => {
  it("refuses occurred_at on a someday entry", () => {
    const result = entrySchema.safeParse({
      ...base,
      area: "someday",
      kind: "someday",
      occurred_at: "2027-01-01",
      source: "user",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a someday entry with no date at all", () => {
    const result = entrySchema.safeParse({
      ...base,
      area: "someday",
      kind: "someday",
      note: "Learn to sail.",
      source: "user",
    });
    expect(result.success).toBe(true);
  });
});

describe("habits have no streak field", () => {
  it("refuses an unknown `streak` key on a habit entry", () => {
    const result = entrySchema.safeParse({
      ...base,
      area: "habits",
      kind: "habit",
      occurrences: ["2026-09-01T07:00:00Z", "2026-09-02T07:00:00Z"],
      streak: 2,
      source: "user",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a habit entry with only occurrences", () => {
    const result = entrySchema.safeParse({
      ...base,
      area: "habits",
      kind: "habit",
      occurrences: ["2026-09-01T07:00:00Z"],
      source: "user",
    });
    expect(result.success).toBe(true);
  });
});

describe("source is required", () => {
  it("refuses a write with no source", () => {
    const result = entrySchema.safeParse({
      ...base,
      area: "someday",
      kind: "someday",
      note: "No provenance.",
    });
    expect(result.success).toBe(false);
  });

  it("refuses a source that is not user, agent:<name>, or import:<what>", () => {
    const result = entrySchema.safeParse({
      ...base,
      area: "someday",
      kind: "someday",
      note: "Bad source.",
      source: "the-user-probably",
    });
    expect(result.success).toBe(false);
  });

  it.each(["user", "agent:claude", "import:google-photos"])(
    "accepts source %s",
    (source) => {
      const result = entrySchema.safeParse({
        ...base,
        area: "someday",
        kind: "someday",
        note: "Fine.",
        source,
      });
      expect(result.success).toBe(true);
    },
  );
});

describe("a balance is always a dated reading", () => {
  it("refuses an account with a balance but no balance_as_of", () => {
    const result = entrySchema.safeParse({
      ...base,
      area: "money",
      kind: "account",
      institution: "City Bank",
      account_type: "savings",
      balance: 1000,
      source: "user",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an account with balance and balance_as_of together", () => {
    const result = entrySchema.safeParse({
      ...base,
      area: "money",
      kind: "account",
      institution: "City Bank",
      account_type: "savings",
      balance: 1000,
      balance_as_of: "2026-09-01",
      source: "user",
    });
    expect(result.success).toBe(true);
  });
});

describe("area and kind cannot drift apart", () => {
  it("refuses a memory filed under the wrong area", () => {
    const result = entrySchema.safeParse({
      ...base,
      area: "people",
      kind: "memory",
      title: "Mismatched",
      source: "user",
    });
    expect(result.success).toBe(false);
  });
});

describe("the area kind — a broad area of responsibility, not one of the twelve data areas", () => {
  it("accepts an area entry with only a description", () => {
    const result = entrySchema.safeParse({
      ...base,
      area: "areas",
      kind: "area",
      description: "Sleep, the dentist, the ordinary maintenance of a body.",
      source: "user",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an area entry with no description at all", () => {
    const result = entrySchema.safeParse({
      ...base,
      area: "areas",
      kind: "area",
      source: "user",
    });
    expect(result.success).toBe(true);
  });

  it("refuses an area entry filed under a different area", () => {
    const result = entrySchema.safeParse({
      ...base,
      area: "someday",
      kind: "area",
      source: "user",
    });
    expect(result.success).toBe(false);
  });
});

describe("title is one line", () => {
  it("refuses a title containing a newline", () => {
    const result = entrySchema.safeParse({
      ...base,
      title: "Line one\nLine two",
      area: "someday",
      kind: "someday",
      source: "user",
    });
    expect(result.success).toBe(false);
  });
});
