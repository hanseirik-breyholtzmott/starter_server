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
import { ICampaign } from "../models/campaign.model";
import ShareTransactionModel, {
  IShareTransaction,
} from "../models/shareTransaction.model";
import { Types } from "mongoose";

//Logger
import { campaignLogger } from "../logger";

const getCampaign = async (req: Request, res: Response) => {
  const campaignId = req.params.campaignId;

  //get campaign
  const campaign = await campaignService.getCampaign(campaignId);

  console.log("companyId: ", campaign.companyId.toString());

  //get captable
  const capTable = await shareService.getCapTable(
    campaign.companyId.toString()
  );

  return res.status(200).json({
    campaign: campaign,
    caplist: {
      investors: capTable,
      totalShares: 0,
    },
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
      investmentMaximum: 10000,
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
      {
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
      },
    ],
    terms: [
      {
        id: 1,
        text: "I understand that I can cancel my investment up until 10/30/24 (48 hours prior to the deal deadline)",
        link: null,
        url: null,
      },
      {
        id: 2,
        text: "I understand that Republic will receive a cash and securities commission as further detailed in the offering documents",
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
  const campaignId = req.params.campaignId;
  const { userId, shareNumber, ssn } = req.body;

  const user = await userService.getUserById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const campaign = await campaignService.getCampaign(campaignId);

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: "Campaign not found",
    });
  }

  const company = await companyService.getCompanyById(
    campaign.companyId.toString()
  );

  if (!company) {
    return res.status(404).json({
      success: false,
      message: "Company not found",
    });
  }

  //Create a new transaction
  const newTransaction: ITransaction = {
    userId: user._id as Types.ObjectId,
    paymentMethod: "bank_transfer",
    stripePaymentId: "transaction",
    transactionType: "shares_purchase",
    amount: shareNumber * 8,
    currency: "NOK",
    status: "pending",
    taxAmount: 0,
    taxRate: 0,
    transactionDate: new Date(),
  };

  const transaction = await transactionService.createTransaction(
    newTransaction
  );

  let identifierType: "ssn" | "registrationNumber" = "ssn";
  let identifierValue: string = ssn;

  //Ssn
  if (ssn.length == 11) {
    identifierType = "ssn";
    identifierValue = ssn;
  } else {
    identifierType = "registrationNumber";
    identifierValue = ssn;
  }

  //Create a new shares entry
  const newShare: IShare = {
    userId: user._id as Types.ObjectId,
    companyId: company._id as Types.ObjectId,
    initialShares: shareNumber,
    remainingShares: shareNumber,
    purchaseDate: new Date(),
    purchasePrice: 8,
    transactions: [transaction._id as Types.ObjectId],
    shareClassId: new Types.ObjectId("66fffe0f471d04c7b175965c"),
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
    shareClassId: new Types.ObjectId("66fffe0f471d04c7b175965c"),
    totalAmount: shareNumber * 8,
    status: "pending",
    shareId: share._id as Types.ObjectId,
    transactionId: transaction._id as Types.ObjectId,
    transactionType: "buy",
    quantity: shareNumber,
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
    "Du har kjøpt " + shareNumber + " aksjer."
  );

  //Send email to user
  const emailResult = await emailService.sendEmail(
    user.primaryEmailAddress,
    "Bekreftelse på kjøp av aksjer",
    `You have successfully purchased ${shareNumber} shares.`,
    `<h1>Share Purchase Confirmation</h1><p>You have successfully purchased ${shareNumber} shares.</p>`
  );

  if (!emailResult.success) {
    console.error("Failed to send confirmation email:", emailResult.error);
  }

  return res.status(200).json({
    success: true,
    message: `Du har tegnet deg ${shareNumber} aksjer i Folkekraft AS.`,
  });
};

export default {
  getCampaign,
  getCampaignInvestmentDetails,
  purchaseShares,
};
