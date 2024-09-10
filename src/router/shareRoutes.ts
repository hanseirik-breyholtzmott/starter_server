import express from "express";

//Controllers
import userController from "../controllers/userController";
import shareController from "../controllers/shareController";

//Middleware
import validateUser from "../middleware/validateUser";

const router = express.Router();

//In use
router.post("/api/purchaseshares", shareController.purchaseShares);

router.get("/api/totalshares/:userId", shareController.totalSharesByUserId);

router.get("/api/folkekraft/:userId", shareController.campaginInfo);

router.get("/api/cap-table", shareController.getCapTable);

router.post(
  "/api/create-user-with-shares",
  userController.createUserWithSharesAndTransaction
);

router.get("/api/investor/:userId", shareController.getPurchaseRight);

export default router;
