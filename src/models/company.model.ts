import mongoose, { Schema, Document } from "mongoose";

//Models

interface IAddress {
  street: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  additionalInfo?: string | null;
}

export interface ICompany {
  name: string;
  address: IAddress;
  industryTags: string[];
  email: string | null;
  phone: string | null;
  website?: string | null;
  establishedDate: Date;
  employees: number;
  active: boolean;
}

export interface ICompanyModel extends ICompany, Document {}

//Schema
const AddressSchema = new Schema({
  street: { type: Schema.Types.String, required: false },
  city: { type: Schema.Types.String, required: false },
  state: { type: Schema.Types.String, required: false },
  country: { type: Schema.Types.String, required: false },
  postalCode: { type: Schema.Types.String, required: false },
});

const CompanySchema: Schema<ICompanyModel> = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  address: { type: AddressSchema, default: null },
  industryTags: { type: [Schema.Types.String], default: [] },
  email: { type: Schema.Types.String, required: true, unique: true },
  phone: { type: Schema.Types.String, default: null },
  website: { type: Schema.Types.String, default: null },
  establishedDate: { type: Schema.Types.Date, required: true },
  employees: { type: Schema.Types.Number, required: true },
  active: { type: Schema.Types.Boolean, default: true },
});
