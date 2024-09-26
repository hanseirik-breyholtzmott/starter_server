import mongoose, { Document, Schema } from "mongoose";

//Models
import { IUserModel } from "./users.model";
import { ITransactionModel } from "./transaction.model";

//Types
export interface IShare {
  userId: string | IUserModel;
  transactionId: string | ITransactionModel;
  numberOfShares: number;
  purchaseDate: Date;
  purchasePrice: number;
  ssn?: string;
  shareStatus: "active" | "sold" | "locked";
  isLocked: boolean;
  unlockDate?: Date;
  referralBonus?: boolean;
}

export interface IShareModel extends IShare, Document {}

const SharesSchema: Schema<IShareModel> = new Schema(
  {
    userId: { type: Schema.Types.String, ref: "User", required: true },
    transactionId: {
      type: Schema.Types.String,
      ref: "Transaction",
      required: true,
    },
    numberOfShares: {
      type: Number,
      required: true,
      min: [1, "Number of shares must be at least 1"],
    },
    shareStatus: {
      type: String,
      enum: ["active", "sold", "locked", "affiliate"],
      default: "active",
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    unlockDate: {
      type: Date,
      required: function (this: IShareModel) {
        return this.isLocked;
      },
    },
    purchaseDate: { type: Date, required: true, default: Date.now },
    purchasePrice: {
      type: Number,
      required: true,
      min: [0, "Purchase price must be positive"],
    },
    ssn: {
      type: String,
      //required: true,
      //minlength: [9, "SSN must be at least 9 characters long"],
      maxlength: [11, "SSN must not exceed 11 characters"],
    },
    referralBonus: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IShareModel>("Shares", SharesSchema);
