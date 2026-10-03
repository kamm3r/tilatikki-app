import { type IAvailability } from "../models/Availability.js";
import { type IReservation } from "../models/Reservation.js";

export const intersectingTimespans = (
  startdate: Date,
  enddate: Date,
  timespans: IAvailability[] | IReservation[]
) => {
  return timespans.some(
    (timespan) => startdate < timespan.enddate && timespan.startdate < enddate,
  );
};

export const duringTimespan = (
  startdate: Date,
  enddate: Date,
  timespan: IAvailability | IReservation
) => {
  return startdate < enddate &&
    timespan.startdate <= startdate &&
    enddate <= timespan.enddate;
};
