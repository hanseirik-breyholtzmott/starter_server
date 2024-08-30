import mongoose, { Schema, Document, Types } from "mongoose";
import { IUserModel } from "./users.model";
import { ISubscription } from "./subscription.model";

interface IProduct {
  productId: Types.ObjectId;
  quantity: number;
  price: number;
}

export interface ITransaction extends Document {
  userId: string | IUserModel;
  stripePaymentId: string;
  paymentMethod:
    | "credit_card"
    | "paypal"
    | "bank_transfer"
    | "crypto"
    | "cash"
    | "other";
  transactionType: "subscription" | "product";
  subscription?: string | ISubscription;
  products?: IProduct[];
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  taxAmount: Number;
  taxRate: Number;
  discount: Number;
  metadata?: Map<string, string>;
  transactionDate: Date;
  updatedAt: Date;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema<ITransaction>({
  userId: { type: mongoose.Types.ObjectId, ref: "Users", required: true },
  stripePaymentId: { type: String, required: true, unique: true },
  transactionType: {
    type: String,
    required: true,
    enum: ["subscription", "product"],
  },
  paymentMethod: {
    type: String,
    enum: ["credit_card", "paypal", "bank_transfer", "crypto", "cash", "other"],
    required: true,
  },
  subscription: {
    type: mongoose.Types.ObjectId,
    ref: "Subscription",
    required: function () {
      return this.transactionType === "subscription";
    },
  },
  products: {
    type: [
      { productId: mongoose.Types.ObjectId, quantity: Number, price: Number },
    ],
    required: function () {
      return this.transactionType === "product";
    },
  },
  amount: {
    type: Number,
    required: true,
    min: [0, "Transaction amount must be positive"],
  },
  currency: {
    type: String,
    required: true,
    default: "NOK",
    enum: ["USD", "EUR", "NOK", "GBP"],
  },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "completed", "failed", "refunded"],
  },
  taxAmount: { type: Number, default: 0, min: 0 },
  taxRate: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  metadata: { type: Map, of: String },
  transactionDate: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Middleware to update updatedAt on save
TransactionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);
export default Transaction;
