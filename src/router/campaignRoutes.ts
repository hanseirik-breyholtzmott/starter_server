import express from "express";

//Controllers
import campaignController from "../controllers/campaignController";
import userController from "../controllers/userController";

//Middleware
import validateUser from "../middleware/validateUser";

const router = express.Router();

router.get("/api/campaign/:campaignId", campaignController.getCampaign);

router.get(
  "/api/campaign/:campaignId/investment-details",
  campaignController.getInvestmentDetails
);

router.post(
  "/api/campaign/:campaignId/purchase-shares",
  campaignController.purchaseShares
);

router.get("/api/portfolio/:userId", userController.getPortfolio);

export default router;
