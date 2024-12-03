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
  paymentMethod: string;
  taxAmount: number;
  taxRate: number;
  discount?: number;
  shareTransaction?: {
    companyName: string;
    shareClassName: string;
    quantity: number;
    pricePerShare: number;
    totalShares: number;
  };
}

interface TransactionFilters {
  status?: string;
  transactionType?: string;
  startDate?: Date;
  endDate?: Date;
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const getAllUserTransactions = async (
  userId: string,
  filters: TransactionFilters = {},
  options: PaginationOptions = {
    page: 1,
    limit: 10,
    sortBy: "transactionDate",
    sortOrder: "desc",
  }
): Promise<CombinedTransaction[]> => {
  try {
    const userObjectId = new Types.ObjectId(userId);

    // Build query
    const query: any = { userId: userObjectId };

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.transactionType) {
      query.transactionType = filters.transactionType;
    }
    if (filters.startDate || filters.endDate) {
      query.transactionDate = {};
      if (filters.startDate) {
        query.transactionDate.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.transactionDate.$lte = filters.endDate;
      }
    }

    // Calculate skip value for pagination
    const skip = (options.page - 1) * options.limit;

    // Fetch all transactions for the user with pagination
    const transactions = await TransactionModel.find(query)
      .sort({ [options.sortBy]: options.sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(options.limit)
      .lean();

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
          paymentMethod: t.paymentMethod,
          taxAmount: t.taxAmount,
          taxRate: t.taxRate,
          discount: t.discount,
          shareTransaction: st
            ? {
                companyName: (st.companyId as any).name,
                shareClassName: (st.shareClassId as any).name,
                quantity: st.quantity,
                pricePerShare: st.pricePerShare,
                totalShares: st.quantity,
              }
            : undefined,
        };
      }
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

export { TransactionFilters, PaginationOptions, CombinedTransaction };

export default {
  createTransaction,
  getUserTransactions,
  getAllUserTransactions,
};
