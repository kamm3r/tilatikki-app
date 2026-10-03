import { type Document, Schema, Types, type Model, model } from "mongoose";
import { type IAvailability } from "./Availability.js";
import { type IReservation } from "./Reservation.js";

// For internal model definition only.
export interface ISpace extends Document {
  name: string;
  area?: number;
  premise: Types.ObjectId;
  building: Types.ObjectId;
  floor: number;
  availabilities: Types.ObjectId[] | IAvailability[];
  reservations: Types.ObjectId[] | IReservation[];
  mapPolygon?: { x: number; y: number }[];
  reservationLockOwner?: Types.ObjectId;
  reservationLockUntil?: Date;
}

// Typeguard to check if the value is of type ISpace[].
export function isSpaceList(value: ISpace[]): value is ISpace[] {
  return (
    Array.isArray(value) && value.every((element) => element instanceof Space)
  );
}

const spaceSchema = new Schema<ISpace>({
  name: { type: String, required: true, minlength: 1, maxlength: 50 },
  area: Number,
  premise: { type: Schema.Types.ObjectId, required: true, ref: "Premise" },
  building: { type: Schema.Types.ObjectId, required: true },
  floor: { type: Number, required: true },
  availabilities: [{ type: Schema.Types.ObjectId, ref: "Availability" }],
  reservations: [{ type: Schema.Types.ObjectId, ref: "Reservation" }],
  // A short-lived database lock keeps overlapping booking writes serial on standalone MongoDB.
  reservationLockOwner: Schema.Types.ObjectId,
  reservationLockUntil: Date,
  // Percent coordinates over the building's floor blueprint (0–100).
  mapPolygon: [{
    x: { type: Number, required: true, min: 0, max: 100 },
    y: { type: Number, required: true, min: 0, max: 100 },
  }],
});

const Space: Model<ISpace> = model<ISpace>("Space", spaceSchema);

export default Space;
