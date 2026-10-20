import { expect } from "@playwright/test";
import type { YardPayload } from "./schemas";

/** A2.3 permits an empty schedule; scheduled events must include this yard. */
export function assertUpcomingEvents(
  events: YardPayload["upcomingEvents"],
): void {
  console.log("Upcoming events:", events.length);
  if (events.length === 0) return;
  expect(
    events.some((event) =>
      /Edmonton|Nisku/i.test(
        event.event_advertised_name + " " + event.event_locality,
      ),
    ),
  ).toBe(true);
}
