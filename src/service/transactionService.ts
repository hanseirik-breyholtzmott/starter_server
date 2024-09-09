import { Types } from "mongoose";
import TransactionModel, {
  ITransaction,
  ITransactionModel,
} from "../models/transaction.model";

export class TransactionService {
  private static instance: TransactionService;

  private constructor() {}

  public static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  public async createTransaction(
    transaction: ITransaction
  ): Promise<ITransactionModel | null> {
    try {
      const newTransaction = new TransactionModel(transaction);
      await newTransaction.save();
      return newTransaction;
    } catch (error) {
      console.error("Error creating transaction:", error);
      return null;
    }
  }

  public async getTransactionById(
    transactionId: string
  ): Promise<ITransactionModel | null> {
    try {
      const transaction = await TransactionModel.findById(transactionId);
      return transaction;
    } catch (error) {
      console.error("Error retrieving transaction by ID:", error);
      return null;
    }
  }

  public async getTransactionsByUserId(
    userId: string
  ): Promise<ITransactionModel[] | null> {
    try {
      const transactions = await TransactionModel.find({ userId });
      return transactions;
    } catch (error) {}
  }

  public async updateTransaction(
    id: string,
    updateData: Partial<ITransaction>
  ): Promise<ITransactionModel | null> {
    try {
      return await TransactionModel.findByIdAndUpdate(id, updateData, {
        new: true,
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw new Error("Failed to update transaction.");
    }
  }

  public async deleteTransaction(
    id: string
  ): Promise<ITransactionModel | null> {
    try {
      return await TransactionModel.findByIdAndDelete(id);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw new Error("Failed to delete transaction.");
    }
  }

  public async getTransactionsByType(
    type: ITransaction["transactionType"]
  ): Promise<ITransactionModel[]> {
    try {
      return await TransactionModel.find({ transactionType: type });
    } catch (error) {
      console.error("Error retrieving transactions by type:", error);
      throw new Error("Failed to retrieve transactions.");
    }
  }

  async getTransactionsByStatus(
    status: ITransaction["status"]
  ): Promise<ITransactionModel[]> {
    try {
      return await TransactionModel.find({ status });
    } catch (error) {
      console.error("Error retrieving transactions by status:", error);
      throw new Error("Failed to retrieve transactions.");
    }
  }
}

export default TransactionService.getInstance();
