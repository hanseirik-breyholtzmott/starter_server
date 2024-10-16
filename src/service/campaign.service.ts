import { Types } from "mongoose";

//Models
import CompanyModel, { ICompanyModel, ICompany } from "../models/company.model";
import { IUserModel } from "../models/users.model";
import ShareModel, { IShareModel } from "../models/share.model";
import CampaignModel, {
  ICampaignModel,
  ICampaign,
} from "../models/campaign.model";

const createCampaign = async (
  campaignData: ICampaign
): Promise<ICampaignModel> => {
  try {
    const campaign = await CampaignModel.create(campaignData);
    return await campaign.save();
  } catch (error) {
    console.error("Error creating campaign:", error);
    throw new Error("Failed to create campaign");
  }
};

const getCampaign = async (campaignId: string): Promise<ICampaignModel> => {
  try {
    const campaign = await CampaignModel.findById(campaignId);
    return campaign;
  } catch (error) {
    console.error("Error getting campaign:", error);
    throw new Error("Failed to get campaign");
  }
};

const countInvested = async (campaignId: string): Promise<number> => {
  try {
    const campaign = await CampaignModel.findById(campaignId);

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const startDate = campaign.investmentDetails.startDate;
    const closingDate = campaign.investmentDetails.closingDate;
    const pricePerShare = campaign.investmentDetails.sharePrice;

    const result = await ShareModel.aggregate([
      {
        $match: {
          companyId: campaign.companyId,
          shareClassId: campaign.investmentDetails.shareClassId,
          purchaseDate: { $gte: startDate, $lte: closingDate },
        },
      },
      {
        $group: {
          _id: null,
          totalShares: { $sum: "$initialShares" },
        },
      },
    ]);

    const totalShares = result.length > 0 ? result[0].totalShares : 0;
    const totalInvested = totalShares * pricePerShare;

    return totalInvested;
  } catch (error) {
    console.error("Error counting invested shares:", error);
    throw new Error("Failed to count invested shares");
  }
};

const countInvestments = async (campaignId: string): Promise<number> => {
  try {
    const campaign = await CampaignModel.findById(campaignId);

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const startDate = campaign.investmentDetails.startDate;
    const closingDate = campaign.investmentDetails.closingDate;

    const investments = await ShareModel.countDocuments({
      companyId: campaign.companyId,
      shareClassId: campaign.investmentDetails.shareClassId,
      purchaseDate: { $gte: startDate, $lte: closingDate },
    });

    return investments;
  } catch (error) {
    console.error("Error counting investments:", error);
    throw new Error("Failed to count investments");
  }
};

export default {
  createCampaign,
  getCampaign,
  countInvestments,
  countInvested,
};
