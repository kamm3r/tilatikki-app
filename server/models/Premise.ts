import { type Document, Schema, Types, type Model, model } from "mongoose";

// For internal model definition only.
export interface IPremise extends Document {
  location?: { latitude: number; longitude: number };
  name: string;
  address: string;
  users: Types.ObjectId[];
  premise_facade: string[];
  buildings: Types.ObjectId[]
}

// Typeguard to check if the value is of type IPremise[].
export function isPremiseList(value: IPremise[]): value is IPremise[] {
  return (
    Array.isArray(value) && value.every((element) => element instanceof Premise)
  );
}

const premiseSchema = new Schema<IPremise>({
  location: {
    type: new Schema({ latitude: { type: Number, required: true, min: -90, max: 90 }, longitude: { type: Number, required: true, min: -180, max: 180 } }, { _id: false }),
    default: undefined,
  },
  name: { type: String, required: true, minlength: 1, maxlength: 100 },
  address: { type: String, required: true, minlength: 1, maxlength: 100 },
  users: [{ type: Schema.Types.ObjectId, ref: "User" }],
  premise_facade: [],
  buildings: [{type: Schema.Types.ObjectId,ref: "Building"}],
});

const Premise: Model<IPremise> = model<IPremise>("Premise", premiseSchema);

export default Premise;
