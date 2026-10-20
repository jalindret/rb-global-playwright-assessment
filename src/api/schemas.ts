import { z } from "zod";
const nonBlank = z.string().trim().min(1);
const count = z.number().finite().int().nonnegative();
const country = z.object({ country: nonBlank, countryCode: nonBlank });
export const directorySchema = z.object({
  yards: z.array(
    z.object({
      name: nonBlank,
      type: z.enum(["Satellite", "Permanent"]),
      address: country,
    }),
  ),
});
const categoryIdentity = z.object({ categoryLocalized: nonBlank });
const categoryVariants = z.discriminatedUnion("quantityKind", [
  categoryIdentity.extend({
    quantityKind: z.literal("reported"),
    totalAssets: count,
  }),
  categoryIdentity.extend({ quantityKind: z.literal("unreported") }),
]);
/** The wire contract permits absent quantities; expose distinct, narrowable domain states. */
export const categorySchema = z.preprocess((input) => {
  if (typeof input !== "object" || input === null) return input;
  return {
    ...input,
    quantityKind: Object.hasOwn(input, "totalAssets")
      ? "reported"
      : "unreported",
  };
}, categoryVariants);
export const yardSchema = z.object({
  yardDetails: z.object({
    name: nonBlank,
    type: z.enum(["Satellite", "Permanent"]),
    address: country.extend({
      addressLine1: nonBlank,
      city: nonBlank,
      provinceStateCode: nonBlank,
      zipPostalCode: nonBlank,
    }),
    contactPhone: nonBlank.regex(/\d/),
    pickupHoursFrom: nonBlank.regex(/^\d{2}:\d{2}$/),
    pickupHoursTo: nonBlank.regex(/^\d{2}:\d{2}$/),
  }),
  upcomingEvents: z.array(
    z
      .object({
        event_advertised_name: nonBlank,
        event_locality: nonBlank,
        event_start_date_time: z.iso.datetime(),
        event_end_date_time: z.iso.datetime(),
      })
      .refine(
        (e) =>
          Date.parse(e.event_end_date_time) >=
          Date.parse(e.event_start_date_time),
        "Event ends before it starts",
      ),
  ),
  itemsInYard: z.array(z.object({ categories: z.array(categorySchema) })),
});
export const searchPageSchema = z.object({
  results: z
    .object({
      totalAmount: count,
      returnedAmount: count,
      records: z.array(z.object({ assetDescription: nonBlank })),
    })
    .refine(
      (r) =>
        r.returnedAmount === r.records.length &&
        r.returnedAmount <= r.totalAmount,
      "Returned count must match records and cannot exceed the full hit count",
    ),
});
/** Count-only wire responses omit records; the normalized domain union makes this explicit. */
export const searchCountSchema = z.object({
  results: z.object({
    totalAmount: count,
    returnedAmount: z.literal(0),
  }),
});
export type DirectoryPayload = z.infer<typeof directorySchema>;
export type YardPayload = z.infer<typeof yardSchema>;
export type Category = z.infer<typeof categorySchema>;
export type SearchPagePayload = z.infer<typeof searchPageSchema>;
export type SearchCountPayload = z.infer<typeof searchCountSchema>;
/** Validate record-bearing responses at the HTTP boundary. */
export function parseSearchPage(input: unknown): SearchPagePayload {
  return searchPageSchema.parse(input);
}

/** The count endpoint omits records; reject that field before Zod strips it. */
export function parseSearchCount(input: unknown): SearchCountPayload {
  const raw = z
    .object({ results: z.record(z.string(), z.unknown()) })
    .parse(input);
  if (Object.hasOwn(raw.results, "records"))
    throw new Error("Count-only response unexpectedly contains records");
  return searchCountSchema.parse(input);
}
