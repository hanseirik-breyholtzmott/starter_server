import { Router } from "express";

//Controller
import affilaiteController from "../controllers/affiliateController";

const router = Router();

router.get(
  "/api/get/referral/:referralCode",
  affilaiteController.getAffiliateAndUserInfo
);

export default router;
