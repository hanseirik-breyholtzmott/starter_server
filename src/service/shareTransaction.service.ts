import shareTransactionModel, {
  IShareTransaction,
  IShareTransactionModel,
} from "../models/shareTransaction.model";
import mongoose from "mongoose";

const createShareTransaction = async (
  transactionData: IShareTransaction
): Promise<IShareTransactionModel> => {
  try {
    const newShareTransaction = new shareTransactionModel(transactionData);
    await newShareTransaction.save();
    return newShareTransaction;
  } catch (error) {
    console.error("Error creating share transaction:", error);
    throw error;
  }
};

const getShareTransactionsByShareId = async (
  shareId: string
): Promise<IShareTransactionModel[]> => {
  try {
    return await shareTransactionModel.find({
      shareId: new mongoose.Types.ObjectId(shareId),
    });
  } catch (error) {
    console.error("Error fetching share transactions:", error);
    throw error;
  }
};

const getShareTransactionsByTransactionId = async (
  transactionId: string
): Promise<IShareTransactionModel[]> => {
  try {
    return await shareTransactionModel.find({
      transactionId: new mongoose.Types.ObjectId(transactionId),
    });
  } catch (error) {
    console.error("Error fetching share transactions:", error);
    throw error;
  }
};

const getTotalSharesBoughtByShareId = async (
  shareId: string
): Promise<number> => {
  try {
    const result = await shareTransactionModel.aggregate([
      {
        $match: {
          shareId: new mongoose.Types.ObjectId(shareId),
          transactionType: "buy",
        },
      },
      { $group: { _id: null, totalShares: { $sum: "$numberOfShares" } } },
    ]);
    return result.length > 0 ? result[0].totalShares : 0;
  } catch (error) {
    console.error("Error calculating total shares bought:", error);
    throw error;
  }
};

const getTotalSharesSoldByShareId = async (
  shareId: string
): Promise<number> => {
  try {
    const result = await shareTransactionModel.aggregate([
      {
        $match: {
          shareId: new mongoose.Types.ObjectId(shareId),
          transactionType: "sell",
        },
      },
      { $group: { _id: null, totalShares: { $sum: "$numberOfShares" } } },
    ]);
    return result.length > 0 ? result[0].totalShares : 0;
  } catch (error) {
    console.error("Error calculating total shares sold:", error);
    throw error;
  }
};

export default {
  createShareTransaction,
  getShareTransactionsByShareId,
  getShareTransactionsByTransactionId,
  getTotalSharesBoughtByShareId,
  getTotalSharesSoldByShareId,
};
