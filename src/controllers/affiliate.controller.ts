import { Request, Response } from "express";

//Service
import affiliateService from "../service/affiliateService";

//Make this return an affiliate link for the user
const createAffiliate = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    await affiliateService.createAffiliate(userId);
    return res.status(200).json({ message: "Affiliate created successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error creating affiliate", error });
  }
};

//TODO: Make sure to add controlls and checks for if the user can refer themselves or anyone that has had an account before
const addReferral = async (req: Request, res: Response) => {
  try {
    const { userId, referralCode } = req.body;
    const updatedAffiliate = await affiliateService.addReferral(
      userId,
      referralCode
    );
    if (updatedAffiliate) {
      return res.status(200).json({ message: "Affiliate added successfully" });
    } else {
      return res.status(400).json({ message: "Error adding affiliate" });
    }
  } catch (error) {
    res.status(400).json({ message: "Error adding affiliate", error });
  }
};

const rewardAffiliate = async (req: Request, res: Response) => {
  try {
    const { affilaiteId, shares } = req.body;
    await affiliateService.rewardShares(affilaiteId, shares);

    return res.status(200).json({ message: "Affiliate rewarded successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error rewarding affiliate", error });
  }
};

const getAffiliate = async (req: Request, res: Response) => {
  const { referralCode } = req.params;

  try {
    const info = await affiliateService.getAffiliateAndUserInfo(referralCode);
    return res.status(200).json(info);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error getting affiliate and user info", error });
  }
};

export default {
  createAffiliate,
  addReferral,
  rewardAffiliate,
  getAffiliate,
};
