import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import axios from "axios";
import { ObjectId, Types } from "mongoose";

//Services
import userService from "../service/user.service";
import authService from "../service/auth.service";
import sessionService from "../service/session.service";
import emailService from "../service/email.service";
import companyService from "../service/company.service";
import portfolioService from "../service/portfolio.service";
import shareService from "../service/share.service";
//Models
import UserModel, { IUser } from "../models/users.model";
import CompanyModel, { ICompany } from "../models/company.model";
import ShareModel, { IShare } from "../models/share.model";
import mongoose from "mongoose";

//Logger
import { userLogger } from "../logger";

//Authenticate
import { AuthenticatedRequest } from "../middleware/authenticate";

//Utils
import {
  OK,
  CREATED,
  BAD_REQUEST,
  UNAUTHORIZED,
  NOT_FOUND,
  INTERNAL_SERVER_ERROR,
} from "../utils/contants";
import { ONE_HOUR_MS, ONE_MONTH_MS } from "../utils/date";
import { signToken, verifyToken, refreshTokenOptions } from "../utils/jwt";
import { generateVerificationToken } from "../utils/helperFunctions";

//Process Data
import DataProcess from "../utils/processData";

const getPortfolio = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.params.userId;
    console.log("This is the userId", userId);

    const user = await userService.getUserById(userId);

    const companyId = "670e22a15e46088b38c9fc75";

    const company = await companyService.getCompanyById(companyId);

    const portfolio = await portfolioService.getUserPortfolio(userId);

    const processedData = DataProcess.processUserPortfolio(portfolio);

    console.log("This is the processedData", processedData);

    //console.log("This is the portfolio", processedData);

    //const capTable = await shareService.getCapTable("670e22a15e46088b38c9fc75"); //needs to be fixed

    //console.log("This is the capTable", capTable);

    return res.status(OK).json({
      processedData,
      portfolio,
      //capTable,
    });
  } catch (error) {
    return res.status(INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

export default {
  getPortfolio,
};

/*

Run this

const company: ICompany = {
      name: "Folkekraft AS",
      establishedDate: new Date("2022-09-27"),
      registrationNumber: "830068112",
      active: true,
    };

    const newCompany = await companyService.createCompany(company);

    const result = await ShareModel.updateMany(
      {},
      { $set: { companyId: newCompany._id } }
    );

    const shareClassInvestor = {
      name: "Investor",
      votingRights: true,
      dividendRights: true,
    };

    const shareClassKunde = {
      name: "Kunde",
      votingRights: true,
      dividendRights: true,
    };

    const newShareClassInvestor = await companyService.addShareClass(
      newCompany._id as string,
      shareClassInvestor
    );

    const newShareClassKunde = await companyService.addShareClass(
      newCompany._id as string,
      shareClassKunde
    );

    const shareClassIdInvestor = await companyService.getShareClassById(
      "66fff43761a1d03b2bca7089",
      "66fffe0f471d04c7b175965c"
    );

    const id = shareClassIdInvestor?._id;

    console.log("This is the id", id);

    const result = await ShareModel.updateMany(
      {
        $or: [
          { shareStatus: "active" }, // Match shares where shareStatus is "active"
          { shareClass: { $exists: false } }, // Match shares where shareClass is missing
        ],
      },
      { $set: { shareClass: id } } // Set or update the shareClass
    );

    */

/*
const getPortfolio = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  console.log("This is the userId", userId);

  try {
    const user = await userService.userExists(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found.",
      });
    }

    //Check if user has an affiliate

    //if not create one

    let affiliate = await affiliateService.getAffiliateByUserId(userId);
    if (!affiliate) {
      affiliate = await affiliateService.createAffiliate(userId);
    }

    const referralLink = `${process.env.CLIENT_BASE_URL}/bestill?ref=${affiliate.affiliateCode}`;

    //count the share that are locked
    const lockedShares = await sharesService.sumLockedSharesByUserId(userId);

    //count the shares that are referral bonus
    const referralBonusShares =
      await sharesService.sumReferralBonusSharesByUserId(userId);

    //count the shares that are not referral bonus and not locked
    const activeNonReferralShares =
      await sharesService.sumActiveNonReferralSharesByUserId(userId);

    const transactions = await transactionService.getTransactionsByUserId(
      userId
    );

    return res.status(200).json({
      success: true,
      data: {
        totalInvested: activeNonReferralShares * 8, // Total amount invested by the user
        totalShares: activeNonReferralShares, // Total number of shares owned by the user
        currentValue: {
          totalAmount:
            activeNonReferralShares * 8 +
            referralBonusShares * 12 +
            lockedShares * 12, // Total current value of all shares
          percentageChange: 0, // Percentage change in value from initial investment
        },
        investments: {
          totalShares: activeNonReferralShares, // Total number of shares acquired from investments
          totalValue: activeNonReferralShares * 8, // Total current value of those shares
          customerShares: {
            total: lockedShares / 84, // Total number of shares owned directly by the customer
            shares: lockedShares,
            value: lockedShares * 12, // Current value of the customer shares
          },
          referralShares: {
            total: referralBonusShares / 25, // Total shares acquired from referrals
            shares: referralBonusShares,
            value: referralBonusShares * 12, // Current value of referral-acquired shares
          },
        },
        portfolioSummary: {
          investorSharesValue: activeNonReferralShares * 8, // Total value of investor-acquired shares
          customerSharesValue: lockedShares * 12, // Total value of customer-owned shares
          referralSharesValue: referralBonusShares * 12, // Total value of shares acquired from referrals
          accountDetails: [], // Array of account data for further details
        },
        referralLink: referralLink,
        transactions: transactions, // Array to hold user transaction details
      },
    });
  } catch (error) {
    errorService.handleServerError(res, error, "Server error");
  }
}; */
