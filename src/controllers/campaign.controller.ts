import { Request, Response } from "express";

//Services
import userService from "../service/user.service";
import shareService from "../service/share.service";
import notificationService from "../service/notification.service";
import transactionService from "../service/transaction.service";
import emailService from "../service/email.service";
import campaignService from "../service/campaign.service";
import companyService from "../service/company.service";
import shareTransactionService from "../service/shareTransaction.service";

//Models
import TransactionModel, { ITransaction } from "../models/transaction.model";
import SharesModel, { IShare, IShareModel } from "../models/share.model";
import CampaignModel, {
  ICampaignModel,
  ICampaign,
} from "../models/campaign.model";
import ShareTransactionModel, {
  IShareTransaction,
} from "../models/shareTransaction.model";
import { Types } from "mongoose";

//Logger
import { campaignLogger } from "../logger";

const getCampaign = async (req: Request, res: Response) => {
  const campaignId = req.params.campaignId;

  // Get campaign and verify it exists
  const campaign = await campaignService.getCampaign(campaignId);
  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: "Campaign not found",
    });
  }

  // Get investment statistics
  const targetAmount = campaign.investmentDetails.targetAmount;
  const totalInvestments = await campaignService.countInvestments(campaignId);
  const totalInvested = await campaignService.countInvested(campaignId);

  // Calculate percentage with safety check for division by zero
  const percentageInvested =
    targetAmount > 0 ? (totalInvested / targetAmount) * 100 : 0;

  console.log("originalTargetAmount: ", targetAmount);
  console.log("totalInvestments: ", totalInvestments); //wrong
  console.log("totalInvested: ", totalInvested); //wrong
  console.log("percentageInvested: ", percentageInvested); //wrong

  // Get company cap table
  const capTable = await shareService.getCapTable(
    campaign.companyId.toString()
  );

  // Calculate new total amount including starting amount
  const totalAmount = campaign.investmentDetails.startAmount + totalInvested;

  // Update campaign investment details
  campaign.investmentDetails = {
    ...campaign.investmentDetails,
    startAmount: campaign.investmentDetails.startAmount,
    targetAmount: targetAmount,
    maximumInvestment: campaign.investmentDetails.maximumInvestment, // Keeping original maximum investment
  };

  //const totalInvestments = await campaignService.countInvestments(campaignId);

  console.log("totalInvestments: ", totalInvestments);
  console.log("totalInvested: ", totalInvested);
  console.log("sharePrice: ", campaign.investmentDetails.sharePrice);

  //const totalInvested = await campaignService.countInvested(campaignId);

  console.log(campaign.investmentDetails);

  return res.status(200).json({
    campaign,
    caplist: {
      investors: capTable,
      totalInvestments,
      totalInvested: totalAmount, // Using actual calculated total instead of hardcoded multiplication
    },
    percentageInvested: Math.round(percentageInvested * 100) / 100,
  });
};

