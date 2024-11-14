import mongoose, { Schema, Document } from "mongoose";

export interface IHoldingCompanyModel {
  name: string;
  registrationNumber: string;
  ownerId: mongoose.Types.ObjectId | string;
}

export interface IHoldingCompanyModel extends Document {}

const HoldingCompanySchema = new Schema(
  {
    name: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IHoldingCompanyModel>(
  "HoldingCompany",
  HoldingCompanySchema
);
