import express from "express";

//Controllers
import transactionController from "../controllers/transaction.controller";
import authenticate from "../middleware/authenticate";

const router = express.Router();

// Route to get user transactions
router.get("/:userId", authenticate, transactionController.getUserTransactions);

export default router;
