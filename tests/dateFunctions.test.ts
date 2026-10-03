import { describe, expect, it } from "vitest";
import { duringTimespan, intersectingTimespans } from "../server/utils/dateFunctions.js";
import type { IReservation } from "../server/models/Reservation.js";
import type { IAvailability } from "../server/models/Availability.js";

const date = (hour: number) => new Date(Date.UTC(2026, 9, 1) + hour * 60 * 60 * 1000);
const booked = [{ startdate: date(10), enddate: date(11) }] as IReservation[];
const window = { startdate: date(9), enddate: date(12) } as IAvailability;

describe("reservation intervals", () => {
  it("detects partial and containing overlaps", () => {
    expect(intersectingTimespans(date(9), date(10.5), booked)).toBe(true);
    expect(intersectingTimespans(date(10.5), date(11.5), booked)).toBe(true);
    expect(intersectingTimespans(date(9), date(12), booked)).toBe(true);
  });
  it("allows adjacent bookings", () => {
    expect(intersectingTimespans(date(9), date(10), booked)).toBe(false);
    expect(intersectingTimespans(date(11), date(12), booked)).toBe(false);
  });
  it("requires a positive interval inside availability", () => {
    expect(duringTimespan(date(9), date(12), window)).toBe(true);
    expect(duringTimespan(date(8), date(10), window)).toBe(false);
    expect(duringTimespan(date(10), date(10), window)).toBe(false);
  });
});
