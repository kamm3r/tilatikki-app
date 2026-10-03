import { Document, Schema, Types, Model, model } from "mongoose";

// For internal model definition only.
export interface IReservation extends Document {
  creator: Types.ObjectId;
  startdate: Date;
  enddate: Date;
  premise: Types.ObjectId;
  space: Types.ObjectId;
  availability: Types.ObjectId;
}

// Typeguard to check if the value is of type IReservation[].
export function isReservationList(
  value: IReservation[]
): value is IReservation[] {
  return (
    Array.isArray(value) &&
    value.every((element) => element instanceof Reservation)
  );
}

const reservationSchema = new Schema<IReservation>({
  // Creator is only required for availabilities created by users.
  // Availabilities that might be added from APIs dont need a creator.
  creator: { type: Schema.Types.ObjectId, ref: "User" },
  startdate: { type: Date, required: true },
  enddate: { type: Date, required: true },
  premise: { type: Schema.Types.ObjectId, ref: "Premise" },
  space: { type: Schema.Types.ObjectId, ref: "Space" },
  availability: { type: Schema.Types.ObjectId, ref: "Availability" },
});

const Reservation: Model<IReservation> = model<IReservation>(
  "Reservation",
  reservationSchema
);

export default Reservation;
