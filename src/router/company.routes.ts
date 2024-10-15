import express from "express";

const router = express.Router();

//Controllers
import shareController from "../controllers/share.controller";

//Routes
router.post("/:companyId/shares/buy", shareController.purchaseNewShares);

export default router;
