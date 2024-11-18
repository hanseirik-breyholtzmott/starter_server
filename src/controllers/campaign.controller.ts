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
import CampaignModel, { ICampaign } from "../models/campaign.model";
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
  const originalTargetAmount = campaign.investmentDetails.targetAmount;
  const totalInvestments = await campaignService.countInvestments(campaignId);
  const totalInvested = await campaignService.countInvested(campaignId);
  const percentageInvested = (totalInvested / totalInvestments) * 100;

  console.log("originalTargetAmount: ", originalTargetAmount);
  console.log("totalInvestments: ", totalInvestments); //wrong
  console.log("totalInvested: ", totalInvested); //wrong
  console.log("percentageInvested: ", percentageInvested); //wrong

  // Get company cap table
  const capTable = await shareService.getCapTable(
    campaign.companyId.toString()
  );

  // Update campaign investment details
  campaign.investmentDetails = {
    ...campaign.investmentDetails,
    startAmount: campaign.investmentDetails.startAmount + totalInvested,
    targetAmount: totalInvestments,
    maximumInvestment:
      campaign.investmentDetails.startAmount / originalTargetAmount,
  };

  //const totalInvestments = await campaignService.countInvestments(campaignId);

  console.log("totalInvestments: ", totalInvestments);

  //const totalInvested = await campaignService.countInvested(campaignId);

  // Calculate percentage of investment progress
  //const percentageInvested = (totalInvested / totalInvestments) * 100;

  //get captable
  /*const capTable = await shareService.getCapTable(
    campaign.companyId.toString()
  );*/

  return res.status(200).json({
    campaign,
    caplist: {
      investors: capTable,
      totalInvestments,
      totalInvested:
        campaign.investmentDetails.startAmount + totalInvestments * 8,
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
  const campaignId = req.params.campaignId;
  const { userId, shareNumber, ssn } = req.body;

  console.log("userId: ", userId);
  console.log("shareNumber: ", shareNumber);
  console.log("ssn: ", ssn);

  const user = await userService.getUserById(userId);

  if (!user) {
    console.log("User not found");
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const campaign = await campaignService.getCampaign(campaignId);

  if (!campaign) {
    console.log("Campaign not found");
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
