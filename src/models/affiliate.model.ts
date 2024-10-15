import mongoose, { Schema, Document, Types } from "mongoose";
import { IUserModel } from "./users.model";

export interface IReferral {
  referredUserId: Types.ObjectId;
  referredDate: Date;
  status: "pending" | "completed" | "cancelled";
}

export interface IAffiliate {
  userId: Types.ObjectId;
  affiliateCode: string;
  referrals: IReferral[];
  totalReferrals: number;
  totalCompletedReferrals: number;
  totalSharesEarned: number;
}

export interface IAffiliateModel extends IAffiliate, Document {}

const AffiliateSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      unique: true,
    },
    affiliateCode: { type: Schema.Types.String, required: true },
    totalReferrals: { type: Number, default: 0 },
    totalCompletedReferrals: { type: Number, default: 0 },
    totalSharesEarned: { type: Number, default: 0 },
    referrals: [
      {
        referredUserId: { type: Schema.Types.ObjectId, ref: "Users" },
        referredDate: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ["pending", "completed", "cancelled"],
          default: "pending",
        },
        //TODO: Earned rewards
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IAffiliateModel>("Affiliate", AffiliateSchema);
