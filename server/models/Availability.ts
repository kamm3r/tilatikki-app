import { Document, Schema, Types, Model, model } from "mongoose";
import { type IReservation } from "./Reservation.js";

// For internal model definition only.
export interface IAvailability extends Document {
  creator: Types.ObjectId;
  startdate: Date;
  enddate: Date;
  premise: Types.ObjectId;
  space: Types.ObjectId;
  reservations: Types.ObjectId[] | IReservation[];
}

// Typeguard to check if the value is of type IAvailability.
export function isAvailability(value: IAvailability): value is IAvailability {
  return (
    value &&
    value._id instanceof Types.ObjectId &&
    value.startdate instanceof Date &&
    value.enddate instanceof Date &&
    value.creator instanceof Types.ObjectId &&
    value.premise instanceof Types.ObjectId &&
    value.space instanceof Types.ObjectId &&
    value.reservations.every(
      (element) => element instanceof Types.ObjectId
    )
  );
}

// Typeguard to check if the value is of type IAvailability[].
export function isAvailabilityList(
  value: Types.ObjectId[] | IAvailability[]
) {
  return (
    Array.isArray(value) &&
    value.every((element) => element instanceof Availability)
  );
}

const availabilitySchema = new Schema<IAvailability>({
  // Creator is only required for availabilities created by users.
  // Availabilities that might be added from APIs dont need a creator.
  creator: { type: Schema.Types.ObjectId, ref: "User" },
  startdate: { type: Date, required: true },
  enddate: { type: Date, required: true },
  premise: { type: Schema.Types.ObjectId, ref: "Premise" },
  space: { type: Schema.Types.ObjectId, ref: "Space" },
  reservations: [{ type: Schema.Types.ObjectId, ref: "Reservation" }],
});

const Availability: Model<IAvailability> = model<IAvailability>(
  "Availability",
  availabilitySchema
);

export default Availability;
