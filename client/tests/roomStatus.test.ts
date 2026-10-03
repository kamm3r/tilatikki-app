import { describe, expect, it } from "vitest";
import { getRoomStatus, type Availability } from "../src/utils/roomStatus";

const schedule: Availability = {
  _id: "schedule-1",
  space: "room-1",
  startdate: "2026-10-01T08:00:00.000Z",
  enddate: "2026-10-01T16:00:00.000Z",
  reservations: [{
    _id: "booking-1",
    startdate: "2026-10-01T10:00:00.000Z",
    enddate: "2026-10-01T11:00:00.000Z",
  }],
};

const date = (hour: number) => new Date(`2026-10-01T${String(hour).padStart(2, "0")}:00:00.000Z`);

describe("room map reservation status", () => {
  it("shows a room as available inside its availability window", () => {
    expect(getRoomStatus("room-1", [schedule], date(8), date(10))).toBe("available");
    expect(getRoomStatus("room-1", [schedule], date(11), date(12))).toBe("available");
  });

  it("shows a room as reserved when any part of the selected time overlaps a booking", () => {
    expect(getRoomStatus("room-1", [schedule], date(9), date(11))).toBe("reserved");
    expect(getRoomStatus("room-1", [schedule], date(10), date(12))).toBe("reserved");
  });

  it("shows a room as unavailable outside its schedule or without a schedule", () => {
    expect(getRoomStatus("room-1", [schedule], date(7), date(9))).toBe("unavailable");
    expect(getRoomStatus("room-2", [schedule], date(8), date(9))).toBe("unavailable");
  });
});
