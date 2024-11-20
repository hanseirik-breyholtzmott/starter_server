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
  const campaignId = req.params.campaignId;

  return res.status(200).json({
    title: "Investering i Folkekraft AS",
    icon: "https://via.placeholder.com/150",
    description:
      "Invest in Folkekraft to get access to our platform and start investing in the stock market.",
    investmentDetails: {
      investmentMinimum: 300,
      investmentMaximum: 100000,
      investmentRecommendation: 1000,
      investmentPurchaseRight: 1000,
    },
    perks: [
      {
        title: "Få 1 000kr",
        value: 0,
        description:
          "Når du blir kunde får du 1000kr for kundefoldet, vi oppforder aller invester til å bli kunde hos oss.",
      },
      /*{
        title: "6 800 kr",
        value: 850,
        description:
          "Dette er det vi ønsker alle våre invester kommer inn med i Folkekraft.",
      },
      {
        title: "10 000 kr",
        value: 1250,
        description:
          "Investerer du 10 000kr eller mer i Folkekraft får du vår strøm til 0kr månedsbeløp og 0kr i påslag.",
      },*/
    ],
    terms: [
      {
        id: 1,
        text: "Investering i unoterte aksjer innebærer høy risiko. Det er viktig at jeg som investor leser investeringstilbudet nøye og gjør meg egen formening om hvilken risiko den eventuelle investeringen innebærer for meg.",
        link: null,
        url: null,
      },
      {
        id: 2,
        text: "Jeg gir med dette min fullmakt til styreleder i utsteder til å tegne aksjer på mine vegne under fremsatte vilkår i forbindelse med vedtak om kapitalutvidelse i selskapets generalforsamling.",
        link: "receive a cash",
        url: null,
      },
      {
        id: 3,
        text: "I understand that investing this amount into several deals would better diversify my risk",
        link: null,
        url: null,
      },
      {
        id: 4,
        text: "I understand that there is no guarantee of a relationship between Republic and Groundfloor post-offering",
        link: null,
        url: null,
      },
    ],
  });
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
  console.log("getCampaigns");
  const campaigns = await campaignService.getAllCampaigns();

  // Transform campaigns into simplified format and sort by closing date
  const simplifiedCampaigns = campaigns
    .sort((a, b) => {
      // Put campaigns without end dates at the end
      if (!a.investmentDetails?.closingDate) return 1;
      if (!b.investmentDetails?.closingDate) return -1;
      return (
        new Date(a.investmentDetails?.closingDate).getTime() -
        new Date(b.investmentDetails?.closingDate).getTime()
      );
    })
    .map((campaign) => ({
      id: campaign._id,
      title: campaign.campaignInfo?.name || "Unnamed Campaign",
      description: campaign.campaignInfo?.description || "",
      displayImage:
        campaign.displayImages[0] || "https://via.placeholder.com/150",
      endDate: campaign.investmentDetails?.closingDate || null,
    }));

  return res.status(200).json(simplifiedCampaigns);
};

export default {
  getCampaign,
  getCampaigns,
  getCampaignInvestmentDetails,
  purchaseShares,
};
