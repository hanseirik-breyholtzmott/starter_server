//Models
import AffiliateModel, { IAffiliateModel } from "../models/affiliate.model";
import ShareModel from "../models/share.model";
import UserModel from "../models/users.model";

//Utils
import { generateRandomCode } from "../utils/helperFunctions";

const affiliateService = {
  async createAffiliate(userId: string): Promise<IAffiliateModel> {
    try {
      const newAffiliate = new AffiliateModel({
        userId,
        affiliateCode: generateRandomCode(6),
      });

      const response = await newAffiliate.save();

      return response;
    } catch (error) {}
  },

  async addReferral(
    userId: string,
    referredUserId: string
  ): Promise<IAffiliateModel | null> {
    try {
      const affiliate = await AffiliateModel.findOne({ userId });
      if (affiliate) {
        affiliate.referrals.push({
          referredUserId,
          referredDate: new Date(),
          status: "pending",
        });
        affiliate.totalReferrals++;
        return await affiliate.save();
      }

      if (!affiliate) {
        return null;
      }
    } catch (error) {}
  },

  async rewardShares(userId: string, shares: number): Promise<void> {
    const affiliate = await AffiliateModel.findOne({ userId });
    if (affiliate) {
      affiliate.totalSharesEarned += shares;
      await affiliate.save();
    }

    const user = await UserModel.findOne({ userId });

    await ShareModel.create({
      userId: affiliate.userId,
      numberOfShares: shares,
      purchaseDate: new Date(),
      purchasePrice: 0,
      ssn: user?.ssn,
    });
  },

  async getAffiliateByUserId(userId: string): Promise<IAffiliateModel | null> {
    try {
      const affiliate = await AffiliateModel.findOne({ userId });
      return affiliate;
    } catch (error) {
      console.error("Error getting affiliate by userId:", error);
      throw error;
    }
  },

  async getAffiliateAndUserInfo(referralCode: string) {
    const affiliate = await AffiliateModel.findOne(
      {
        affiliateCode: referralCode,
      },
      { affiliateCode: 1, userId: 1 }
    );

    if (!affiliate) {
      throw new Error("Affiliate not found");
    }
    const user = await UserModel.findOne(
      { user_id: affiliate.userId },
      { firstName: 1, lastName: 1, email: 1 }
    );
    return { affiliate, user };
  },
};

export default affiliateService;
