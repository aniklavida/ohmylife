// `get_life_schema` — called first by any agent, so it discovers the shape
// of a life (and what it may currently read) rather than guessing. See
// docs/SPEC.md §9.
import { z } from "zod";
import {
  AREA_FOR_KIND,
  AREAS,
  KINDS,
  SENSITIVITIES,
} from "../../lib/entry/schema";

export const name = "get_life_schema";

export const config = {
  title: "Get life schema",
  description:
    "Returns every area and kind this server knows, which kind belongs to " +
    "which area, and what this agent is currently allowed to read. Call " +
    "this first, before reading or writing anything.",
  inputSchema: {},
};

export async function handler() {
  const schema = {
    areas: AREAS,
    kinds: KINDS,
    area_for_kind: AREA_FOR_KIND,
    sensitivities: SENSITIVITIES,
    access: {
      // The privacy model (docs/SPEC.md §11) is an open product decision,
      // not yet implemented — see DECISIONS.md, "Pending Anik." Stating
      // that plainly here is required by the project's truthfulness rule:
      // this server does not gate reads by sensitivity yet, so it must not
      // claim that it does.
      enforced: false,
      readable_areas: AREAS,
      writable_areas: AREAS,
      note:
        "No access policy is implemented yet. Every area is currently " +
        "readable and writable by any connected agent, regardless of an " +
        "entry's sensitivity field. request_access records a request for " +
        "the record, but nothing is gated on it in this version.",
    },
  };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(schema, null, 2) }],
  };
}
