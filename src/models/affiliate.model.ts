import mongoose, { Schema, Document } from "mongoose";
import { IUserModel } from "./users.model";

export interface IReferral {
  referredUserId: string | IUserModel;
  referredDate: Date;
  status: "pending" | "completed" | "cancelled";
}

export interface IAffiliate {
  userId: string | IUserModel;
  affiliateCode: string;
  referrals: IReferral[];
  totalReferrals: number;
  totalCompletedReferrals: number;
}

export interface IAffiliateModel extends IAffiliate, Document {}

const AffiliateSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.String,
      ref: "Users",
      required: true,
      unique: true,
    },
    affiliateCode: { type: Schema.Types.String, required: true },
    referrals: [
      {
        referredUserId: { type: Schema.Types.String, ref: "Users" },
        referredDate: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ["pending", "completed", "cancelled"],
          default: "pending",
        },
      },
    ],
    totalReferrals: { type: Number, default: 0 },
    totalCompletedReferrals: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IAffiliateModel>("Affiliate", AffiliateSchema);
