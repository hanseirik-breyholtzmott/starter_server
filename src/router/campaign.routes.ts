import express from "express";

//Controllers
import campaignController from "../controllers/campaign.controller";

//Middleware

const router = express.Router();

router.get("/all", campaignController.getCampaigns);

router.get("/:campaignId", campaignController.getCampaign);

router.get(
  "/:campaignId/investment-details",
  campaignController.getCampaignInvestmentDetails
);

router.post("/:campaignId/purchase-shares", campaignController.purchaseShares);

export default router;
