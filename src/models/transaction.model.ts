import mongoose, { Schema, Document, Types } from "mongoose";

//Types
export interface ITransaction {
  userId: Types.ObjectId;
  stripePaymentId?: string;
  paymentMethod:
    | "credit_card"
    | "paypal"
    | "bank_transfer"
    | "crypto"
    | "cash"
    | "other";
  transactionType:
    | "subscription"
    | "product"
    | "shares_purchase"
    | "shares_sale"
    | "referral_bonus"
    | string;
  amount: number;
  currency: "USD" | "EUR" | "NOK" | "GBP";
  status: "pending" | "paid" | "failed" | "refunded";
  taxAmount: number;
  taxRate: number;
  discount?: number;
  metadata?: Map<string, string>;
  shareTransactionId?: Types.ObjectId;
  transactionDate: Date;
}

export interface ITransactionModel extends ITransaction, Document {
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema<ITransactionModel> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stripePaymentId: {
      type: Schema.Types.String,
      sparse: true, // Allows multiple null values but ensures uniqueness for non-null values
    },
    transactionType: {
      type: Schema.Types.String,
      required: true,
      enum: [
        "subscription",
        "product",
        "shares_purchase",
        "shares_sale",
        "referral_bonus",
      ],
    },
    paymentMethod: {
      type: Schema.Types.String,
      enum: [
        "credit_card",
        "paypal",
        "bank_transfer",
        "crypto",
        "cash",
        "other",
      ],
      required: true,
    },
    amount: {
      type: Schema.Types.Number,
      required: true,
      min: [0, "Transaction amount must be positive"],
    },
    currency: {
      type: Schema.Types.String,
      required: true,
      enum: ["USD", "EUR", "NOK", "GBP"],
      default: "NOK",
    },
    status: {
      type: Schema.Types.String,
      default: "pending",
      enum: ["pending", "paid", "failed", "refunded"],
    },
    taxAmount: {
      type: Schema.Types.Number,
      default: 0,
      min: [0, "Tax amount must be positive"],
    },
    taxRate: {
      type: Schema.Types.Number,
      default: 0,
      min: [0, "Tax rate must be positive"],
    },
    discount: {
      type: Schema.Types.Number,
      default: 0,
      min: [0, "Discount must be positive"],
    },
    metadata: { type: Map, of: String },
    shareTransactionId: {
      type: Schema.Types.ObjectId,
      ref: "ShareTransaction",
    },
    transactionDate: {
      // Added this field
      type: Schema.Types.Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ transactionType: 1 });
TransactionSchema.index({ status: 1 });

export default mongoose.model<ITransactionModel>(
  "Transaction",
  TransactionSchema
);
