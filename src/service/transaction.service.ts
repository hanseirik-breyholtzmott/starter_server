import TransactionModel, {
  ITransaction,
  ITransactionModel,
} from "../models/transaction.model";
import ShareTransactionModel, {
  IShareTransactionModel,
} from "../models/shareTransaction.model";
import { Types } from "mongoose";

const createTransaction = async (
  transactionData: ITransaction
): Promise<ITransactionModel> => {
  try {
    const newTransaction = new TransactionModel(transactionData);
    await newTransaction.save();
    return newTransaction;
  } catch (error) {
    console.error("Error creating transaction:", error);

    throw new Error("Error creating transaction.");
  }
};

interface CombinedTransaction {
  _id: Types.ObjectId;
  transactionType: string;
  amount: number;
  currency: string;
  status: string;
  transactionDate: Date;
  shareTransaction?: {
    companyName: string;
    shareClassName: string;
    quantity: number;
    pricePerShare: number;
  };
}

const getAllUserTransactions = async (
  userId: string
): Promise<CombinedTransaction[]> => {
  try {
    const userObjectId = new Types.ObjectId(userId);

    // Fetch all transactions for the user
    const transactions = await TransactionModel.find({
      userId: userObjectId,
    }).lean();

    // Get IDs of share transactions
    const shareTransactionIds = transactions
      .filter(
        (t) =>
          t.transactionType === "shares_purchase" ||
          t.transactionType === "shares_sale"
      )
      .map((t) => t.shareTransactionId)
      .filter((id): id is Types.ObjectId => id != null);

    // Fetch corresponding share transactions with populated fields
    const shareTransactions = await ShareTransactionModel.find({
      _id: { $in: shareTransactionIds },
    })
      .populate("companyId", "name")
      .populate("shareClassId", "name")
      .lean();

    // Create a map for quick lookup
    const shareTransactionMap = new Map(
      shareTransactions.map((st) => [st._id.toString(), st])
    );

    // Combine and format the transactions
    const combinedTransactions: CombinedTransaction[] = transactions.map(
      (t) => {
        const st = t.shareTransactionId
          ? shareTransactionMap.get(t.shareTransactionId.toString())
          : null;

        return {
          _id: new Types.ObjectId(t._id.toString()),
          transactionType: t.transactionType,
          amount: t.amount,
          currency: t.currency,
          status: t.status,
          transactionDate: t.transactionDate,
          /*shareTransaction: st
            ? {
                companyName: (st.companyId as any).name,
                shareClassName: (st.shareClassId as any).name,
                quantity: st.quantity,
                pricePerShare: st.pricePerShare,
              }
            : undefined,*/
        };
      }
    );

    // Sort combined transactions by transactionDate, most recent first
    combinedTransactions.sort(
      (a, b) => b.transactionDate.getTime() - a.transactionDate.getTime()
    );

    return combinedTransactions;
  } catch (error) {
    console.error("Error fetching all user transactions:", error);
    throw new Error("Failed to fetch user transactions");
  }
};

const getUserTransactions = async (
  userId: string
): Promise<ITransactionModel[]> => {
  try {
    const transactions = await TransactionModel.find({ userId });
    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw new Error("Error fetching transactions.");
  }
};

export default {
  createTransaction,
  getUserTransactions,
  getAllUserTransactions,
};
