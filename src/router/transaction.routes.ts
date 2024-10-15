import express from "express";

//Controllers
import transactionController from "../controllers/transaction.controller";

const router = express.Router();

// Transaction routes
router.get("/:userId/transactions", transactionController.getUserTransactions);

export default router;
