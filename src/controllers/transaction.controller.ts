import { Request, Response } from "express";

//Services
import transactionService from "../service/transaction.service";

//Utils
import {
  OK,
  CREATED,
  BAD_REQUEST,
  UNAUTHORIZED,
  NOT_FOUND,
  INTERNAL_SERVER_ERROR,
} from "../utils/contants";

const getUserTransactions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    console.log("This is the userId", userId);
    const transactions = await transactionService.getAllUserTransactions(
      userId
    );
    return res.status(OK).json({
      success: true,
      message: "Transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    res.status(500).json({ error: "Failed to fetch user transactions" });
  }
};

export default {
  getUserTransactions,
};
