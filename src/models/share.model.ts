import mongoose, { Document, Schema } from "mongoose";

//Models
import { IUserModel } from "./users.model";
import { ICompanyModel } from "./company.model";
import { ITransactionModel } from "./transaction.model";

//Types
export interface IShare {
  userId: mongoose.Types.ObjectId | string;
  companyId: mongoose.Types.ObjectId | string;
  shareClassId: mongoose.Types.ObjectId | string;
  numberOfShares?: number; //Delete this afterwards
  transactionId?: string;
  initialShares: number;
  remainingShares: number;
  purchaseDate: Date;
  purchasePrice: number;
  shareStatus: "active" | "sold" | "locked" | "partially_sold";
  isLocked: boolean;
  unlockDate?: Date;
  transactions: mongoose.Types.ObjectId[];
  ssn?: string;
  identifier: {
    type: "ssn" | "registrationNumber";
    value: string;
  };
  holdingCompanyId?: mongoose.Types.ObjectId | string;
}

export interface IShareModel extends IShare, Document {
  remainingShares: number;
}

const SharesSchema: Schema<IShareModel> = new Schema(
  {
    userId: {
      type: Schema.Types.Mixed,
      ref: "User",
      required: true,
      validate: {
        validator: function (v: any) {
          return mongoose.Types.ObjectId.isValid(v) || typeof v === "string";
        },
        message: (props) => `${props.value} is not a valid ObjectId or string!`,
      },
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    shareClassId: {
      type: Schema.Types.ObjectId,
      ref: "ShareClass",
      required: true,
      index: true,
    },
    initialShares: {
      type: Number,
      required: true,
      min: [1, "Initial number of shares must be at least 1"],
    },
    numberOfShares: {
      type: Number,
      required: false,
    }, //Delete this afterwards
    remainingShares: {
      type: Number,
      required: true,
      min: [0, "Remaining shares must be non-negative"],
      validate: {
        validator: function (this: IShareModel, value: number) {
          return value <= this.initialShares;
        },
        message: "Remaining shares cannot exceed the initial number of shares",
      },
    },
    purchaseDate: { type: Date, required: true, default: Date.now },
    purchasePrice: {
      type: Number,
      required: true,
      min: [0, "Purchase price must be positive"],
    },
    shareStatus: {
      type: String,
      enum: ["active", "sold", "locked", "affiliate", "partially_sold"],
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
    transactions: [
      {
        type: Schema.Types.ObjectId,
        ref: "ShareTransaction",
      },
    ],
    ssn: {
      type: String,
      required: false,
    },
    identifier: {
      type: {
        type: String,
        enum: ["ssn", "registrationNumber"],
        required: true,
      },
      value: {
        type: String,
        required: true,
        validate: {
          validator: function (this: IShareModel, value: string) {
            // Validation for SSN (9-11 characters) or registration number (organisational number rules)
            if (this.identifier.type === "ssn") {
              return value.length === 9 || value.length === 11; // SSN length validation
            } else if (this.identifier.type === "registrationNumber") {
              return value.length >= 9 && value.length <= 12; // Registration number validation
            }
            return false;
          },
          message: "Invalid identifier value",
        },
      },
    },
    holdingCompanyId: {
      type: Schema.Types.ObjectId,
      ref: "HoldingCompany",
      required: false,
      validate: {
        validator: function (v: any) {
          return (
            v === undefined ||
            v === null ||
            mongoose.Types.ObjectId.isValid(v) ||
            typeof v === "string"
          );
        },
        message: (props) => `${props.value} is not a valid ObjectId or string!`,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IShareModel>("Shares", SharesSchema);
