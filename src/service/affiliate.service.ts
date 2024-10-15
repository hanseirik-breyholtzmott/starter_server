import { Types } from "mongoose";

//Models
import AffiliateModel, { IAffiliateModel } from "../models/affiliate.model";

//Services
import userService from "./user.service";

//Utils
import { generateRandomCode } from "../utils/helperFunctions";

const createAffiliate = async (userId: string): Promise<IAffiliateModel> => {
  try {
    //Check if user exists
    const user = await userService.getUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    //Check if user already has an affiliate
    const existingAffiliate = await AffiliateModel.findOne({
      userId: user._id,
    });

    if (existingAffiliate) {
      return existingAffiliate;
    }

    //Create new affiliate

    const affiliate = await AffiliateModel.create({
      userId: user._id,
      affiliateCode: generateRandomCode(6),
    });

    return affiliate;
  } catch (error) {
    console.error("Error creating affiliate:", error);
    throw new Error("Failed to create affiliate");
  }
};

const addReferral = async (
  userId: string,
  referredUserId: string,
  newCustomer: boolean
): Promise<IAffiliateModel> => {
  try {
    const user = await userService.getUserById(userId);
    const referredUser = await userService.getUserById(referredUserId);

    if (!user || !referredUser) {
      throw new Error("User not found");
    }

    const affiliate = await AffiliateModel.findOne({ userId: user._id });

    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    //Check if referred user is already in the affiliate's referral list
    const existingReferral = affiliate.referrals.find(
      (referral) => referral.referredUserId === referredUser._id
    );

    if (existingReferral) {
      throw new Error("User has already been referred");
    }

    //Add referral
    affiliate.referrals.push({
      referredUserId: referredUser._id as Types.ObjectId,
      referredDate: new Date(),
      status: "pending",
    });

    await affiliate.save();

    return affiliate;
  } catch (error) {
    console.error("Error adding referral:", error);
    throw new Error("Failed to add referral");
  }
};

export default {
  createAffiliate,
};

/*


TODO: Add referral
TODO: Reward referral
TODO: Get affiliate by userId


*/