const getCampaignInvestmentDetails = async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId;

    // Get campaign and verify it exists
    const campaign = await campaignService.getCampaign(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Get company details
    const company = await companyService.getCompanyById(
      campaign.companyId.toString()
    );
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Calculate available shares
    const totalInvested = await campaignService.countInvested(campaignId);
    const availableShares = Math.floor(
      (campaign.investmentDetails.targetAmount - totalInvested) /
        campaign.investmentDetails.sharePrice
    );

    return res.status(200).json({
      companyName: campaign.campaignInfo.name,
      description: campaign.campaignInfo.description,
      ceo: company.ceo,
      investmentDetails: {
        sharePrice: campaign.investmentDetails.sharePrice,
        shareClassId: campaign.investmentDetails.shareClassId,
        availableShares: availableShares,
        minSharePurchase: campaign.investmentDetails.minimumInvestment,
        maxSharePurchase: campaign.investmentDetails.maximumInvestment || null,
      },
      bankAccount: {
        accountNumber: campaign.bankAccount.accountNumber,
        bankName: campaign.bankAccount.bankName,
        accountHolderName: campaign.bankAccount.accountHolderName,
      },
      perks: campaign.perks || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching campaign investment details",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const purchaseShares = async (req: Request, res: Response) => {
  campaignLogger.info("Starting purchase shares process", {
    action: "purchaseShares",
    status: "started",
  });

  try {
    const campaignId = req.params.campaignId;
    const { userId, shareNumber, ssn } = req.body;

    campaignLogger.info("Purchase shares request received", {
      campaignId,
      userId,
      shareNumber,
      action: "purchaseShares",
    });

    const user = await userService.getUserById(userId);

    if (!user) {
      campaignLogger.error("User not found", {
        userId,
        action: "purchaseShares",
      });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    campaignLogger.info("User found", {
      userId,
      email: user.primaryEmailAddress,
      action: "purchaseShares",
    });

    const campaign = await campaignService.getCampaign(campaignId);

    if (!campaign) {
      campaignLogger.error("Campaign not found", {
        campaignId,
        action: "purchaseShares",
      });
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }
    campaignLogger.info("Campaign found", {
      campaignId,
      campaignName: campaign.campaignInfo.name,
      action: "purchaseShares",
    });

    const company = await companyService.getCompanyById(
      campaign.companyId.toString()
    );
    if (!company) {
      campaignLogger.error("Company not found", {
        companyId: campaign.companyId,
        action: "purchaseShares",
      });
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }
    campaignLogger.info("Company found", {
      companyId: company._id,
      companyName: company.name,
      action: "purchaseShares",
    });

    // Create transaction
    campaignLogger.info("Creating transaction", {
      userId,
      amount: shareNumber * campaign.investmentDetails.sharePrice,
      action: "purchaseShares",
    });

    const newTransaction: ITransaction = {
      userId: user._id as Types.ObjectId,
      paymentMethod: "bank_transfer",
      stripePaymentId: "transaction",
      transactionType: "shares_purchase",
      amount: shareNumber * campaign.investmentDetails.sharePrice,
      currency: "NOK",
      status: "pending",
      taxAmount: 0,
      taxRate: 0,
      transactionDate: new Date(),
    };

    const transaction = await transactionService.createTransaction(
      newTransaction
    );
    campaignLogger.info("Transaction created", {
      transactionId: transaction._id,
      action: "purchaseShares",
    });

    // Create share
    let identifierType: "ssn" | "registrationNumber" =
      ssn.length === 11 ? "ssn" : "registrationNumber";
    const newShare: IShare = {
      userId: user._id as Types.ObjectId,
      companyId: company._id as Types.ObjectId,
      initialShares: shareNumber,
      remainingShares: shareNumber,
      purchaseDate: new Date(),
      purchasePrice: campaign.investmentDetails.sharePrice,
      transactions: [transaction._id as Types.ObjectId],
      shareClassId: campaign.investmentDetails.shareClassId,
      identifier: {
        type: identifierType,
        value: ssn,
      },
      shareStatus: "active",
      isLocked: false,
    };

    const share = await shareService.createShare(newShare);
    campaignLogger.info("Share created", {
      shareId: share._id,
      action: "purchaseShares",
    });

    // Create share transaction
    const newShareTransaction: IShareTransaction = {
      userId: user._id as Types.ObjectId,
      companyId: company._id as Types.ObjectId,
      shareClassId: campaign.investmentDetails.shareClassId,
      totalAmount: shareNumber * campaign.investmentDetails.sharePrice,
      status: "pending",
      shareId: share._id as Types.ObjectId,
      transactionId: transaction._id as Types.ObjectId,
      transactionType: "buy",
      quantity: shareNumber,
      pricePerShare: campaign.investmentDetails.sharePrice,
      transactionDate: new Date(),
    };

    const shareTransaction =
      await shareTransactionService.createShareTransaction(newShareTransaction);
    campaignLogger.info("Share transaction created", {
      shareTransactionId: shareTransaction._id,
      action: "purchaseShares",
    });

    // Create notification
    const notification = await notificationService.createNotification(
      user._id.toString(),
      "Aksjer kjøpt",
      `Du har kjøpt ${shareNumber} aksjer.`
    );
    campaignLogger.info("Notification created", {
      notificationId: notification._id,
      action: "purchaseShares",
    });

    // Send email
    try {
      campaignLogger.info("Attempting to send email", {
        recipient: user.primaryEmailAddress,
        action: "purchaseShares",
      });

      const emailResult = await emailService.sendEmail(
        user.primaryEmailAddress,
        "Bekreftelse på kjøp av aksjer",
        `Du har kjøpt ${shareNumber} aksjer i ${company.name}.`,
        `
          <h1>Kjøpsbekreftelse</h1>
          <p>Hei ${user.firstName},</p>
          <p>Du har kjøpt ${shareNumber} aksjer i ${company.name}.</p>
          <p>Kjøpssum: NOK ${
            shareNumber * campaign.investmentDetails.sharePrice
          }</p>
          <p>Dato: ${new Date().toLocaleDateString("no-NO")}</p>
          <br>
          <p>Med vennlig hilsen<br>Folkekraft AS</p>
        `
      );

      campaignLogger.info("Email sent successfully", {
        emailResult,
        action: "purchaseShares",
      });
    } catch (error) {
      campaignLogger.error("Failed to send email", {
        error: error instanceof Error ? error.message : String(error),
        action: "purchaseShares",
      });
    }

    campaignLogger.info("Purchase shares process completed successfully", {
      userId,
      campaignId,
      shareNumber,
      action: "purchaseShares",
      status: "completed",
    });

    return res.status(200).json({
      success: true,
      message: `Du har tegnet deg ${shareNumber} aksjer i ${company.name}.`,
    });
  } catch (error) {
    campaignLogger.error("Purchase shares process failed", {
      error: error instanceof Error ? error.message : String(error),
      action: "purchaseShares",
      status: "failed",
    });

    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your purchase",
    });
  }
};

const getCampaigns = async (req: Request, res: Response) => {
  try {
    const campaigns = await campaignService.getAllCampaigns();

    // Transform campaigns into enhanced format and sort by closing date
    const enhancedCampaigns = campaigns
      .sort((a, b) => {
        // Put campaigns without end dates at the end
        if (!a.investmentDetails?.closingDate) return 1;
        if (!b.investmentDetails?.closingDate) return -1;
        return (
          new Date(a.investmentDetails.closingDate).getTime() -
          new Date(b.investmentDetails.closingDate).getTime()
        );
      })
      .map((campaign) => {
        // Calculate remaining days if end date exists
        let daysRemaining = null;
        const now = new Date();
        if (campaign.investmentDetails?.closingDate) {
          const endDate = new Date(campaign.investmentDetails.closingDate);
          const diffTime = endDate.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
          id: campaign._id,
          title: campaign.campaignInfo?.name || "Unnamed Campaign",
          description: campaign.campaignInfo?.description || "",
          companyName: campaign.campaignInfo?.name || "",
          tags: campaign.campaignInfo?.tags || [],
          displayImage:
            campaign.displayImages?.[0]?.image ||
            "https://via.placeholder.com/150",
          iconImage:
            campaign.campaignInfo?.iconImage ||
            "https://via.placeholder.com/32",
          startDate: campaign.investmentDetails?.startDate || null,
          endDate: campaign.investmentDetails?.closingDate || null,
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        };
      });

    return res.status(200).json(enhancedCampaigns);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch campaigns",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default {
  getCampaign,
  getCampaigns,
  getCampaignInvestmentDetails,
  purchaseShares,
};
