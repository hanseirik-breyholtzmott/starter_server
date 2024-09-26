import mongoose, { Schema, Document } from "mongoose";

//Interface
export interface IAddress {
  street: string | null;
  city: string | null;
  state?: string | null;
  postalCode: string | null;
  country?: string | null;
  additionalInfo?: string | null;
}

export interface IElectricityContract {
  userId: string;
  address: IAddress;
  contractName: string;
  contractStartDate: Date;
}

export interface IElectricityContractModel
  extends IElectricityContract,
    Document {}

//Schema
const AddressSchema = new Schema({
  street: { type: Schema.Types.String, required: false },
  city: { type: Schema.Types.String, required: false },
  state: { type: Schema.Types.String, required: false },
  country: { type: Schema.Types.String, required: false },
  postalCode: { type: Schema.Types.String, required: false },
});

const ElectricityContractSchema = new Schema(
  {
    userId: { type: Schema.Types.String, ref: "User" },
    address: { type: AddressSchema, default: null },
    contractName: { type: Schema.Types.String, required: true },
    contractStartDate: { type: Schema.Types.Date, required: true },
  },
  { timestamps: true }
);

//Model
const ElectricityContract = mongoose.model<IElectricityContractModel>(
  "ElectricityContract",
  ElectricityContractSchema
);

export default ElectricityContract;
