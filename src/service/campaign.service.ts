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

export default {
  createCampaign,
  getCampaign,
};
