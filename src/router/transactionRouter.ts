import express from "express";

//Controllers
import { transactionController } from "../controllers/transacationController";

//Middleware

const router = express.Router();

// Transaction routes
router.get(
  "/api/transactions/:userId",
  transactionController.getUserTransactions
);
router.get(
  "/api/transaction/:transactionId",
  transactionController.getTransactionById
);

export default router;
