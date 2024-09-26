import mongoose, { Schema, Document, Types } from "mongoose";

//Models
import { IUserModel } from "./users.model";
import { ISubscription } from "./subscription.model";

//Types
interface IProduct {
  productId: Types.ObjectId;
  quantity: number;
  price: number;
}

export interface ITransaction {
  userId: string;
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
    | "shares"
    | "referral_bonus"
    | string;
  relatedShareId?: Types.ObjectId;
  subscription?: Types.ObjectId | ISubscription;
  products?: IProduct[];
  amount: number;
  currency: "USD" | "EUR" | "NOK" | "GBP";
  status: "pending" | "paid" | "failed" | "refunded";
  taxAmount: number;
  taxRate: number;
  discount: number;
  metadata?: Map<string, string>;
  transactionDate: Date;
}

export interface ITransactionModel extends ITransaction, Document {}

const TransactionSchema: Schema<ITransactionModel> = new Schema(
  {
    userId: { type: Schema.Types.String, ref: "User", required: true },
    stripePaymentId: {
      type: Schema.Types.String,
      //required: true,
      //unique: true,
    },
    transactionType: {
      type: Schema.Types.String,
      required: true,
      enum: ["subscription", "product", "shares", "referral_bonus"],
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
      //required: true,
    },
    relatedShareId: { type: Schema.Types.ObjectId, ref: "Shares" },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      validate: {
        validator: function (this: ITransactionModel) {
          return this.transactionType !== "subscription" || !!this.subscription;
        },
        message: "Subscription field is required for subscription transactions",
      },
    },
    products: {
      type: [
        {
          productId: { type: Schema.Types.ObjectId, ref: "Product" },
          quantity: { type: Number, required: true },
          price: { type: Number, required: true },
        },
      ],
      validate: {
        validator: function (this: ITransactionModel) {
          return (
            this.transactionType !== "product" ||
            (this.products && this.products.length > 0)
          );
        },
        message: "Products field is required for product transactions",
      },
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
    transactionDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<ITransactionModel>(
  "Transaction",
  TransactionSchema
);
