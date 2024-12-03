import { Request, Response } from "express";
import { Types } from "mongoose";

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

interface TransactionQueryParams {
  page?: string;
  limit?: string;
  status?: "pending" | "paid" | "failed" | "refunded";
  transactionType?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Get user transactions with filtering and pagination
 *
 * @route GET /api/transactions/:userId
 *
 * @param userId - MongoDB ObjectId of the user
 *
 * @queryParams
 * - page (default: 1) - Page number
 * - limit (default: 10) - Number of items per page
 * - status - Filter by status: "pending" | "paid" | "failed" | "refunded"
 * - transactionType - Filter by type: "subscription" | "product" | "shares_purchase" | "shares_sale" | "referral_bonus"
 * - startDate - Filter transactions after this date (ISO format: YYYY-MM-DDTHH:mm:ssZ)
 * - endDate - Filter transactions before this date (ISO format: YYYY-MM-DDTHH:mm:ssZ)
 * - sortBy (default: "transactionDate") - Field to sort by: "transactionDate" | "amount" | "status"
 * - sortOrder (default: "desc") - Sort direction: "asc" | "desc"
 *
 * @example
 * GET /api/transactions/123?page=1&limit=10&status=paid&transactionType=shares_purchase&startDate=2024-01-01T00:00:00Z
 *
 * @requires Authentication - Bearer token in Authorization header
 */
const getUserTransactions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const {
      page = "1",
      limit = "10",
      status,
      transactionType,
      startDate,
      endDate,
      sortBy = "transactionDate",
      sortOrder = "desc",
    } = req.query as TransactionQueryParams;

    // Validate userId
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Build filters
    const filters: any = {};
    if (status) filters.status = status;
    if (transactionType) filters.transactionType = transactionType;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    // Validate dates if provided
    if (filters.startDate && isNaN(filters.startDate.getTime())) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: "Invalid start date format",
      });
    }
    if (filters.endDate && isNaN(filters.endDate.getTime())) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: "Invalid end date format",
      });
    }

    const transactions = await transactionService.getAllUserTransactions(
      userId,
      filters,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
      }
    );

    return res.status(OK).json({
      success: true,
      message: "Transactions fetched successfully",
      data: transactions,
      pagination: {
        currentPage: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(transactions.length / parseInt(limit)),
        totalItems: transactions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching user transactions:", error);

    if (error instanceof Error) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An unexpected error occurred while fetching transactions",
    });
  }
};

export default {
  getUserTransactions,
};
