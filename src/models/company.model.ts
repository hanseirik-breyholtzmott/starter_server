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

interface ISharePrice {
  shareClassId: mongoose.Types.ObjectId;
  price: number;
}

interface IValuation {
  date: Date;
  totalValue: number;
  sharePrices: ISharePrice[];
}

export interface IShareClass {
  _id?: mongoose.Types.ObjectId;
  name: string;
  votingRights: boolean;
  dividendRights: boolean;
  totalShares?: number;
  parValue?: number;
  liquidationPreference?: number;
}

interface IDocument {
  name: string;
  type: string;
  fileUrl: string;
  uploadedAt: Date;
}

export interface ICompany {
  _id: mongoose.Types.ObjectId;
  name: string;
  address?: IAddress;
  industryTags?: string[];
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  establishedDate?: Date;
  registrationNumber: string;
  employees?: number;
  active: boolean;
  valuation?: number;
  shareClasses?: IShareClass[];
  valuations?: IValuation[];
  documents?: IDocument[];
}

export interface ICompanyModel extends Omit<ICompany, "_id">, Document {}

//Schema
const AddressSchema = new Schema({
  street: { type: Schema.Types.String, required: true },
  city: { type: Schema.Types.String, required: true },
  state: { type: Schema.Types.String, required: true },
  country: { type: Schema.Types.String, required: true },
  postalCode: { type: Schema.Types.String, required: true },
  additionalInfo: { type: Schema.Types.String, required: false },
});

const ShareClassSchema = new Schema<IShareClass>({
  name: { type: Schema.Types.String, required: true },
  votingRights: { type: Schema.Types.Boolean, required: true },
  dividendRights: { type: Schema.Types.Boolean, required: true },
  totalShares: { type: Schema.Types.Number, required: true },
  parValue: { type: Schema.Types.Number, default: 0 },
  liquidationPreference: { type: Schema.Types.Number, default: 0 },
});

const SharePriceSchema = new Schema<ISharePrice>({
  shareClassId: {
    type: Schema.Types.ObjectId,
    ref: "ShareClass",
    required: true,
  },
  price: { type: Schema.Types.Number, required: true, min: 0 },
});

const ValuationSchema = new Schema<IValuation>({
  date: { type: Schema.Types.Date, required: true },
  totalValue: { type: Schema.Types.Number, required: true, min: 0 },
  sharePrices: [SharePriceSchema],
});

const DocumentSchema = new Schema<IDocument>({
  name: { type: Schema.Types.String, required: true },
  type: { type: Schema.Types.String, required: true },
  fileUrl: { type: Schema.Types.String, required: true },
  uploadedAt: { type: Schema.Types.Date, default: Date.now },
});

const CompanySchema: Schema<ICompanyModel> = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  establishedDate: { type: Schema.Types.Date, required: true },
  registrationNumber: { type: Schema.Types.String, required: true },
  employees: { type: Schema.Types.Number, default: 0 },
  address: { type: AddressSchema, default: null },
  industryTags: { type: [Schema.Types.String], default: [] },
  email: { type: Schema.Types.String, required: false, unique: true },
  phone: { type: Schema.Types.String, default: null },
  website: { type: Schema.Types.String, default: null },
  active: { type: Schema.Types.Boolean, default: true },
  valuation: { type: Schema.Types.Number, required: false },
  shareClasses: [ShareClassSchema],
  valuations: [ValuationSchema],
  documents: [DocumentSchema],
});

export default mongoose.model<ICompanyModel>("Company", CompanySchema);
