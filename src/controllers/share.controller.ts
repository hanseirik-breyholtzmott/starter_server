import { Request, Response, NextFunction, response } from "express";
import { Types } from "mongoose";

//Services
import errorService from "../service/errorService";
import userService from "../service/user.service";
import shareService from "../service/share.service";
import emailService from "../service/email.service";
import companyService from "../service/company.service";
import transactionService from "../service/transaction.service";
import notificationService from "../service/notification.service";
import shareTransactionService from "../service/shareTransaction.service";

//Models
import UsersModel from "../models/users.model";
import SharesModel, { IShare } from "../models/share.model";
import TransactionModel, { ITransaction } from "../models/transaction.model";
import ShareTransactionModel, {
  IShareTransaction,
} from "../models/shareTransaction.model";

const purchaseNewShares = async (req: Request, res: Response) => {
  const { companyId } = req.params;

  const {
    userId,
    identifierType,
    identifierValue,
    numberOfShares,
    shareClassId,
  } = req.body;

  //Check if company exists
  const company = await companyService.getCompanyById(companyId);

  if (!company) {
    return res.status(400).json({
      success: false,
      message: "Company not found",
    });
  }

  //Check if user exists
  const user = await userService.getUserById(userId);

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "User not found",
    });
  }

  //Check if company has enough shares to sell
  const availableShares = await shareService.validateSharePurchase(
    company._id.toString(),
    shareClassId,
    numberOfShares
  );

  if (!availableShares) {
    return res.status(400).json({
      success: false,
      message: "Not enough shares to sell",
    });
  }

  //Create a new transaction
  const newTransaction: ITransaction = {
    userId: user._id as Types.ObjectId,
    paymentMethod: "bank_transfer",
    stripePaymentId: "transaction",
    transactionType: "shares_purchase",
    amount: numberOfShares * 8,
    currency: "NOK",
    status: "pending",
    taxAmount: 0,
    taxRate: 0,
    transactionDate: new Date(),
  };

  const transaction = await transactionService.createTransaction(
    newTransaction
  );

  //Create a new shares entry
  const newShare: IShare = {
    userId: user._id as Types.ObjectId,
    companyId: company._id as Types.ObjectId,
    initialShares: numberOfShares,
    remainingShares: numberOfShares,
    purchaseDate: new Date(),
    purchasePrice: 8,
    transactions: [transaction._id as Types.ObjectId],
    shareClassId: shareClassId as Types.ObjectId,
    identifier: {
      type: identifierType,
      value: identifierValue,
    },
    shareStatus: "active",
    isLocked: false,
  };

  const share = await shareService.createShare(newShare);

  //Share transaction
  const newShareTransaction: IShareTransaction = {
    userId: user._id as Types.ObjectId,
    companyId: company._id as Types.ObjectId,
    shareClassId: shareClassId as Types.ObjectId,
    totalAmount: numberOfShares * 8,
    status: "pending",
    shareId: share._id as Types.ObjectId,
    transactionId: transaction._id as Types.ObjectId,
    transactionType: "buy",
    quantity: numberOfShares,
    pricePerShare: 8,
    transactionDate: new Date(),
  };

  const shareTransaction = await shareTransactionService.createShareTransaction(
    newShareTransaction
  );

  //create a notification to user
  const notification = await notificationService.createNotification(
    user._id.toString(),
    "Aksjer kjøpt",
    "Du har kjøpt " + numberOfShares + " aksjer."
  );

  //Send email to user
  const emailResult = await emailService.sendEmail(
    user.primaryEmailAddress,
    "Bekreftelse på kjøp av aksjer",
    `You have successfully purchased ${numberOfShares} shares.`,
    `<h1>Share Purchase Confirmation</h1><p>You have successfully purchased ${numberOfShares} shares.</p>`
  );

  if (!emailResult.success) {
    console.error("Failed to send confirmation email:", emailResult.error);
  }

  return res.status(200).json({
    success: true,
    message: "Shares purchased successfully",
    transactionId: transaction._id,
    shareId: share._id,
  });
};

export default {
  purchaseNewShares,
};

/*

const totalSharesByUserId = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  try {
    //Find user based on ID
    const user = await userService.getUserByUserId(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found.",
      });
    }

    const shares = await SharesModel.find({ userid: userId });

    let totalShares = 0;
    let totalInvested = 0;

    shares.forEach((share) => {
      totalShares += share.numberOfShares;
      totalInvested += share.numberOfShares * share.purchasePrice;
    });

    return res.status(200).json({
      success: true,
      message: "Found all the shares.",
      totalShares: totalShares,
      totalInvested: totalInvested,
    });
  } catch (error) {
    errorService.handleServerError(res, error, "Server error");
  }
};

const campaginInfo = async (req: Request, res: Response) => {
  /*const { userId } = req.body;

  const user = await userService.getUserByUserId(userId);

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "User not found.",
    });
  }

    const userId = req.params.userId;

    try {
      //Find user based on ID
      const user = await userService.getUserByUserId(userId);
  
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found.",
        });
      }
  
      const convertedLoanAmount = 4206840;
      const convertedLoanShares = 0;
      const convertedLoanPurchase = 0;
  
      const totalShares = await shareService.countTotalSharesIn2024();
  
      const totalSharesByUser = await shareService.countTotalSharesByUserId(
        userId
      );
  
      const countPurchases = await shareService.countPurcahsesAfter2023();
  
      return res.status(200).json({
        user: {
          totalShares: totalSharesByUser,
          recommendedPurchase: user.recommendedShares,
          purchaseRight: user.purchaseRight,
        },
        data: {
          totalShares: totalShares + convertedLoanShares,
          totalAmount: totalShares * 8 + convertedLoanAmount,
          totalPurchases: countPurchases,
          closingDate: null,
          sharesAvailable:
            (8000000 - (totalShares * 8 + convertedLoanAmount)) / 8,
          goal: ((totalShares * 8 + convertedLoanAmount) / 8000000).toFixed(2),
        },
      });
    } catch (error) {
      errorService.handleServerError(res, error, "Server error");
    }
  };
  
  const getCapTable = async (req: Request, res: Response) => {
    try {
      const capTable = await shareService.getSharesWithUserDetails();
  
      const totalShares = capTable.reduce(
        (sum, entry) => sum + entry.totalShares,
        0
      );
  
      const capTableWithPercentage = capTable.map((entry) => ({
        ...entry,
        ownershipPercentage:
          ((entry.totalShares / totalShares) * 100).toFixed(2) + "%",
      }));
  
      return res.status(200).json({
        success: true,
        message: "Cap table retrieved successfully",
        capTable: capTableWithPercentage,
        totalShares,
      });
    } catch (error) {
      errorService.handleServerError(res, error, "Server error");
    }
  };
  
  const getPurchaseRight = async (req: Request, res: Response) => {
    const userId = req.params.userId;
  
    try {
      const user = await UsersModel.findById(userId);
  
      if (!user) {
        return errorService.handleClientError(res, 400, "User not found");
      }
  
      return res.status(200).json({
        success: true,
        message: "Purchase right retrieved successfully",
        recommendedPurchase: user.recommendedShares,
        purchaseRight: user.purchaseRight,
      });
    } catch (error) {
      console.log(error);
    }
  };
  
  export default {};
  */
