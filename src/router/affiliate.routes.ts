import { Router } from "express";

//Controller
import affilaiteController from "../controllers/affiliate.controller";

const router = Router();

router.get("/api/get/referral/:referralCode", affilaiteController.getAffiliate);

export default router;
