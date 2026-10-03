export type Booking = { _id: string; startdate: string; enddate: string };

export type Availability = {
  _id: string;
  space: string;
  startdate: string;
  enddate: string;
  reservations: Booking[];
};

export type RoomStatus = "available" | "reserved" | "unavailable";

export function getRoomStatus(
  roomId: string,
  schedules: Availability[],
  start: Date,
  end: Date,
): RoomStatus {
  const bookableWindows = schedules.filter((schedule) =>
    schedule.space === roomId &&
    new Date(schedule.startdate) <= start &&
    end <= new Date(schedule.enddate));

  if (bookableWindows.length === 0) return "unavailable";

  const isReserved = bookableWindows.some((schedule) => schedule.reservations.some((booking) =>
    start < new Date(booking.enddate) && new Date(booking.startdate) < end));

  return isReserved ? "reserved" : "available";
}
