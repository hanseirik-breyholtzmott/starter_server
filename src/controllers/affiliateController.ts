import { Request, Response } from "express";

//Service
import affiliateService from "../service/affiliateService";

//Service

export const affiliateController = {
  async createAffiliate(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      await affiliateService.createAffiliate(userId);
      return res
        .status(200)
        .json({ message: "Affiliate created successfully" });
    } catch (error) {
      res.status(400).json({ message: "Error creating affiliate", error });
    }
  },

  async addReferral(req: Request, res: Response) {
    try {
      const { userId, referralCode } = req.body;
      const updatedAffiliate = await affiliateService.addReferral(
        userId,
        referralCode
      );
      if (updatedAffiliate) {
        return res
          .status(200)
          .json({ message: "Affiliate added successfully" });
      } else {
        return res.status(400).json({ message: "Error adding affiliate" });
      }
    } catch (error) {
      res.status(400).json({ message: "Error adding affiliate", error });
    }
  },

  async rewardAffiliate(req: Request, res: Response) {
    try {
      const { affilaiteId, shares } = req.body;
      await affiliateService.rewardShares(affilaiteId, shares);

      return res
        .status(200)
        .json({ message: "Affiliate rewarded successfully" });
    } catch (error) {
      res.status(400).json({ message: "Error rewarding affiliate", error });
    }
  },

  async getAffiliateAndUserInfo(req: Request, res: Response) {
    const { referralCode } = req.params;
    console.log(referralCode);
    try {
      const info = await affiliateService.getAffiliateAndUserInfo(referralCode);
      return res.status(200).json(info);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error getting affiliate and user info", error });
    }
  },
};

export default affiliateController;
