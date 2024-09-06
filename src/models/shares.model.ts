import mongoose, { Document, Schema } from "mongoose";
import { IUserModel } from "./users.model";
import { ITransactionModel } from "./transaction.model";

//Define the IShare interface
export interface IShare {
  userId: string | IUserModel;
  //transactionId: string | ITransactionModel;
  numberOfShares: number;
  purchaseDate: Date;
  purchasePrice: number;
}

//Define the IShareModel interface, extending the IShare and Document
export interface IShareModel extends IShare, Document {}

//Define the SharesSchema with Mongoose
const SharesSchema = new Schema(
  {
    userId: { type: Schema.Types.String, ref: "Users", required: true },
    /*transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },*/
    numberOfShares: {
      type: Number,
      required: true,
      min: [1, "Number of shares must be at least 1"],
    },
    purchaseDate: { type: Date, required: true, default: Date.now },
    purchasePrice: {
      type: Number,
      required: true,
      min: [0, "Purchase price must be positive"],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IShareModel>("Shares", SharesSchema);
