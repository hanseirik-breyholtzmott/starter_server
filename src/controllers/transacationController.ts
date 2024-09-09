import { Request, Response } from "express";
import transactionService from "../service/transactionService";

export const transactionController = {
  async getUserTransactions(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const transactions = await transactionService.getTransactionsByUserId(
        userId
      );
      res.json(transactions);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error fetching user transactions", error });
    }
  },
  async getTransactionById(req: Request, res: Response) {
    try {
      const transactionId = req.params.transactionId;
      const transaction = await transactionService.getTransactionById(
        transactionId
      );
      res.json(transaction);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error fetching user transactions", error });
    }
  },
};
