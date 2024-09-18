import express from "express";

//Controllers
import campaignController from "../controllers/campaignController";

//Middleware
import validateUser from "../middleware/validateUser";

const router = express.Router();

router.get("/api/campaign/:campaignId", campaignController.getCampaign);

export default router;
