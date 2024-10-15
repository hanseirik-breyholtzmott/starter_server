import mongoose, { Document, Schema } from "mongoose";

export interface IShareTransaction {
  shareId: mongoose.Types.ObjectId;
  transactionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  shareClassId: mongoose.Types.ObjectId;
  transactionType: "buy" | "sell" | string;
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  transactionDate: Date;
  status: "pending" | "completed" | "cancelled" | string;
}

export interface IShareTransactionModel extends IShareTransaction, Document {}

const ShareTransactionSchema: Schema<IShareTransactionModel> = new Schema(
  {
    shareId: {
      type: Schema.Types.ObjectId,
      ref: "Shares",
      required: true,
      index: true,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
    transactionType: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Number of shares must be at least 1"],
      validate: {
        validator: (value: number) => Number.isInteger(value),
        message: "Number of shares must be an integer",
      },
    },
    pricePerShare: {
      type: Number,
      required: true,
      min: [0, "Price per share must be non-negative"],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount must be non-negative"],
    },
    transactionDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
      required: true,
    },
  },
  { timestamps: true }
);

ShareTransactionSchema.index({ userId: 1, transactionDate: -1 });
ShareTransactionSchema.index({ companyId: 1, shareClassId: 1 });
ShareTransactionSchema.index({ status: 1 });

export default mongoose.model<IShareTransactionModel>(
  "ShareTransaction",
  ShareTransactionSchema
);
