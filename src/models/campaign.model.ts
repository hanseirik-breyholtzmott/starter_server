import mongoose, { Schema, Document } from "mongoose";
import { ICompanyModel } from "./company.model";

interface IInvestmentDetails {
  minimumInvestment: number;
  maximumInvestment?: number;
  shareClassId: mongoose.Types.ObjectId;
  sharePrice: number;
  startDate: Date;
  closingDate: Date;
  status:
    | "active"
    | "closed"
    | "upcoming"
    | "paused"
    | "cancelled"
    | "pending approval";
  startAmount: number;
  targetAmount: number;
  availableShares: number;
}

interface IPerk {
  title: string;
  actionText: string;
  description: string;
  button: {
    text: string;
    link: string;
  };
}

interface IDisplayImages {
  icon: string;
  logo: string;
  campaign: string;
}

interface IDocument {
  title: string;
  description: string;
  fileName: string;
  url: string;
}

interface IBankAccount {
  accountNumber: string;
  bankName: string;
  accountHolderName: string;
}

export interface ICampaign {
  companyId: ICompanyModel["_id"];
  bankAccount: IBankAccount;
  campaignInfo: {
    name: string;
    description: string;
    tags: string[];
  };
  displayImages: IDisplayImages;
  investmentDetails: IInvestmentDetails;
  perks?: IPerk[];
  documents?: IDocument[];
}

export interface ICampaignModel extends ICampaign, Document {}

// Investment Details Schema
const InvestmentDetailsSchema: Schema = new Schema({
  minimumInvestment: { type: Number, required: true },
  maximumInvestment: { type: Number, default: null },
  shareClassId: {
    type: Schema.Types.ObjectId,
    ref: "ShareClass",
    required: true,
  },
  sharePrice: { type: Number, required: true },
  startDate: { type: Date, required: true },
  closingDate: { type: Date, required: true },
  status: {
    type: String,
    enum: [
      "active",
      "closed",
      "upcoming",
      "paused",
      "cancelled",
      "pending approval",
    ],
    required: true,
  },
  startAmount: { type: Number, required: true },
  targetAmount: { type: Number, required: true },
  availableShares: { type: Number, required: true },
});

// Perk Schema
const PerkSchema: Schema = new Schema({
  title: { type: String, required: true },
  actionText: { type: String, required: true },
  description: { type: String, required: true },
  button: {
    text: { type: String, required: true },
    link: { type: String, required: true },
  },
});

// Display Images Schema
const DisplayImagesSchema: Schema = new Schema({
  icon: {
    type: String,
    required: true,
    default: "https://via.placeholder.com/32",
  },
  logo: {
    type: String,
    required: true,
    default: "https://via.placeholder.com/150",
  },
  campaign: {
    type: String,
    required: true,
    default: "https://via.placeholder.com/1200",
  },
});

// Document Schema
const DocumentSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  fileName: { type: String, required: true },
  url: { type: String, required: true },
});

const BankAccountSchema: Schema = new Schema({
  accountNumber: { type: String, required: true },
  bankName: { type: String, required: true },
  accountHolderName: { type: String, required: true },
});

const CampaignSchema: Schema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    bankAccount: { type: BankAccountSchema, required: true },
    campaignInfo: {
      name: { type: String, required: true },
      description: { type: String, required: true },
      tags: [{ type: String }],
    },
    displayImages: { type: DisplayImagesSchema, required: true },
    investmentDetails: { type: InvestmentDetailsSchema, required: true },
    perks: [PerkSchema],
    documents: [DocumentSchema],
  },
  { timestamps: true }
);

export default mongoose.model<ICampaignModel>("Campaign", CampaignSchema);
